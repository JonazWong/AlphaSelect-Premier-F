# AlphaSelect Premier F – Copilot Instructions

## Project Overview
AI-driven MEXC cryptocurrency contract trading analysis platform. Backend: FastAPI (Python 3.11) + Celery. Frontend: Next.js 15 (App Router, TypeScript). Data: PostgreSQL 16 + TimescaleDB + Redis 7.

## Architecture
```
Frontend (Next.js) → HTTP/WebSocket → FastAPI Backend → PostgreSQL + Redis
                                              ↓
                                       Celery Workers → MEXC API
```
- All API routes are versioned under `/api/v1/`
- WebSocket is served via Socket.IO at `/ws/socket.io` (mounted as ASGI wrapper in `backend/app/main.py`)
- AI models are saved to disk at `AI_MODEL_DIR` (default `/app/ai_models`, shared volume in Docker)

## Key Directories
| Path | Purpose |
|------|---------|
| `backend/app/core/mexc/contract.py` | MEXC API client with rate limiter + circuit breaker |
| `backend/app/core/circuit_breaker.py` | 3-state circuit breaker (CLOSED/OPEN/HALF_OPEN, 5 failures → 60s timeout) |
| `backend/app/core/rate_limiter.py` | Redis-backed sliding window rate limiter |
| `backend/app/api/v1/endpoints/` | FastAPI routers: `contract_market`, `ai_training`, `ai_predict` |
| `backend/app/services/` | `ai_training_service.py`, `ai_prediction_service.py` |
| `backend/app/models/` | SQLAlchemy models: `ContractMarket`, `AIModel`, `Prediction`, `FundingRateHistory`, `OpenInterestHistory` |
| `backend/app/tasks/` | Celery tasks for periodic data collection and async AI training |
| `frontend/src/app/` | Next.js App Router pages: `crypto-radar`, `ai-training`, `ai-predictions`, `pattern-detection`, `market-screener` |
| `frontend/src/components/Navigation.tsx` | Shared navigation component |


## Developer Workflows

### Local Development (Docker – preferred)
```bash
cp backend/.env.example backend/.env   # set DB_PASSWORD and SECRET_KEY
docker-compose up -d                   # starts postgres, redis, backend, celery, frontend
```
- Backend: http://localhost:8000 (Swagger UI at `/docs`)
- Frontend: http://localhost:3000

### Manual (no Docker)
```bash
# Backend
cd backend && python3.11 -m venv venv && source venv/bin/activate
pip install -r requirements.txt
python -m app.db.init_db
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Frontend
cd frontend && npm install && npm run dev
```

### Tests & Lint
```bash
cd backend && pytest                   # Python tests
cd frontend && npm run lint            # ESLint (next lint)
cd frontend && npm test                # Frontend tests
```

## Project Conventions

### Backend
- Settings are centralized in `backend/app/core/config.py` (`Settings` via pydantic-settings); always add new env vars there.
- Required env vars: `DATABASE_URL`, `REDIS_URL`, `SECRET_KEY`. MEXC keys are optional (read-only API).
- New API endpoints go in `backend/app/api/v1/endpoints/`; register the router in `backend/app/main.py`.
- MEXC calls must go through the client in `core/mexc/contract.py` – never call MEXC directly to bypass rate-limiting and circuit-breaker.

### Frontend
- Use Tailwind CSS with the Cyberpunk theme tokens defined in `tailwind.config.ts`: `bg-background`, `text-primary`, `text-secondary`, `text-accent`, and the neon shadow utilities (`shadow-neon-cyan`, etc.).
- API base URL comes from `NEXT_PUBLIC_API_URL` (default `http://localhost:8000`); WebSocket from `NEXT_PUBLIC_WS_URL`.
- State management via Zustand; internationalization via react-i18next (zh-TW / en-US).

### AI Models
- Supported model types: `LSTM`, `XGBoost`, `RandomForest`, `ARIMA`, `LinearRegression`, `Ensemble`.
- Training is triggered asynchronously via Celery (`backend/app/tasks/`); training state is persisted in the `AIModel` table.
- Trained model files are stored in the shared `ai_models/` volume.

## Environment Variables (critical)
| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `REDIS_URL` | Redis connection string |
| `SECRET_KEY` | JWT signing secret |
| `MEXC_API_KEY` / `MEXC_SECRET_KEY` | Optional; read-only MEXC credentials |
| `ALLOWED_ORIGINS` | Comma-separated CORS origins |
| `AI_MODEL_DIR` | Directory for saved model files (default `/app/ai_models`) |
