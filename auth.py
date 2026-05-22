from flask import Blueprint, request, jsonify
from flask_bcrypt import Bcrypt
import sqlite3
import secrets
from db import get_db_connection

auth_bp = Blueprint('auth', __name__, url_prefix='/auth')
bcrypt = Bcrypt()

@auth_bp.route('/register', methods=['POST'])
def register():
    data = request.json
    name = data.get('name')
    email = data.get('email')
    password = data.get('password')

    if not all([name, email, password]):
        return jsonify({"error": "Missing required fields"}), 400

    hashed_pw = bcrypt.generate_password_hash(password).decode('utf-8')
    api_key = "ds_" + secrets.token_hex(16)

    conn = get_db_connection()
    try:
        conn.execute('INSERT INTO users (name, email, password, api_key) VALUES (?, ?, ?, ?)', (name, email, hashed_pw, api_key))
        conn.commit()
    except sqlite3.IntegrityError:
        return jsonify({"error": "Email already registered"}), 409
    finally:
        conn.close()

    return jsonify({"success": True, "message": "User created successfully"}), 201

@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.json
    email = data.get('email')
    password = data.get('password')

    if not email or not password:
        return jsonify({"error": "Missing email or password"}), 400

    conn = get_db_connection()
    user = conn.execute('SELECT * FROM users WHERE email = ?', (email,)).fetchone()
    conn.close()

    if user and bcrypt.check_password_hash(user['password'], password):
        return jsonify({
            "success": True,
            "user": {
                "id": user['id'],
                "name": user['name'],
                "email": user['email'],
                "role": user['role'],
                "api_key": user['api_key']
            }
        }), 200
    else:
        return jsonify({"error": "Invalid credentials"}), 401

@auth_bp.route('/google', methods=['POST'])
def google_login():
    data = request.json
    access_token = data.get('access_token')

    if not access_token:
         return jsonify({"error": "Missing access token"}), 400

    import requests as req
    response = req.get('https://www.googleapis.com/oauth2/v3/userinfo', headers={'Authorization': f'Bearer {access_token}'})
    
    if not response.ok:
         return jsonify({"error": "Invalid Google token"}), 401
         
    user_info = response.json()
    email = user_info.get('email')
    name = user_info.get('name') or email.split('@')[0]

    if not email:
         return jsonify({"error": "Could not retrieve email from Google"}), 400

    conn = get_db_connection()
    user = conn.execute('SELECT * FROM users WHERE email = ?', (email,)).fetchone()
    
    if not user:
         dummy_password = bcrypt.generate_password_hash('[GOOGLE_OAUTH_ACCOUNT]').decode('utf-8')
         api_key = "ds_" + secrets.token_hex(16)
         cursor = conn.cursor()
         cursor.execute('INSERT INTO users (name, email, password, api_key) VALUES (?, ?, ?, ?)', (name, email, dummy_password, api_key))
         conn.commit()
         user_id = cursor.lastrowid
         role_val = 'user'
    else:
         user_id = user['id']
         role_val = user['role']
         api_key = user['api_key']
         
    conn.close()

    return jsonify({
         "success": True,
         "user": {
              "id": user_id,
              "name": name,
              "email": email,
              "role": role_val,
              "api_key": api_key
         }
    }), 200
