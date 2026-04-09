from fastapi import FastAPI
from pydantic import BaseModel # used to define request data (validation)
import sqlite3
from datetime import datetime, date

# create backend app instance
app = FastAPI()

WATER_GOAL = 64         # fixed daily water goal in ounces
DB_NAME = "database.db" # file name for sqlite database

# create table if not exists
def init_db():
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS water_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            amount INTEGER,
            created_at TEXT
        )
    """)
    conn.commit()   # saves changes to the database
    conn.close()    # closes the connection to the database

init_db() # run the database initialization when the app starts

# define the data model for water log entries
class WaterEntry(BaseModel):
    amount: int

@app.get("/health")
def health():
    return {"status": "ok"}

@app.post("/water")
def log_water(entry: WaterEntry):
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()

    cursor.execute(
        "INSERT INTO water_logs (amount, created_at) VALUES (?, ?)",
        (entry.amount, datetime.utcnow().isoformat())
    )

    conn.commit()
    conn.close()

    return {"status": "logged", "amount": entry.amount}

@app.get("/summary")
def summary():
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()

    today = date.today().isoformat()

    cursor.execute("SELECT amount, created_at FROM water_logs")
    rows = cursor.fetchall()

    conn.close()

    total = 0
    for amount, created_at in rows:
        if created_at.startswith(today):
            total += amount

    percentage = total / WATER_GOAL if WATER_GOAL else 0

    return {
        "goal": WATER_GOAL,
        "amount_logged": total,
        "percentage": percentage
    }