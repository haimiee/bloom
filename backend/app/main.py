from fastapi import FastAPI, HTTPException, Query, Request, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import sqlite3
from datetime import datetime, timezone
import hashlib
import hmac
import os
import json
import urllib.parse
from pathlib import Path
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError

# app + config
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

WATER_GOAL = 64
DB_PATH = Path(__file__).resolve().parent.parent / "database.db"
PASSWORD_HASH_ITERATIONS = 200_000
try:
    EASTERN_TZ = ZoneInfo("America/New_York")
except ZoneInfoNotFoundError:
    # Prefer local machine timezone to avoid UTC day rollover differences.
    EASTERN_TZ = datetime.now().astimezone().tzinfo or timezone.utc

# request / response models
class LogWaterRequest(BaseModel):
    amount: int

class LogMoodRequest(BaseModel):
    mood: str

class SignupEntry(BaseModel):
    name: str
    email: str
    password: str

class LoginEntry(BaseModel):
    email: str
    password: str

# database connection helpers
def get_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT NOT NULL UNIQUE,
            password_hash TEXT NOT NULL,
            created_at TEXT NOT NULL
        )
    """)

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS water_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            userid INTEGER NOT NULL,
            amount INTEGER NOT NULL,
            created_at TEXT NOT NULL
        )
    """)

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS mood_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            userid INTEGER NOT NULL,
            mood TEXT NOT NULL,
            created_at TEXT NOT NULL
        )
    """)

    conn.commit()
    conn.close()

init_db()

# authentication helpers
AUTH_COOKIE_NAME = 'bloom_auth_user'

def get_authenticated_userid(request: Request) -> int:
    """Extract authenticated user ID from auth cookie."""
    auth_cookie = request.cookies.get(AUTH_COOKIE_NAME)
    if not auth_cookie:
        raise HTTPException(status_code=401, detail="Not authenticated.")
    
    try:
        user_data = json.loads(urllib.parse.unquote(auth_cookie))
        userid = user_data.get("userid")
        if not isinstance(userid, int) or userid <= 0:
            raise HTTPException(status_code=401, detail="Invalid authentication.")
        return userid
    except (json.JSONDecodeError, ValueError, TypeError):
        raise HTTPException(status_code=401, detail="Invalid authentication.")

# utility helpers
def get_eastern_now():
    return datetime.now(EASTERN_TZ)

def get_day_string(selected_date: str | None = None):
    """
    if no date is passed in, use today's date.
    date format expected: YYYY-MM-DD
    """
    return selected_date if selected_date else get_eastern_now().date().isoformat()

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

def normalize_email(email: str):
    return email.strip().lower()

def hash_password(password: str):
    salt = os.urandom(16)
    digest = hashlib.pbkdf2_hmac(
        "sha256",
        password.encode("utf-8"),
        salt,
        PASSWORD_HASH_ITERATIONS,
    )
    return f"pbkdf2_sha256${PASSWORD_HASH_ITERATIONS}${salt.hex()}${digest.hex()}"

def verify_password(password: str, stored_hash: str):
    try:
        algorithm, iteration_text, salt_hex, digest_hex = stored_hash.split("$", 3)
        if algorithm != "pbkdf2_sha256":
            return False

        iterations = int(iteration_text)
        salt = bytes.fromhex(salt_hex)
        expected_digest = bytes.fromhex(digest_hex)
    except (ValueError, TypeError):
        return False

    computed_digest = hashlib.pbkdf2_hmac(
        "sha256",
        password.encode("utf-8"),
        salt,
        iterations,
    )
    return hmac.compare_digest(computed_digest, expected_digest)

def get_user_by_email(email: str):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute(
        "SELECT id, name, email, password_hash, created_at FROM users WHERE email = ?",
        (email,),
    )
    row = cursor.fetchone()
    conn.close()
    return dict(row) if row else None

def create_user(name: str, email: str, password_hash: str):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute(
        "INSERT INTO users (name, email, password_hash, created_at) VALUES (?, ?, ?, ?)",
        (name, email, password_hash, get_eastern_now().isoformat()),
    )
    conn.commit()
    user_id = cursor.lastrowid
    conn.close()
    return user_id

def build_activity_log_response(userid: int, activity: str, payload: dict):
    day_string = get_day_string()
    return {
        "status": "logged",
        "activity": activity,
        **payload,
        "summary": get_daily_summary(day_string, userid),
    }

def LogWaterResponse(amount: int, userid: int):
    return build_activity_log_response(userid, "water", {"amount": amount})

def LogMoodResponse(mood: str, userid: int):
    return build_activity_log_response(userid, "mood", {"mood": mood})

# water queries / logic
def create_water_log(amount: int, userid: int):
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute(
        "INSERT INTO water_logs (amount, userid, created_at) VALUES (?, ?, ?)",
        (amount, userid, get_eastern_now().isoformat())
    )

    conn.commit()
    conn.close()

def get_water_logs_for_day(day_string: str, userid: int):
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute(
        "SELECT id, amount,  created_at FROM water_logs WHERE created_at LIKE ? AND userid = ? ORDER BY created_at",
        (f"{day_string}%", userid)
    )

    rows = cursor.fetchall()
    conn.close()

    return [dict(row) for row in rows]

def get_water_summary_for_day(day_string: str, userid: int):
    logs = get_water_logs_for_day(day_string, userid)
    total = sum(log["amount"] for log in logs)
    percentage = total / WATER_GOAL if WATER_GOAL else 0

    return {
        "userid": userid,
        "date": day_string,
        "goal": WATER_GOAL,
        "amount_logged": total,
        "percentage": percentage,
        "plant_stage": get_plant_stage(percentage),
        "water_logs": logs        
    }

# mood queries / logic
def create_mood_log(mood: str, userid: int):
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute(
        "INSERT INTO mood_logs (userid, mood, created_at) VALUES (?, ?, ?)",
        (userid, mood, get_eastern_now().isoformat())
    )

    conn.commit()
    conn.close()

def get_mood_logs_for_day(day_string: str, userid: int):
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute(
        "SELECT id, mood, created_at FROM mood_logs WHERE created_at LIKE ? AND userid = ? ORDER BY created_at",
        (f"{day_string}%", userid)
    )

    rows = cursor.fetchall()
    conn.close()

    return [dict(row) for row in rows]

# combined summary logic
def get_daily_summary(day_string: str, userid: int):
    water_summary = get_water_summary_for_day(day_string, userid)
    moods = get_mood_logs_for_day(day_string, userid)

    return {
        "userid": userid,
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

@app.post("/auth/signup", status_code=201)
def signup(entry: SignupEntry):
    name = entry.name.strip()
    email = normalize_email(entry.email)
    password = entry.password

    if len(name) < 2:
        raise HTTPException(status_code=400, detail="Name must be at least 2 characters.")
    if "@" not in email or "." not in email:
        raise HTTPException(status_code=400, detail="A valid email is required.")
    if len(password) < 8:
        raise HTTPException(status_code=400, detail="Password must be at least 8 characters.")

    if get_user_by_email(email):
        raise HTTPException(status_code=409, detail="Email is already registered.")

    try:
        user_id = create_user(name, email, hash_password(password))
    except sqlite3.IntegrityError:
        raise HTTPException(status_code=409, detail="Email is already registered.")

    return {
        "message": "Account created.",
        "userid": user_id,
        "name": name,
        "email": email,
    }

@app.post("/auth/login")
def login(entry: LoginEntry):
    email = normalize_email(entry.email)
    user = get_user_by_email(email)

    if not user or not verify_password(entry.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid email or password.")

    return {
        "message": "Login successful.",
        "userid": user["id"],
        "name": user["name"],
        "email": user["email"],
    }

@app.post("/water")
def log_water(entry: LogWaterRequest, userid: int = Depends(get_authenticated_userid)):
    create_water_log(entry.amount, userid)
    return LogWaterResponse(entry.amount, userid)

@app.get("/water")
def get_water(date_str: str | None = Query(default=None, alias="date"), userid: int = Depends(get_authenticated_userid)):
    day_string = get_day_string(date_str)
    return get_water_summary_for_day(day_string, userid)

@app.post("/mood")
def log_mood(entry: LogMoodRequest, userid: int = Depends(get_authenticated_userid)):
    create_mood_log(entry.mood, userid)
    return LogMoodResponse(entry.mood, userid)

@app.get("/moods")
def get_moods(date_str: str | None = Query(default=None, alias="date"), userid: int = Depends(get_authenticated_userid)):
    day_string = get_day_string(date_str)
    return {
        "userid": userid,
        "date": day_string,
        "moods": get_mood_logs_for_day(day_string, userid)
    }

@app.get("/summary")
def summary(date_str: str | None = Query(default=None, alias="date"), userid: int = Depends(get_authenticated_userid)):
    day_string = get_day_string(date_str)
    return get_daily_summary(day_string, userid)