# Bloom Frontend (Vite)

This frontend uses Vite environment variables for backend routing. These are resolved at build time.

## Environment Setup

1. Copy .env.example to .env.local for local development.
2. Set the API values for your environment.

Important: Vite variables must start with VITE_.

Used by this app:
- VITE_API_BASE_URL
- VITE_SIGNUP_ENDPOINT
- VITE_LOGIN_ENDPOINT
- VITE_WATER_ENDPOINT

## Local Example

Use the backend on port 8000:

VITE_API_BASE_URL=http://127.0.0.1:8000
VITE_SIGNUP_ENDPOINT=/auth/signup
VITE_LOGIN_ENDPOINT=/auth/login
VITE_WATER_ENDPOINT=/water

## Production Hosting Patterns

Pattern A: Frontend and backend on different origins
- Set VITE_API_BASE_URL to your backend URL.
- Example: https://api.your-domain.com

Pattern B: Reverse proxy on same domain
- Route /api to FastAPI in Nginx or Caddy.
- Set VITE_API_BASE_URL to your site origin.
- Set endpoint variables like /api/auth/signup, /api/auth/login, /api/water.

## Build and Run

Local dev:
- npm install
- npm run dev

Production build:
- npm install
- npm run build
- npm run preview

Note: if you change any .env file values, restart the Vite dev server.
