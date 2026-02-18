# System Architecture

## Overview

AlphaSelect Premier F follows a modern microservices architecture with clear separation of concerns.

```
┌─────────────────────────────────────────────────────────────┐
│                         Frontend                             │
│                    (Next.js 14 + TypeScript)                 │
│                                                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Crypto Radar │  │ AI Training  │  │ AI Predict   │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└───────────────────────────┬─────────────────────────────────┘
                            │ HTTP/WebSocket
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                         Backend                              │
│                    (FastAPI + Python 3.11)                   │
│                                                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ API Gateway  │  │ Rate Limiter │  │Circuit Break │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│                                                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │Contract Svc  │  │ AI Service   │  │ Indicator Svc│      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└───────────────────────────┬─────────────────────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        ▼                   ▼                   ▼
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│ PostgreSQL   │    │    Redis     │    │   Celery     │
│      +       │    │   (Cache +   │    │   Workers    │
│ TimescaleDB  │    │    Queue)    │    │              │
└──────────────┘    └──────────────┘    └──────────────┘
        ▲                   ▲                   ▲
        └───────────────────┴───────────────────┘
                            │
                            ▼
                    ┌──────────────┐
                    │  MEXC API    │
                    │  (External)  │
                    └──────────────┘
```

## Components

### Frontend Layer

#### Next.js 14 Application
- **App Router**: Modern Next.js routing
- **Server Components**: For better performance
- **Client Components**: Interactive UI elements
- **Tailwind CSS**: Utility-first styling with Cyberpunk theme

#### Key Pages
1. **Home** (`/`): Landing page with feature overview
2. **Crypto Radar** (`/crypto-radar`): Real-time contract trading signals
3. **AI Training** (`/ai-training`): Model training interface
4. **AI Predictions** (`/ai-predictions`): Prediction dashboard
5. **Pattern Detection** (`/pattern-detection`): Chart pattern analysis
6. **Market Screener** (`/market-screener`): Trading pair filtering

### Backend Layer

#### FastAPI Application
- **REST API**: JSON-based endpoints
- **WebSocket**: Real-time data streaming
- **Auto Documentation**: Swagger UI at `/docs`

#### Core Modules

##### 1. MEXC API Client (`app/core/mexc/contract.py`)
- Rate limiting (100 req/10s)
- Circuit breaker (5 failures → 60s timeout)
- Exponential backoff retry
- Comprehensive error handling

##### 2. Rate Limiter (`app/core/rate_limiter.py`)
- Redis-backed sliding window
- Distributed rate limiting
- Configurable limits per endpoint

##### 3. Circuit Breaker (`app/core/circuit_breaker.py`)
- Three states: CLOSED, OPEN, HALF_OPEN
- Automatic failure detection
- Self-healing mechanism

##### 4. Database Models (`app/models/`)
- **ContractMarket**: Real-time market data
- **FundingRateHistory**: Historical funding rates
- **OpenInterestHistory**: Historical OI data
- **AIModel**: Trained model metadata
- **Prediction**: AI predictions and results

##### 5. Services (`app/services/`)
- **ContractService**: Market data operations
- **FundingRateService**: Funding rate analysis
- **IndicatorService**: Technical indicators
- **AIService**: AI model management

##### 6. API Endpoints (`app/api/v1/endpoints/`)
- **contract_market.py**: Market data endpoints
- **funding_rate.py**: Funding rate endpoints
- **open_interest.py**: Open interest endpoints
- **ai_training.py**: Model training endpoints
- **ai_predict.py**: Prediction endpoints
- **indicators.py**: Technical analysis endpoints

### Data Layer

#### PostgreSQL 16 + TimescaleDB
- **Tables**: Contract markets, funding rates, OI, models, predictions
- **Time-series**: Optimized for time-series data with TimescaleDB
- **Indexing**: Proper indexes on symbol, timestamp columns

#### Redis 7
- **Caching**: Market data caching (30s-5m TTL)
- **Rate Limiting**: Request counters
- **Circuit Breaker**: Failure state storage
- **Celery Queue**: Task queue for async jobs

### Task Queue Layer

#### Celery Workers
- **Market Tasks**: Periodic data collection
- **AI Training Tasks**: Long-running model training
- **Cleanup Tasks**: Database maintenance

### AI/ML Layer

#### Models (Future Implementation)
1. **LSTM**: Deep learning for long-term trends
2. **XGBoost**: High-accuracy short-term predictions
3. **Random Forest**: Ensemble learning
4. **ARIMA**: Classical time-series
5. **Linear Regression**: Baseline model
6. **Ensemble**: Combined model with weighted voting

#### Feature Engineering
- Price features (OHLCV, returns, ranges)
- Funding rate features (MA, STD, changes)
- Open interest features (changes, ratios, trends)
- Technical indicators (RSI, MACD, Bollinger)
- Contract-specific (basis, basis rate, leverage risk)

## Data Flow

### Market Data Flow
```
MEXC API → Rate Limiter → Circuit Breaker → Contract Service
                                              ↓
                                         PostgreSQL
                                              ↓
                                    Frontend (via API)
```

### AI Training Flow
```
User Request → API Gateway → Celery Task
                               ↓
                        Feature Engineering
                               ↓
                         Model Training
                               ↓
                    Save to PostgreSQL + Disk
                               ↓
                      Update Training Status
```

### Real-time Updates Flow
```
Celery Task → Market Data Collection → Redis Cache
                                         ↓
                                    WebSocket
                                         ↓
                                   Frontend Update
```

## Security Architecture

### API Security
- **Rate Limiting**: Prevents abuse
- **Circuit Breaker**: Protects against cascading failures
- **CORS**: Configured allowed origins
- **Environment Variables**: Sensitive data protection

### Database Security
- **Parameterized Queries**: SQL injection prevention
- **SSL/TLS**: Encrypted connections (production)
- **Access Control**: Role-based permissions

### Data Security
- **API Keys**: Never committed to repository
- **Secret Management**: Environment variables + .env
- **Read-Only API**: MEXC API with read-only permissions

## Scalability

### Horizontal Scaling
- **Frontend**: Multiple Next.js instances behind load balancer
- **Backend**: Multiple FastAPI instances
- **Celery Workers**: Add workers as needed
- **Database**: Read replicas for scaling reads

### Vertical Scaling
- **Database**: Upgrade PostgreSQL instance size
- **Redis**: Upgrade Redis instance size
- **AI Training**: GPU instances for faster training

### Caching Strategy
- **Market Data**: 30s cache for tickers
- **K-line Data**: 5m cache
- **Static Data**: Aggressive caching

## Monitoring & Logging

### Application Logging
- **Python**: Standard logging module
- **Structured Logs**: JSON format
- **Log Levels**: DEBUG, INFO, WARNING, ERROR, CRITICAL

### Metrics (Future)
- Request rates
- Response times
- Error rates
- Cache hit rates
- Model accuracy

### Alerting (Future)
- API failures
- Database issues
- High error rates
- Circuit breaker trips

## Deployment Architecture

### Development
```
Docker Compose
├── PostgreSQL container
├── Redis container
├── Backend container
├── Celery worker container
└── Frontend container
```

### Production (DigitalOcean)
```
App Platform
├── Backend service (2+ instances)
├── Frontend service (2+ instances)
├── Celery worker service
├── Managed PostgreSQL 16
└── Managed Redis 7
```

## Performance Optimization

### Backend
- Connection pooling (10-20 connections)
- Async operations where possible
- Efficient database queries
- Redis caching

### Frontend
- Static page generation
- Image optimization
- Code splitting
- Lazy loading

### Database
- Proper indexing
- TimescaleDB for time-series
- Query optimization
- Regular VACUUM

## Future Enhancements

1. **WebSocket Implementation**: Real-time data streaming
2. **AI Models**: Complete LSTM, XGBoost, ensemble models
3. **Backtesting**: Historical strategy testing
4. **Advanced Charts**: TradingView integration
5. **Mobile App**: React Native application
6. **Advanced Analytics**: More technical indicators
7. **User Authentication**: Multi-user support
8. **Portfolio Tracking**: Track trading performance
