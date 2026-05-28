import mysql.connector

def get_db():
    return mysql.connector.connect(
        host="localhost",
        user="root",
        password="password",
        database="ai_teacher"
    )

def save_pdf(filename, full_text):
    db = get_db()
    cur = db.cursor()

    cur.execute(
        "INSERT INTO pdf_knowledge (pdf_name, content) VALUES (%s, %s)",
        (filename, full_text)
    )

    db.commit()
    cur.close()
    db.close()

def get_all_content():
    db = get_db()
    cur = db.cursor(dictionary=True)

    cur.execute("SELECT content FROM pdf_knowledge")
    data = cur.fetchall()

    cur.close()
    db.close()
    return data
print("get_all_content exists:", callable(get_all_content))
