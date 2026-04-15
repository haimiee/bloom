# Bloom 🌸

Bloom is a gentle habit tracker centered around hydration and mood tracking.

The goal is to make tracking more visual and calming  shown through a growing plant  and simple daily check-ins.

---

## Main features

- log water intake
- view daily total + progress toward goal
- simple mood check-in
- local backend + frontend running on localhost, later on a server

---

## Concept

Bloom is designed to be like a **shared reflection space** around hydration and how we feel day to day.

- hydration → action  
- mood → reflection  
- plant → visual growth  

Later on, we may expand into:
- shared environment (sky / mood visuals)
- user accounts and friendship
- calendar snapshots
- more habits (running, reading, etc.)

---

## Tech Stack

**frontend**
- ReactJS (Vite)

**backend**
- FastAPI (Python)

**data (for now)**
- local storage (in-memory or SQLite)

---

## Running the project

### 1. clone the repo

```bash
git clone https://github.com/haimiee/bloom.git
cd bloom
```

### 2. frontend steup
1) cd .\bloom\frontend\
2) install node
3) npm install --dev
4) npm run dev
5) go to http://localhost:5173/ in browser

### 3. backend setup
1) install Python
2) cd .\bloom\backend\
3) pip install -r requirements.txt
4) python3 -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
5) go to http://127.0.0.1:8000/docs

note: 
- local backend uses your own local database.db
- live backend uses the shared server database.db
- if testing on the live backend, data will be shared across users/devices

#### current endpoints
##### POST /water
Logs water for a specific user.
```JSON
{
"amount": 8,
"userid": 1
}
```

##### GET /water
Gets water summary for a specific user.

Example:
`/water?userid=1`

Optional with date:
`/water?userid=1&date=2026-04-13`

##### POST /mood
Logs mood for a specific user.
```JSON
{
"mood": "happy",
"text": "good day",
"userid": 1
}
```

#### GET /moods
Gets moods for a specific user

Example:
`/moods?userid=1`

Optional with date:
`/moods?userid=1&date=2026-04-13`

##### GET /summary
Gets combined daily summary for a specific user.

Example:
`/summary?userid=1`

Optional with date:
`/summary?userid=1&date=2026-04-13`

##### GET /health
Simple check to confirm backend is running.

Example:
`/health`