from fastapi import FastAPI, Query
from pydantic import BaseModel
import sqlite3
from datetime import datetime, date


# app + config

app = FastAPI()

WATER_GOAL = 64
DB_NAME = "database.db"


# request / response models

class WaterEntry(BaseModel):
    amount: int


class MoodEntry(BaseModel):
    mood: str
    text: str | None = None


# database connection helpers

def get_connection():
    conn = sqlite3.connect(DB_NAME)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS water_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            amount INTEGER NOT NULL,
            created_at TEXT NOT NULL
        )
    """)

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS mood_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            mood TEXT NOT NULL,
            text TEXT,
            created_at TEXT NOT NULL
        )
    """)

    conn.commit()
    conn.close()


init_db()


# utility helpers

def get_day_string(selected_date: str | None = None):
    """
    if no date is passed in, use today's date.
    date format expected: YYYY-MM-DD
    """
    return selected_date if selected_date else date.today().isoformat()


def get_plant_stage(percentage: float):
    """
    simple frontend-friendly plant stages.
    later frontend can decide how many versions of the plant they want.
    """
    if percentage >= 1:
        return 4
    elif percentage >= 0.75:
        return 3
    elif percentage >= 0.5:
        return 2
    elif percentage > 0:
        return 1
    return 0


# water queries / logic

def create_water_log(amount: int):
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute(
        "INSERT INTO water_logs (amount, created_at) VALUES (?, ?)",
        (amount, datetime.utcnow().isoformat())
    )

    conn.commit()
    conn.close()


def get_water_logs_for_day(day_string: str):
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute(
        "SELECT id, amount, created_at FROM water_logs WHERE created_at LIKE ? ORDER BY created_at",
        (f"{day_string}%",)
    )

    rows = cursor.fetchall()
    conn.close()

    return [dict(row) for row in rows]


def get_water_summary_for_day(day_string: str):
    logs = get_water_logs_for_day(day_string)
    total = sum(log["amount"] for log in logs)
    percentage = total / WATER_GOAL if WATER_GOAL else 0

    return {
        "date": day_string,
        "goal": WATER_GOAL,
        "amount_logged": total,
        "percentage": percentage,
        "plant_stage": get_plant_stage(percentage),
        "water_logs": logs
    }


# mood queries / logic

def create_mood_log(mood: str, text: str | None):
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute(
        "INSERT INTO mood_logs (mood, text, created_at) VALUES (?, ?, ?)",
        (mood, text, datetime.utcnow().isoformat())
    )

    conn.commit()
    conn.close()


def get_mood_logs_for_day(day_string: str):
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute(
        "SELECT id, mood, text, created_at FROM mood_logs WHERE created_at LIKE ? ORDER BY created_at",
        (f"{day_string}%",)
    )

    rows = cursor.fetchall()
    conn.close()

    return [dict(row) for row in rows]


# combined summary logic

def get_daily_summary(day_string: str):
    water_summary = get_water_summary_for_day(day_string)
    moods = get_mood_logs_for_day(day_string)

    return {
        "date": day_string,
        "goal": water_summary["goal"],
        "amount_logged": water_summary["amount_logged"],
        "percentage": water_summary["percentage"],
        "plant_stage": water_summary["plant_stage"],
        "water_logs": water_summary["water_logs"],
        "moods_logged": len(moods),
        "moods": moods
    }


# routes

@app.get("/health")
def health():
    return {"status": "ok"}

@app.post("/water")
def log_water(entry: WaterEntry):
    create_water_log(entry.amount)

    day_string = get_day_string()
    return {
        "status": "logged",
        "amount": entry.amount,
        "summary": get_daily_summary(day_string)
    }

@app.get("/water")
def get_water(date_str: str | None = Query(default=None, alias="date")):
    day_string = get_day_string(date_str)
    return get_water_summary_for_day(day_string)

@app.post("/mood")
def log_mood(entry: MoodEntry):
    create_mood_log(entry.mood, entry.text)

    day_string = get_day_string()
    return {
        "status": "logged",
        "mood": entry.mood,
        "summary": get_daily_summary(day_string)
    }

@app.get("/moods")
def get_moods(date_str: str | None = Query(default=None, alias="date")):
    day_string = get_day_string(date_str)
    return {
        "date": day_string,
        "moods": get_mood_logs_for_day(day_string)
    }

@app.get("/summary")
def summary(date_str: str | None = Query(default=None, alias="date")):
    day_string = get_day_string(date_str)
    return get_daily_summary(day_string)