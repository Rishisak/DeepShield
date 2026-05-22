import sqlite3
import uuid
import secrets

def update_db():
    conn = sqlite3.connect('deepshield.db')
    cursor = conn.cursor()
    try:
        cursor.execute("ALTER TABLE scan_history ADD COLUMN uuid TEXT")
    except sqlite3.OperationalError:
        pass
    try:
        cursor.execute("ALTER TABLE users ADD COLUMN api_key TEXT")
    except sqlite3.OperationalError:
        pass

    rows = cursor.execute("SELECT id FROM scan_history WHERE uuid IS NULL").fetchall()
    for row in rows:
        cursor.execute("UPDATE scan_history SET uuid = ? WHERE id = ?", (str(uuid.uuid4()), row[0]))
    
    users = cursor.execute("SELECT id FROM users WHERE api_key IS NULL").fetchall()
    for u in users:
        cursor.execute("UPDATE users SET api_key = ? WHERE id = ?", ("ds_" + secrets.token_hex(16), u[0]))

    conn.commit()
    conn.close()
    print("Database altered and backfilled!")

if __name__ == '__main__':
    update_db()
