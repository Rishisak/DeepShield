import sqlite3
import os

DB_PATH = os.path.join(os.path.dirname(__file__), 'deepshield.db')

def get_db_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db_connection()

    conn.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password TEXT,
            role TEXT DEFAULT 'user',
            api_key TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    ''')

    conn.execute('''
        CREATE TABLE IF NOT EXISTS scan_history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            uuid TEXT,
            filename TEXT NOT NULL,
            verdict TEXT NOT NULL,
            confidence REAL NOT NULL,
            scan_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (id)
        )
    ''')

    conn.commit()

    # ── Safe column migrations ────────────────────────────────────────────────
    # Add any new columns that may not exist in older databases.
    existing = {row[1] for row in conn.execute("PRAGMA table_info(scan_history)")}

    migrations = {
        'frames':         'ALTER TABLE scan_history ADD COLUMN frames TEXT',
        'heatmap_frames': 'ALTER TABLE scan_history ADD COLUMN heatmap_frames TEXT',
        'file_hash':      'ALTER TABLE scan_history ADD COLUMN file_hash TEXT',
        'frame_results':  'ALTER TABLE scan_history ADD COLUMN frame_results TEXT',
        'mean_probs':     'ALTER TABLE scan_history ADD COLUMN mean_probs TEXT',
    }
    for col, sql in migrations.items():
        if col not in existing:
            conn.execute(sql)

    conn.commit()
    conn.close()
