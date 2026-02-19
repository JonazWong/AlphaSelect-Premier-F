# AlphaSelect Premier F - Deployment Guide

## ✅ Critical Fixes Implemented

### 1. SQLAlchemy Metadata Conflict - FIXED
- ✅ Renamed `metadata` column to `extra_data` in `ContractMarket` model
- ✅ Renamed `metadata` column to `extra_data` in `Prediction` model
- ✅ Added proper indexes for better query performance
- ✅ Updated all API code to use `extra_data`

### 2. Crypto Radar 500 Error - FIXED
- ✅ Created `/api/v1/contract/signals` endpoint for trading signals
- ✅ Created `/api/v1/contract/market-stats` endpoint for market statistics
- ✅ Added Pydantic schemas for proper API validation
- ✅ Improved error handling with detailed logging

### 3. Currency Units (USD) - FIXED
- ✅ All API endpoints now explicitly return `currency: "USD"`
- ✅ Frontend displays USD explicitly in all price fields
- ✅ MEXC API data is properly mapped to USD (USDT-based pairs)

### 4. Database Initialization - ENHANCED
- ✅ Added comprehensive logging to `init_db.py`
- ✅ All models properly imported and tables created on startup

## 🚀 Quick Start

### Local Development with Docker

1. **Clone the repository:**
   ```bash
   git clone https://github.com/JonazWong/AlphaSelect-Premier-F.git
   cd AlphaSelect-Premier-F
   ```

2. **Set up environment variables:**
   ```bash
   cp .env.example .env
   # Edit .env and add your MEXC API credentials
   ```

3. **Start all services:**
   ```bash
   docker-compose up -d
   ```

4. **Verify services:**
   - Backend API: http://localhost:8000
   - Frontend: http://localhost:3000
   - API Docs: http://localhost:8000/docs

### DigitalOcean Deployment

1. **Push to main branch:**
   ```bash
   git push origin main
   ```

2. **Configure DigitalOcean App Platform:**
   - Use the provided `app.yaml` configuration
   - Set required environment variables:
     - `MEXC_API_KEY`
     - `MEXC_SECRET_KEY`
     - `SECRET_KEY`
     - Database and Redis URLs (auto-configured)

3. **Deploy:**
   - DigitalOcean will automatically deploy on push to main
   - Monitor deployment at: https://cloud.digitalocean.com/apps

## 📊 API Endpoints

### Contract Market Endpoints

#### Get Trading Signals (NEW)
```
GET /api/v1/contract/signals?direction=long&limit=10
```
Returns AI-powered trading signals with entry, stop loss, and targets.

**Response:**
```json
[
  {
    "symbol": "BTC_USDT",
    "direction": "Long",
    "currentPrice": 50000.00,
    "entryPrice": 50000.00,
    "stopLoss": 48500.00,
    "target1": 51500.00,
    "target2": 52500.00,
    "leverage": "10x",
    "fundingRate": 0.0001,
    "openInterest": "1000000",
    "openInterestChange": 5.2,
    "confidence": 75,
    "riskLevel": "Medium",
    "signals": ["動量強勁", "成交量放大"],
    "currency": "USD"
  }
]
```

#### Get Market Statistics (NEW)
```
GET /api/v1/contract/market-stats
```
Returns overall market health metrics.

**Response:**
```json
{
  "strength": 7,
  "winRate": 64.82,
  "avgFundingRate": 0.0001,
  "totalOI": "$15.50B",
  "currency": "USD"
}
```

### Existing Endpoints
- `GET /api/v1/contract/ticker/{symbol}` - Get ticker data
- `GET /api/v1/contract/tickers` - Get all tickers
- `GET /api/v1/contract/funding-rate/{symbol}` - Get funding rate
- `GET /api/v1/contract/open-interest/{symbol}` - Get open interest

## 🗄️ Database Schema

### Tables Created
1. **contract_markets** - Contract market data with USD pricing
2. **funding_rate_history** - Historical funding rates
3. **open_interest_history** - Historical open interest
4. **ai_models** - AI model metadata and metrics
5. **predictions** - AI predictions and results

### Key Changes
- `metadata` → `extra_data` (avoid SQLAlchemy conflicts)
- Added composite indexes for better performance
- All monetary values stored as floats (USD)

## 🔧 Environment Variables

### Required
- `MEXC_API_KEY` - Your MEXC API key
- `MEXC_SECRET_KEY` - Your MEXC secret key
- `DATABASE_URL` - PostgreSQL connection string
- `REDIS_URL` - Redis connection string
- `SECRET_KEY` - Application secret key

### Optional
- `MEXC_CONTRACT_BASE_URL` - Default: https://contract.mexc.com
- `MEXC_SPOT_BASE_URL` - Default: https://api.mexc.com
- `AI_MODEL_DIR` - Default: /app/ai_models
- `ALLOWED_ORIGINS` - CORS origins

## 🧪 Testing

Run backend tests:
```bash
cd backend
pytest app/tests/
```

## 📝 Migration Notes

If you have existing data with the old `metadata` column:

```sql
-- Rename metadata column in contract_markets
ALTER TABLE contract_markets RENAME COLUMN metadata TO extra_data;

-- Rename metadata column in predictions
ALTER TABLE predictions RENAME COLUMN extra_data TO extra_data;

-- Add indexes if not exists
CREATE INDEX IF NOT EXISTS idx_symbol_created ON contract_markets(symbol, created_at);
CREATE INDEX IF NOT EXISTS idx_symbol_prediction_time ON predictions(symbol, prediction_time);
```

## ⚠️ Important Notes

1. **MEXC API Rate Limits:**
   - Public endpoints: 20 requests/second
   - Private endpoints: 10 requests/second
   - Circuit breaker protects against rate limit violations

2. **Currency Display:**
   - All prices are in USD (USDT pairs)
   - Frontend explicitly shows "USD" labels
   - API responses include `currency: "USD"` field

3. **Auto-Refresh:**
   - Crypto Radar page auto-refreshes every 30 seconds
   - Manual refresh button available
   - Loading states prevent duplicate requests

## 🔒 Security

- API keys stored as environment variables (never in code)
- CORS properly configured for production
- Rate limiting and circuit breakers protect APIs
- All sensitive data logged safely (no credentials in logs)

## 📞 Support

For issues or questions:
- GitHub Issues: https://github.com/JonazWong/AlphaSelect-Premier-F/issues
- Documentation: See ARCHITECTURE.md and API docs

## 🎉 Deployment Checklist

- [x] Fix SQLAlchemy metadata conflicts
- [x] Add missing API endpoints (/signals, /market-stats)
- [x] Update frontend to use new endpoints
- [x] Ensure USD currency display
- [x] Add proper error handling
- [x] Create DigitalOcean app.yaml
- [ ] Set environment variables in DigitalOcean
- [ ] Test deployment
- [ ] Monitor logs for errors
- [ ] Verify MEXC API connectivity
