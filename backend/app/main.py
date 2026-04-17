from fastapi import FastAPI, HTTPException, Query, Request, Depends, Response
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import json
import sqlite3
from datetime import datetime, timezone
import hashlib
import hmac
import os
from pathlib import Path
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError

# app + config
app = FastAPI()


def parse_csv_env(value: str | None) -> list[str]:
    if not value:
        return []
    return [item.strip() for item in value.split(",") if item.strip()]


DEFAULT_ALLOWED_ORIGINS = [
    "http://localhost:5173",
    "http://localhost:3000",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:3000",
]

ALLOWED_ORIGINS = parse_csv_env(os.environ.get("BLOOM_CORS_ORIGINS")) or DEFAULT_ALLOWED_ORIGINS

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

WATER_GOAL = 64
DB_PATH = Path(__file__).resolve().parent.parent / "database.db"
PASSWORD_HASH_ITERATIONS = 200_000
SESSION_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24
SESSION_SECRET = os.environ.get("BLOOM_SESSION_SECRET", "dev-session-secret-change-me")
SESSION_COOKIE_SECURE = os.environ.get("BLOOM_SESSION_COOKIE_SECURE", "false").lower() in {"1", "true", "yes", "on"}
SESSION_COOKIE_SAMESITE = os.environ.get("BLOOM_SESSION_COOKIE_SAMESITE", "lax").lower()
if SESSION_COOKIE_SAMESITE not in {"lax", "strict", "none"}:
    SESSION_COOKIE_SAMESITE = "lax"
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

class AvatarEntry(BaseModel):
    avatar: dict[str, str]

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

    cursor.execute("PRAGMA table_info(users)")
    user_columns = {row[1] for row in cursor.fetchall()}
    if "avatar_json" not in user_columns:
        cursor.execute("ALTER TABLE users ADD COLUMN avatar_json TEXT")

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

def create_session_token(userid: int) -> str:
    expires_at = int(datetime.now(timezone.utc).timestamp()) + SESSION_COOKIE_MAX_AGE_SECONDS
    payload = f"{userid}:{expires_at}"
    signature = hmac.new(
        SESSION_SECRET.encode("utf-8"),
        payload.encode("utf-8"),
        hashlib.sha256,
    ).hexdigest()
    return f"{payload}:{signature}"

def verify_session_token(token: str) -> int:
    try:
        userid_text, expires_text, signature = token.split(":", 2)
        userid = int(userid_text)
        expires_at = int(expires_text)
    except (TypeError, ValueError):
        raise HTTPException(status_code=401, detail="Invalid authentication.")

    if userid <= 0:
        raise HTTPException(status_code=401, detail="Invalid authentication.")

    payload = f"{userid}:{expires_at}"
    expected_signature = hmac.new(
        SESSION_SECRET.encode("utf-8"),
        payload.encode("utf-8"),
        hashlib.sha256,
    ).hexdigest()

    if not hmac.compare_digest(signature, expected_signature):
        raise HTTPException(status_code=401, detail="Invalid authentication.")

    now_ts = int(datetime.now(timezone.utc).timestamp())
    if expires_at < now_ts:
        raise HTTPException(status_code=401, detail="Session expired.")

    return userid

def set_auth_cookie(response: Response, userid: int):
    response.set_cookie(
        key=AUTH_COOKIE_NAME,
        value=create_session_token(userid),
        max_age=SESSION_COOKIE_MAX_AGE_SECONDS,
        httponly=True,
        samesite=SESSION_COOKIE_SAMESITE,
        secure=SESSION_COOKIE_SECURE,
        path="/",
    )

def clear_auth_cookie(response: Response):
    response.delete_cookie(
        key=AUTH_COOKIE_NAME,
        path="/",
        samesite=SESSION_COOKIE_SAMESITE,
    )

def get_authenticated_userid(request: Request) -> int:
    """Extract authenticated user ID from auth cookie."""
    auth_cookie = request.cookies.get(AUTH_COOKIE_NAME)
    if not auth_cookie:
        raise HTTPException(status_code=401, detail="Not authenticated.")

    return verify_session_token(auth_cookie)

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
        "SELECT id, name, email, password_hash, created_at, avatar_json FROM users WHERE email = ?",
        (email,),
    )
    row = cursor.fetchone()
    conn.close()
    return dict(row) if row else None

def get_user_by_id(userid: int):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute(
        "SELECT id, name, email, created_at, avatar_json FROM users WHERE id = ?",
        (userid,),
    )
    row = cursor.fetchone()
    conn.close()
    return dict(row) if row else None

def parse_avatar_json(avatar_json: str | None):
    if not avatar_json:
        return None

    try:
        parsed = json.loads(avatar_json)
    except (TypeError, ValueError):
        return None

    if not isinstance(parsed, dict):
        return None

    return {str(key): str(value) for key, value in parsed.items() if isinstance(key, str) and isinstance(value, str)}

def get_other_users(current_userid: int):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute(
        "SELECT id, name, avatar_json FROM users WHERE id != ? ORDER BY name COLLATE NOCASE ASC",
        (current_userid,),
    )
    rows = cursor.fetchall()
    conn.close()
    return [dict(row) for row in rows]

def create_user(name: str, email: str, password_hash: str, avatar_json: str = "{}"): 
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute(
        "INSERT INTO users (name, email, password_hash, created_at, avatar_json) VALUES (?, ?, ?, ?, ?)",
        (name, email, password_hash, get_eastern_now().isoformat(), avatar_json),
    )
    conn.commit()
    user_id = cursor.lastrowid
    conn.close()
    return user_id

def update_user_avatar(userid: int, avatar: dict[str, str]):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute(
        "UPDATE users SET avatar_json = ? WHERE id = ?",
        (json.dumps(avatar, sort_keys=True), userid),
    )
    conn.commit()
    conn.close()

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

def parse_log_timestamp(timestamp: str | None):
    """Normalize stored timestamps so naive and aware values compare safely."""
    if not timestamp:
        return datetime.min.replace(tzinfo=timezone.utc)

    normalized = timestamp.strip()
    if normalized.endswith("Z"):
        normalized = normalized[:-1] + "+00:00"

    try:
        parsed = datetime.fromisoformat(normalized)
    except ValueError:
        return datetime.min.replace(tzinfo=timezone.utc)

    if parsed.tzinfo is None:
        return parsed.replace(tzinfo=EASTERN_TZ)

    return parsed.astimezone(EASTERN_TZ)

def get_latest_water_log(userid: int):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute(
        "SELECT id, amount, created_at FROM water_logs WHERE userid = ? ORDER BY created_at DESC LIMIT 1",
        (userid,),
    )
    row = cursor.fetchone()
    conn.close()
    return dict(row) if row else None

def get_latest_mood_log(userid: int):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute(
        "SELECT id, mood, created_at FROM mood_logs WHERE userid = ? ORDER BY created_at DESC LIMIT 1",
        (userid,),
    )
    row = cursor.fetchone()
    conn.close()
    return dict(row) if row else None

def get_community_feed(current_userid: int):
    entries: list[dict] = []

    for user in get_other_users(current_userid):
        latest_water = get_latest_water_log(user["id"])
        latest_mood = get_latest_mood_log(user["id"])

        if not latest_water and not latest_mood:
            continue

        latest_entry = None
        if latest_water and latest_mood:
            water_time = parse_log_timestamp(latest_water["created_at"])
            mood_time = parse_log_timestamp(latest_mood["created_at"])
            latest_entry = ("water", latest_water) if water_time >= mood_time else ("mood", latest_mood)
        elif latest_water:
            latest_entry = ("water", latest_water)
        else:
            latest_entry = ("mood", latest_mood)

        if not latest_entry:
            continue

        activity_type, activity_payload = latest_entry
        summary = (
            f"logged {activity_payload['amount']} oz water"
            if activity_type == "water"
            else f"logged mood: {activity_payload['mood']}"
        )

        entries.append(
            {
                "userid": user["id"],
                "name": user["name"],
                "activity_type": activity_type,
                "summary": summary,
                "created_at": activity_payload["created_at"],
                "avatar": parse_avatar_json(user.get("avatar_json")),
            }
        )

    entries.sort(key=lambda item: parse_log_timestamp(item.get("created_at")), reverse=True)
    return entries

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
def signup(entry: SignupEntry, response: Response):
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

    set_auth_cookie(response, user_id)

    return {
        "message": "Account created.",
        "userid": user_id,
        "name": name,
        "email": email,
    }

@app.post("/auth/login")
def login(entry: LoginEntry, response: Response):
    email = normalize_email(entry.email)
    user = get_user_by_email(email)

    if not user or not verify_password(entry.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid email or password.")

    set_auth_cookie(response, user["id"])

    return {
        "message": "Login successful.",
        "userid": user["id"],
        "name": user["name"],
        "email": user["email"],
    }

@app.get("/auth/session")
def get_session_user(userid: int = Depends(get_authenticated_userid)):
    user = get_user_by_id(userid)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid authentication.")

    return {
        "userid": user["id"],
        "name": user["name"],
        "email": user["email"],
    }

@app.post("/auth/logout")
def logout(response: Response):
    clear_auth_cookie(response)
    return {"message": "Logged out."}

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

@app.post("/avatar")
def save_avatar(entry: AvatarEntry, userid: int = Depends(get_authenticated_userid)):
    update_user_avatar(userid, entry.avatar)
    return {"message": "Avatar saved."}

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

@app.get("/community-feed")
def community_feed(userid: int = Depends(get_authenticated_userid)):
    return {
        "entries": get_community_feed(userid)
    }