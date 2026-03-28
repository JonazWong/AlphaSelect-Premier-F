---
name: alphaselect-development
description: "**WORKFLOW SKILL** — Develop, debug, and deploy features for AlphaSelect Premier F, an AI-driven MEXC cryptocurrency contract trading analysis platform. USE FOR: implementing new trading analysis pages, integrating AI prediction models, adding technical indicators, creating real-time WebSocket features, configuring multi-page shared data state, implementing Cyberpunk-themed UI components with charts, and deploying to DigitalOcean App Platform. USE WHEN: building crypto trading features, AI model training workflows, real-time market data displays, technical analysis indicators (RSI, MACD, Bollinger), pattern detection systems, or production deployment to DigitalOcean. DO NOT USE FOR: non-crypto applications, simple CRUD apps without AI/ML, or projects not using Next.js 15 + FastAPI stack."
---

# AlphaSelect Premier F Development Workflow

## Project Context

**AlphaSelect Premier F** is a professional-grade cryptocurrency contract trading analysis platform with AI-powered predictions.

### Technology Stack
- **Frontend**: Next.js 15.2.9 (App Router) + TypeScript + Tailwind CSS (Cyberpunk theme)
- **Backend**: FastAPI (Python 3.11) + SQLAlchemy + Pydantic v2
- **Database**: PostgreSQL 16 + TimescaleDB (time-series optimization)
- **Cache/Queue**: Redis 7 (rate limiting + Celery task queue)
- **AI/ML**: LSTM, XGBoost, RandomForest, ARIMA, Ensemble models
- **External API**: MEXC contract trading API (rate-limited, circuit-breaker protected)
- **Deployment**: Docker + DigitalOcean App Platform

### Core Architecture
```
Frontend (Next.js) → HTTP/WebSocket → FastAPI Backend → PostgreSQL + Redis
                                              ↓
                                       Celery Workers → MEXC API
```

## Development Workflow

### Step 1: Understand the Feature Scope

When implementing a feature, first identify:

1. **Feature Category**:
   - 📊 **Real-time market data** → WebSocket + Redis caching
   - 🤖 **AI prediction** → Celery async training + model storage
   - 📈 **Technical analysis** → Indicator calculation + charting
   - 🎯 **Signal detection** → Pattern recognition + alert system
   - 🖥️ **UI/Dashboard** → Cyberpunk theme + responsive layout

2. **Data Flow**:
   - Does it need MEXC API data? → Use `core/mexc/contract.py` client (never call MEXC directly)
   - Real-time updates? → Implement WebSocket endpoint
   - Historical data? → Query TimescaleDB with proper indexing
   - Cross-page state? → Use Zustand store + React Context

3. **Performance Requirements**:
   - Rate limiting: MEXC allows max 100 req/10s
   - Circuit breaker: 5 consecutive failures → 60s timeout
   - Cache TTL: Market data 30s-5m, indicators 1-5m

### Step 2: Backend Implementation

#### 2.1 Define Database Models (if needed)
**Location**: `backend/app/models/`

**Template**:
```python
from sqlalchemy import Column, String, Float, DateTime, Index
from app.db.base_class import Base
from datetime import datetime

class YourModel(Base):
    __tablename__ = "your_table"
    
    id = Column(Integer, primary_key=True, index=True)
    symbol = Column(String(20), nullable=False, index=True)
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)
    value = Column(Float)
    extra_data = Column(JSONB)  # NEVER use 'metadata' (SQLAlchemy reserved)
    
    # Add composite indexes for common queries
    __table_args__ = (
        Index('ix_symbol_timestamp', 'symbol', 'timestamp'),
    )
```

**⚠️ Critical Rules**:
- NEVER use column name `metadata` (SQLAlchemy reserved keyword)
- Use `extra_data` for JSON blob storage
- Always add indexes on: `symbol`, `timestamp`, and common query columns
- TimescaleDB tables: add `created_at` timestamp for hypertable partitioning

#### 2.2 Create Pydantic Schemas
**Location**: `backend/app/schemas/`

**Template**:
```python
from pydantic import BaseModel, Field
from datetime import datetime

class YourSchema(BaseModel):
    symbol: str = Field(..., description="Trading pair symbol (e.g., BTC_USDT)")
    timestamp: datetime
    value: float
    currency: str = Field(default="USD", description="All values in USD")
    
    model_config = {"from_attributes": True}  # Pydantic v2 syntax
```

**⚠️ Critical Rules**:
- Use Pydantic v2 syntax: `model_config` instead of `Config` class
- Always include `currency: "USD"` in price-related schemas
- Add descriptions via `Field(..., description="...")`

#### 2.3 Implement Service Layer
**Location**: `backend/app/services/`

**Pattern**:
```python
from app.core.mexc.contract import MexcContractClient
from app.core.rate_limiter import RateLimiter
from sqlalchemy.orm import Session

class YourService:
    def __init__(self, db: Session, mexc_client: MexcContractClient):
        self.db = db
        self.mexc = mexc_client
        self.rate_limiter = RateLimiter()
    
    async def get_data(self, symbol: str) -> dict:
        # Check rate limit BEFORE calling MEXC
        await self.rate_limiter.check_limit(f"mexc:{symbol}")
        
        # Use MEXC client (includes circuit breaker)
        data = await self.mexc.get_contract_detail(symbol)
        
        # Cache in Redis (if applicable)
        # Store in DB (if persistent)
        
        return data
```

**⚠️ Critical Rules**:
- **ALWAYS** use `core/mexc/contract.py` client — never call MEXC API directly
- Check rate limits before external API calls
- Circuit breaker is auto-handled by MEXC client
- Service methods should be async when calling external APIs

#### 2.4 Create API Endpoints
**Location**: `backend/app/api/v1/endpoints/`

**Template**:
```python
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.api.deps import get_db
from app.services.your_service import YourService
from app.schemas.your_schema import YourSchema

router = APIRouter()

@router.get("/your-endpoint", response_model=List[YourSchema])
async def get_your_data(
    symbol: str,
    limit: int = 10,
    db: Session = Depends(get_db)
):
    """
    Get your data with proper documentation.
    
    - **symbol**: Trading pair (e.g., BTC_USDT)
    - **limit**: Max results (default: 10)
    """
    service = YourService(db)
    try:
        return await service.get_data(symbol, limit)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
```

**Register in `backend/app/main.py`**:
```python
from app.api.v1.endpoints import your_endpoint
app.include_router(your_endpoint.router, prefix="/api/v1/your-prefix", tags=["Your Tag"])
```

**⚠️ Critical Rules**:
- All API routes versioned under `/api/v1/`
- Use Pydantic `response_model` for auto documentation
- Add comprehensive docstrings (visible in `/docs`)
- Handle exceptions with proper HTTP status codes

#### 2.5 Add Celery Tasks (for async work)
**Location**: `backend/app/tasks/`

**Template**:
```python
from app.tasks.celery_app import celery_app
from app.db.session import SessionLocal
from app.services.your_service import YourService

@celery_app.task(name="your_task")
def your_async_task(symbol: str):
    db = SessionLocal()
    try:
        service = YourService(db)
        result = service.do_heavy_work(symbol)
        return {"status": "success", "result": result}
    finally:
        db.close()
```

**Use cases**: AI model training, bulk data collection, scheduled reports

### Step 3: Frontend Implementation

#### 3.1 Page Structure
**Location**: `frontend/src/app/your-feature/page.tsx`

**Template**:
```typescript
'use client';

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Line } from 'react-chartjs-2';  // or other chart types

export default function YourFeaturePage() {
  const { t } = useTranslation();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/your-endpoint`);
      const result = await response.json();
      setData(result);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <h1 className="text-3xl font-bold text-primary mb-6">
        {t('yourFeature.title')}
      </h1>
      
      {loading ? (
        <div className="text-center text-secondary">Loading...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Your components here */}
        </div>
      )}
    </div>
  );
}
```

#### 3.2 Cyberpunk Theme Styling

**Required Tailwind Classes**:
```tsx
// Backgrounds
className="bg-background"     // Dark blue (#0A1628)
className="bg-card"          // Card background (#1A2332)

// Text Colors
className="text-primary"     // Cyan (#00D9FF)
className="text-secondary"   // Purple (#B24BF3)
className="text-accent"      // Green (#00FFB3)

// Neon Shadows (for emphasis)
className="shadow-neon-cyan"
className="shadow-neon-purple"
className="shadow-neon-green"

// Gradients
className="bg-gradient-cyan-purple"

// Typical Card Layout
<div className="bg-card rounded-lg p-6 shadow-neon-cyan">
  <h2 className="text-xl font-bold text-primary mb-4">{title}</h2>
  {/* Content */}
</div>
```

**⚠️ Critical Rules**:
- Use ONLY theme tokens from `tailwind.config.ts`
- Never hardcode colors (e.g., `#00D9FF`) — use `text-primary`
- All cards should have neon shadow for Cyberpunk effect
- Mobile-first: use `md:`, `lg:` breakpoints

#### 3.3 Chart Integration

**Install**: Already included via `chart.js` and `react-chartjs-2`

**Template**:
```typescript
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line } from 'react-chartjs-2';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const chartData = {
  labels: timestamps,
  datasets: [
    {
      label: 'Price (USD)',
      data: prices,
      borderColor: '#00D9FF',      // Primary cyan
      backgroundColor: 'rgba(0, 217, 255, 0.1)',
      borderWidth: 2,
      fill: true,
      tension: 0.4,  // Smooth curves
    }
  ]
};

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      labels: { color: '#00D9FF' }  // Cyberpunk theme
    }
  },
  scales: {
    x: { 
      ticks: { color: '#B24BF3' },  // Secondary purple
      grid: { color: 'rgba(178, 75, 243, 0.1)' }
    },
    y: {
      ticks: { color: '#00FFB3' },  // Accent green
      grid: { color: 'rgba(0, 255, 179, 0.1)' }
    }
  }
};

<div className="h-[400px]">
  <Line data={chartData} options={chartOptions} />
</div>
```

**Chart Types**:
- **Line**: Price trends, funding rates, predictions
- **Candlestick**: Need to use `chartjs-chart-financial` plugin
- **Bar**: Volume, open interest changes
- **Scatter**: Correlation analysis, risk/reward plots

#### 3.4 WebSocket Real-time Updates

**Template**:
```typescript
import { useEffect, useRef } from 'react';
import io from 'socket.io-client';

export default function RealtimePage() {
  const socketRef = useRef(null);

  useEffect(() => {
    // Connect to WebSocket
    socketRef.current = io(process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:8000', {
      path: '/ws/socket.io',
      transports: ['websocket']
    });

    // Subscribe to updates
    socketRef.current.on('market_update', (data) => {
      console.log('Real-time update:', data);
      // Update state
    });

    // Cleanup on unmount
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []);

  return (
    // Your component
  );
}
```

#### 3.5 State Management (Zustand)

**Create Store**: `frontend/src/stores/yourStore.ts`
```typescript
import { create } from 'zustand';

interface YourState {
  data: any[];
  loading: boolean;
  setData: (data: any[]) => void;
  setLoading: (loading: boolean) => void;
}

export const useYourStore = create<YourState>((set) => ({
  data: [],
  loading: false,
  setData: (data) => set({ data }),
  setLoading: (loading) => set({ loading })
}));
```

**Use in Component**:
```typescript
import { useYourStore } from '@/stores/yourStore';

const { data, loading, setData } = useYourStore();
```

#### 3.6 Internationalization (i18n)

**Add Translations**: `frontend/public/locales/{zh-TW,en-US}/translation.json`
```json
{
  "yourFeature": {
    "title": "你的功能標題",
    "description": "描述文字",
    "button": "按鈕文字"
  }
}
```

**Use in Component**:
```typescript
import { useTranslation } from 'react-i18next';

const { t } = useTranslation();
<h1>{t('yourFeature.title')}</h1>
```

### Step 4: Technical Indicators Integration

**Common Indicators** (already implemented in `backend/app/services/`):
- **RSI** (Relative Strength Index): Overbought/oversold detection
- **MACD** (Moving Average Convergence Divergence): Trend momentum
- **Bollinger Bands**: Volatility and price channels
- **EMA/SMA**: Moving averages for trend confirmation
- **Volume Profile**: Support/resistance levels
- **OI Change**: Open interest analysis for contract markets

**Backend Calculation Pattern**:
```python
# In your service
def calculate_rsi(self, prices: List[float], period: int = 14) -> float:
    """Calculate RSI indicator"""
    import pandas as pd
    import numpy as np
    
    df = pd.DataFrame({'price': prices})
    delta = df['price'].diff()
    gain = delta.where(delta > 0, 0).rolling(window=period).mean()
    loss = -delta.where(delta < 0, 0).rolling(window=period).mean()
    
    rs = gain / loss
    rsi = 100 - (100 / (1 + rs))
    return rsi.iloc[-1]
```

**Frontend Display**:
```typescript
// Display RSI with color coding
<div className={`text-lg font-bold ${
  rsi > 70 ? 'text-red-500' :     // Overbought
  rsi < 30 ? 'text-green-500' :   // Oversold
  'text-yellow-500'               // Neutral
}`}>
  RSI: {rsi.toFixed(2)}
</div>
```

### Step 5: AI Model Integration

#### 5.1 Training Workflow

**Trigger Training** (via Celery task):
```python
# backend/app/tasks/ai_training.py
@celery_app.task(name="train_model")
def train_model_task(symbol: str, model_type: str, config: dict):
    from app.services.ai_training_service import AITrainingService
    
    db = SessionLocal()
    try:
        service = AITrainingService(db)
        result = service.train_model(
            symbol=symbol,
            model_type=model_type,  # 'LSTM', 'XGBoost', 'RandomForest', etc.
            features=config['features'],
            target=config['target'],
            lookback_period=config.get('lookback_period', 60)
        )
        return result
    finally:
        db.close()
```

**Model Storage**:
- Trained models saved to: `AI_MODEL_DIR` (default `/app/ai_models`, Docker volume)
- Metadata in database: `ai_models` table
- Format: Pickle (.pkl) or joblib (.joblib)

#### 5.2 Prediction Workflow

```python
# backend/app/services/ai_prediction_service.py
class AIPredictionService:
    async def predict(self, symbol: str, model_id: int) -> dict:
        # Load model from disk
        model = self.load_model(model_id)
        
        # Fetch recent market data
        features = await self.prepare_features(symbol)
        
        # Make prediction
        prediction = model.predict(features)
        
        # Store prediction in DB
        self.save_prediction(symbol, model_id, prediction)
        
        return {
            "symbol": symbol,
            "prediction": float(prediction),
            "confidence": self.calculate_confidence(model, features),
            "timestamp": datetime.utcnow()
        }
```

#### 5.3 Frontend AI Dashboard

**Training Page** (`/ai-training`):
- Model selection (LSTM, XGBoost, etc.)
- Symbol input
- Feature configuration
- Training status (Celery task progress)
- Model performance metrics (accuracy, MSE, R²)

**Prediction Page** (`/ai-predictions`):
- Model selection
- Real-time predictions
- Confidence indicators
- Historical accuracy charts

### Step 6: Testing

#### Backend Tests
```bash
cd backend
pytest tests/
```

**Write Test**:
```python
# backend/tests/test_your_endpoint.py
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_your_endpoint():
    response = client.get("/api/v1/your-endpoint?symbol=BTC_USDT")
    assert response.status_code == 200
    assert "symbol" in response.json()
```

#### Frontend Tests
```bash
cd frontend
npm test
```

### Step 7: DigitalOcean Deployment

#### 7.1 Pre-Deployment Checklist

**Environment Variables** (set in DigitalOcean dashboard):
```bash
# Required
DATABASE_URL=postgresql://user:pass@host:port/db?sslmode=require
REDIS_URL=redis://user:pass@host:port
SECRET_KEY=<generate via `python generate_secret_key.py`>

# Optional (MEXC API)
MEXC_API_KEY=your_api_key
MEXC_SECRET_KEY=your_secret_key

# Frontend
NEXT_PUBLIC_API_URL=https://your-backend-url.ondigitalocean.app
NEXT_PUBLIC_WS_URL=https://your-backend-url.ondigitalocean.app

# CORS
ALLOWED_ORIGINS=https://your-frontend-url.ondigitalocean.app
```

#### 7.2 Deployment Process

**Method 1: GitHub Auto-Deploy** (recommended)
```bash
git add .
git commit -m "feat: your feature description"
git push origin main
# DigitalOcean auto-deploys from main branch
```

**Method 2: Manual via doctl CLI**
```bash
# Install doctl
# Windows: choco install doctl
# Mac: brew install doctl

# Authenticate
doctl auth init

# Deploy from app spec
doctl apps create --spec .do/app.yaml

# Update existing app
doctl apps update YOUR_APP_ID --spec .do/app.yaml
```

#### 7.3 Post-Deployment Verification

1. **Check Build Logs**:
   ```bash
   doctl apps logs YOUR_APP_ID --type build --follow
   ```

2. **Check Runtime Logs**:
   ```bash
   doctl apps logs YOUR_APP_ID --type run --component backend --follow
   ```

3. **Verify Endpoints**:
   - Backend health: `https://your-backend-url/api/v1/health`
   - API docs: `https://your-backend-url/docs`
   - Frontend: `https://your-frontend-url/`

4. **Test Database Connection**:
   ```bash
   # Via DigitalOcean console
   doctl databases connection YOUR_DB_ID --format ConnectionString
   ```

#### 7.4 Common Deployment Issues

**Issue: SQLAlchemy `metadata` column error**
- ✅ Renamed to `extra_data` (fixed in current codebase)

**Issue: Pydantic v1 vs v2 syntax**
- ✅ Use `model_config = {"from_attributes": True}`
- ❌ Don't use old `Config` class

**Issue: CORS errors**
- Ensure `ALLOWED_ORIGINS` includes frontend URL
- Check `backend/app/main.py` CORS middleware config

**Issue: WebSocket connection fails**
- Verify `NEXT_PUBLIC_WS_URL` is set correctly
- Check Socket.IO path: `/ws/socket.io`

**Issue: Redis connection timeout**
- Ensure managed Redis is in same region as app
- Check `REDIS_URL` format: `redis://user:pass@host:port`

## Multi-Page Architecture Patterns

### Shared Data Flow

**Pattern 1: API-first (recommended)**
```
All pages → Backend API → Database
            ↓
         Redis Cache (30s-5m)
```
- Each page independently fetches data
- Backend handles caching and deduplication
- No frontend state sync needed

**Pattern 2: Zustand Global Store**
```typescript
// For cross-page state (e.g., selected symbol)
import { create } from 'zustand';

interface GlobalState {
  selectedSymbol: string;
  setSelectedSymbol: (symbol: string) => void;
}

export const useGlobalStore = create<GlobalState>((set) => ({
  selectedSymbol: 'BTC_USDT',
  setSelectedSymbol: (symbol) => set({ selectedSymbol: symbol })
}));
```

**Pattern 3: URL Params for Deep Links**
```typescript
// In page component
import { useSearchParams } from 'next/navigation';

const searchParams = useSearchParams();
const symbol = searchParams.get('symbol') || 'BTC_USDT';

// Navigation with params
<Link href={`/ai-predictions?symbol=${symbol}`}>
  View Predictions
</Link>
```

### Navigation Integration

**Update**: `frontend/src/components/Navigation.tsx`
```typescript
const navItems = [
  { href: '/', label: 'home', icon: Home },
  { href: '/crypto-radar', label: 'cryptoRadar', icon: Activity },
  { href: '/ai-predictions', label: 'aiPredictions', icon: TrendingUp },
  { href: '/your-new-page', label: 'yourFeature', icon: YourIcon },  // Add here
  // ...
];
```

## Page-Specific Patterns

### Crypto Radar (Real-time Market Overview)
- **Data**: WebSocket market updates every 1s
- **Charts**: Line charts for price trends (last 24h)
- **Indicators**: RSI, funding rate, OI change
- **UI**: Card grid with live price tickers

### AI Training (Model Management)
- **Data**: Celery task status polling
- **Forms**: Symbol input, model type selection, hyperparameters
- **Progress**: Real-time training progress bar
- **Results**: Model metrics table, performance charts

### AI Predictions (Forecast Dashboard)
- **Data**: Latest predictions from trained models
- **Charts**: Line chart (historical + predicted), confidence intervals
- **Filters**: Symbol, model type, time range
- **Alerts**: High-confidence signals highlighted

### Pattern Detection (Chart Patterns)
- **Data**: Candlestick data + pattern recognition results
- **Charts**: Candlestick chart with pattern overlays
- **Patterns**: Head & Shoulders, Double Top/Bottom, Triangles
- **UI**: Pattern list with confidence scores

### Market Screener (Multi-symbol Filtering)
- **Data**: All symbols with latest indicators
- **Table**: Sortable/filterable table (DataGrid component)
- **Filters**: Price change, volume, RSI, funding rate
- **Export**: CSV export of filtered results

## Quality Checklist

Before committing:
- [ ] All MEXC API calls go through `core/mexc/contract.py`
- [ ] No hardcoded colors — only Tailwind theme tokens
- [ ] API endpoints return `currency: "USD"`
- [ ] Database models use `extra_data` instead of `metadata`
- [ ] Pydantic v2 syntax (`model_config` not `Config`)
- [ ] Charts use Cyberpunk theme colors (#00D9FF, #B24BF3, #00FFB3)
- [ ] Mobile responsive (test on `md:` and `lg:` breakpoints)
- [ ] i18n keys added for zh-TW and en-US
- [ ] Environment variables added to `.env.example`
- [ ] API documentation updated in Swagger (`/docs`)

Before deploying:
- [ ] All environment variables set in DigitalOcean
- [ ] `ALLOWED_ORIGINS` includes production frontend URL
- [ ] Database migrations applied
- [ ] Redis connection tested
- [ ] Build logs checked for errors
- [ ] Health endpoint returns 200 OK
- [ ] WebSocket connection tested (frontend)

## Key Files Reference

| Purpose | Backend | Frontend |
|---------|---------|----------|
| **Config** | `app/core/config.py` | `next.config.js`, `tailwind.config.ts` |
| **Database** | `app/models/*.py` | — |
| **API** | `app/api/v1/endpoints/*.py` | — |
| **Services** | `app/services/*.py` | — |
| **Tasks** | `app/tasks/*.py` | — |
| **Pages** | — | `src/app/**/page.tsx` |
| **Components** | — | `src/components/*.tsx` |
| **Stores** | — | `src/stores/*.ts` |
| **i18n** | — | `public/locales/*/translation.json` |
| **Deployment** | `.do/app.yaml` | `.do/app.yaml` |

## Example Workflows

### Adding a New Trading Signal Page

1. **Backend**:
   - Create model: `backend/app/models/your_signal.py`
   - Create schema: `backend/app/schemas/your_signal.py`
   - Create service: `backend/app/services/your_signal_service.py`
   - Create endpoint: `backend/app/api/v1/endpoints/your_signal.py`
   - Register router in `backend/app/main.py`

2. **Frontend**:
   - Create page: `frontend/src/app/your-signal/page.tsx`
   - Add navigation item in `frontend/src/components/Navigation.tsx`
   - Add i18n keys in `frontend/public/locales/*/translation.json`
   - Fetch data from `/api/v1/your-signal`
   - Display with Cyberpunk theme cards + neon shadows

3. **Deploy**:
   - Commit and push to `main` branch
   - DigitalOcean auto-deploys
   - Verify at production URL

### Integrating a New AI Model

1. **Backend**:
   - Define training logic in `backend/app/services/ai_training_service.py`
   - Add model type to `AIModelType` enum
   - Create Celery task in `backend/app/tasks/ai_training.py`
   - Implement prediction in `backend/app/services/ai_prediction_service.py`

2. **Frontend**:
   - Add model type to training page dropdown
   - Display training progress (Celery task polling)
   - Show predictions in dashboard
   - Visualize with confidence charts

3. **Test**:
   - Train model locally with test data
   - Verify model file saved to `ai_models/`
   - Check prediction accuracy
   - Deploy and verify in production

---

## Quick Commands Reference

```bash
# Local Development
docker-compose up -d              # Start all services
docker-compose logs -f backend    # View backend logs
docker-compose exec postgres psql # Access database

# Backend
cd backend
pytest                            # Run tests
python -m app.db.init_db          # Initialize database
celery -A app.tasks.celery_app worker --loglevel=info  # Start worker

# Frontend
cd frontend
npm run dev                       # Development server
npm run build                     # Production build
npm run lint                      # ESLint check

# Deployment (DigitalOcean)
doctl apps list                   # List apps
doctl apps create --spec .do/app.yaml  # Create app
doctl apps logs <APP_ID> --type build --follow  # Build logs
doctl apps logs <APP_ID> --type run --component backend --follow  # Runtime logs
```

