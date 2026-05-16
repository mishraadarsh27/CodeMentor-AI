import sqlite3
import json

conn = sqlite3.connect('codementor.db')
cursor = conn.cursor()

print("--- Code History ---")
cursor.execute("SELECT id, score, analysis_result FROM code_history ORDER BY id DESC LIMIT 3")
rows = cursor.fetchall()
for row in rows:
    print(f"ID: {row[0]}, Score: {row[1]}")
    try:
        res = json.loads(row[2])
        print(f"Explanation: {res.get('explanation')[:100]}...")
    except:
        print(f"Raw Result: {row[2][:100]}...")

print("\n--- Chat History ---")
cursor.execute("SELECT id, user_message, ai_response FROM chat_history ORDER BY id DESC LIMIT 3")
rows = cursor.fetchall()
for row in rows:
    print(f"ID: {row[0]}, User: {row[1]}, AI: {row[2][:100]}...")

conn.close()
