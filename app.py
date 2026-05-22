

from flask import Flask, request, jsonify, send_file, send_from_directory
from flask_socketio import SocketIO, join_room
from flask_cors import CORS
import os
import uuid
import json
import hashlib
import threading
from parallel_inference import get_vit_result_only
from db import init_db, get_db_connection
from auth import auth_bp
from report_generator import generate_report

app = Flask(__name__, static_folder='dist', static_url_path='/')
app.config['SECRET_KEY'] = 'deepshield-secret-2025'

# Allow CORS for all origins in production or specifically your frontend URL
CORS(app, origins='*') 
socketio = SocketIO(app, cors_allowed_origins='*', async_mode='threading')

init_db()
app.register_blueprint(auth_bp)

UPLOAD_FOLDER = 'uploads'
os.makedirs(UPLOAD_FOLDER, exist_ok=True)


# ── Utilities ────────────────────────────────────────────────────────────────

def compute_file_hash(file_path):
    """Return SHA-256 hex digest of the file at file_path."""
    sha256 = hashlib.sha256()
    with open(file_path, 'rb') as f:
        for chunk in iter(lambda: f.read(65536), b''):
            sha256.update(chunk)
    return sha256.hexdigest()


def mock_send_email(user_email, filename, verdict):
    print(
        f"\n============================================\n"
        f"[MOCK EMAIL SMTP] -> Delivered to {user_email}\n"
        f"Subject: DeepShield Analysis Complete\n"
        f"Body: The scan for '{filename}' finished.\n"
        f"Verdict: {verdict}\n"
        f"============================================\n"
    )


# ── Static / frame serving ───────────────────────────────────────────────────

@app.route('/temp_frames/<path:filename>')
def serve_frames(filename):
    return send_from_directory('temp_frames', filename)


# ── WebSocket events ─────────────────────────────────────────────────────────

@socketio.on('connect')
def on_connect():
    print(f"[WS] Client connected: {request.sid}")


@socketio.on('disconnect')
def on_disconnect():
    print(f"[WS] Client disconnected: {request.sid}")


@socketio.on('join')
def on_join(data):
    """Client joins a private room keyed by session_id (one per scan)."""
    session_id = data.get('session_id')
    if session_id:
        join_room(session_id)
        print(f"[WS] {request.sid} joined room {session_id}")


# ── Main predict endpoint ────────────────────────────────────────────────────

@app.route('/predict', methods=['POST'])
def predict():
    file        = request.files['video']
    scan_mode   = request.form.get('scan_mode', 'deep')
    user_email  = request.form.get('user_email', '')
    session_id  = request.form.get('session_id', '')

    frames_to_sample = 3 if scan_mode == 'quick' else 10

    # Save file locally
    save_path = os.path.join(UPLOAD_FOLDER, file.filename)
    file.save(save_path)

    # Notify client that upload arrived
    def emit_progress(stage, progress, message):
        if session_id:
            socketio.emit(
                'progress',
                {'stage': stage, 'progress': progress, 'message': message},
                room=session_id,
            )
            # Removed eventlet.sleep(0) as eventlet is removed

    emit_progress('upload_received', 10, 'Upload received...')

    # ── Feature 3: File hash deduplication ───────────────────────────────────
    file_hash = compute_file_hash(save_path)
    conn = get_db_connection()
    cached_row = conn.execute(
        'SELECT * FROM scan_history WHERE file_hash = ? LIMIT 1', (file_hash,)
    ).fetchone()
    conn.close()

    if cached_row:
        cached_row = dict(cached_row)
        frames         = json.loads(cached_row['frames'])         if cached_row['frames']         else []
        heatmap_frames = json.loads(cached_row['heatmap_frames']) if cached_row['heatmap_frames'] else []
        frame_results  = json.loads(cached_row['frame_results'])  if cached_row.get('frame_results') else []
        mean_probs     = json.loads(cached_row['mean_probs'])     if cached_row.get('mean_probs') else []
        emit_progress('complete', 100, 'Complete! (instant cached result)')
        return jsonify({
            'result':         cached_row['verdict'],
            'confidence':     float(cached_row['confidence']),
            'frames':         frames,
            'heatmap_frames': heatmap_frames,
            'frame_results':  frame_results,
            'mean_probs':     mean_probs,
            'file_hash':      file_hash,
            'cached':         True,
            'model':          'ViT (Vision Transformer)',
        })

    # ── Feature 1 + 2: Inference with live progress + GradCAM ────────────────
    result, confidence, frame_results, mean_probs, heatmap_frames = get_vit_result_only(
        save_path,
        frames_to_sample=frames_to_sample,
        progress_cb=emit_progress,
    )

    # Format frame results for API compatibility
    frames = [f.get('frame_path', '') for f in frame_results]

    if user_email:
        threading.Thread(
            target=mock_send_email,
            args=(user_email, file.filename, result),
            daemon=True,
        ).start()

    emit_progress('complete', 100, 'Complete!')

    return jsonify({
        'result':         result,
        'confidence':     float(confidence),
        'frames':         frames,
        'heatmap_frames': heatmap_frames,
        'frame_results':  frame_results,  # Include detailed per-frame results
        'mean_probs':     mean_probs,
        'file_hash':      file_hash,
        'cached':         False,
        'model':          'ViT (Vision Transformer)',
    })


# ── Developer API endpoint ───────────────────────────────────────────────────

@app.route('/api/analyze', methods=['POST'])
def api_analyze():
    api_key = request.headers.get('X-API-Key')
    if not api_key:
        return jsonify({'error': 'X-API-Key header missing'}), 401

    conn  = get_db_connection()
    user  = conn.execute('SELECT id FROM users WHERE api_key = ?', (api_key,)).fetchone()
    conn.close()

    if not user:
        return jsonify({'error': 'Invalid API Key'}), 403

    if 'video' not in request.files:
        return jsonify({'error': 'No video file provided'}), 400

    file      = request.files['video']
    save_path = os.path.join(UPLOAD_FOLDER, file.filename)
    file.save(save_path)

    result, confidence, frame_results, mean_probs, heatmap_frames = get_vit_result_only(save_path, frames_to_sample=10)

    return jsonify({'result': result, 'confidence': float(confidence)}), 200


# ── History endpoints ─────────────────────────────────────────────────────────

@app.route('/history', methods=['POST'])
def add_history():
    data           = request.json
    user_id        = data.get('user_id')
    filename       = data.get('filename')
    verdict        = data.get('verdict')
    confidence     = data.get('confidence')
    frames         = data.get('frames', [])
    heatmap_frames = data.get('heatmap_frames', [])
    file_hash      = data.get('file_hash', '')
    frame_results  = data.get('frame_results', [])
    mean_probs     = data.get('mean_probs', [])

    if user_id is None or filename is None or verdict is None or confidence is None:
        return jsonify({'error': 'Missing data'}), 400

    scan_uuid       = str(uuid.uuid4())
    frames_str      = json.dumps(frames)
    heatmap_str     = json.dumps(heatmap_frames)
    frame_results_str = json.dumps(frame_results)
    mean_probs_str  = json.dumps(mean_probs)

    conn = get_db_connection()
    conn.execute(
        '''INSERT INTO scan_history
               (user_id, uuid, filename, verdict, confidence, frames, heatmap_frames, file_hash, frame_results, mean_probs)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)''',
        (user_id, scan_uuid, filename, verdict, confidence, frames_str, heatmap_str, file_hash, frame_results_str, mean_probs_str),
    )
    conn.commit()
    conn.close()

    return jsonify({'success': True, 'uuid': scan_uuid}), 201


@app.route('/history/<int:user_id>', methods=['GET'])
def get_history(user_id):
    conn = get_db_connection()
    rows = conn.execute(
        'SELECT * FROM scan_history WHERE user_id = ? ORDER BY scan_date DESC', (user_id,)
    ).fetchall()
    conn.close()
    return jsonify({'history': [dict(r) for r in rows]}), 200



@app.route('/history/<int:scan_id>', methods=['DELETE'])
def delete_history(scan_id):
    conn = get_db_connection()
    conn.execute('DELETE FROM scan_history WHERE id = ?', (scan_id,))
    conn.commit()
    conn.close()
    return jsonify({'success': True}), 200


# ── Public report ─────────────────────────────────────────────────────────────

@app.route('/report/<scan_uuid>', methods=['GET'])
def get_public_report(scan_uuid):
    conn = get_db_connection()
    row  = conn.execute('SELECT * FROM scan_history WHERE uuid = ?', (scan_uuid,)).fetchone()
    conn.close()

    if not row:
        return jsonify({'error': 'Report not found'}), 404

    return jsonify({'success': True, 'report': dict(row)}), 200


# ── Admin stats ───────────────────────────────────────────────────────────────

@app.route('/admin/stats', methods=['GET'])
def admin_stats():
    user_id = request.args.get('user_id')
    conn    = get_db_connection()
    user    = conn.execute('SELECT role FROM users WHERE id = ?', (user_id,)).fetchone()

    if not user or user['role'] != 'admin':
        conn.close()
        return jsonify({'error': 'Unauthorized'}), 403

    scans    = conn.execute('SELECT COUNT(*) as total FROM scan_history').fetchone()['total']
    users    = conn.execute('SELECT COUNT(*) as total FROM users').fetchone()['total']
    fakes    = conn.execute("SELECT COUNT(*) as total FROM scan_history WHERE verdict = 'FAKE'").fetchone()['total']
    fake_pct = (fakes / scans * 100) if scans > 0 else 0
    conn.close()

    return jsonify({
        'total_scans':    scans,
        'total_users':    users,
        'fake_percentage': round(fake_pct, 1),
    }), 200


# ── PDF report ────────────────────────────────────────────────────────────────

@app.route('/generate_pdf', methods=['POST'])
def generate_pdf():
    data           = request.json
    verdict        = data.get('verdict', 'UNKNOWN')
    confidence     = data.get('confidence', 0.0)
    frame_results  = data.get('frame_results', [])
    heatmap_frames = data.get('heatmap_frames', [])
    mean_probs     = data.get('mean_probs', [])

    try:
        tmp_filename = generate_report(
            verdict, 
            float(confidence),
            frame_results=frame_results,
            heatmap_frames=heatmap_frames,
            mean_probs=mean_probs
        )
        return send_file(
            tmp_filename,
            as_attachment=True,
            download_name=f'DeepShield_Report_{verdict}.pdf',
            mimetype='application/pdf',
        )
    except Exception as e:
        print(f"PDF generation error: {e}")
        return jsonify({'error': 'Failed to generate PDF'}), 500

# ── Frontend fallback ─────────────────────────────────────────────────────────

@app.route('/')
def index():
    return app.send_static_file('index.html')

@app.errorhandler(404)
def not_found(e):
    return app.send_static_file('index.html')


# ── Entry point ───────────────────────────────────────────────────────────────

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    debug = os.environ.get('FLASK_DEBUG', '0') == '1'
    socketio.run(app, debug=debug, host='0.0.0.0', port=port, allow_unsafe_werkzeug=True)
