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

## Running the project locally

### 1. clone the repo

```bash
git clone https://github.com/haimiee/bloom.git
cd bloom
```

### 2. frontend steup
```bash
cd frontend
```

frontend should run on:
```http://localhost:5173```

### 3. backend setup
```bash
cd ../backend
pip install -r requirements.txt
uvicorn app.main:app --reload
```
