---
description: "Create a complete trading signal feature including backend API endpoint, database model, and frontend page for AlphaSelect Premier F. Prompts for signal type, indicators, and thresholds."
name: "Create Trading Signal"
argument-hint: "Signal name and indicators..."
agent: "agent"
---
# Create Trading Signal Feature

You will create a complete trading signal feature for **AlphaSelect Premier F** (MEXC crypto trading analysis platform).

## Required Information

Please provide:
1. **Signal Name** (e.g., "Extreme Funding Rate", "Volume Spike", "RSI Divergence")
2. **Signal Type**: `long` (buy) or `short` (sell) or `both`
3. **Indicators Used** (e.g., "Funding Rate", "RSI", "Volume", "Open Interest")
4. **Trigger Conditions** (e.g., "Funding rate > 0.1%", "RSI < 30")
5. **Risk Level Calculation** (e.g., based on volatility, position size, leverage)

If any required information is missing, ask the user for it.

## Implementation Steps

### 1. Backend: Database Model

Create in `backend/app/models/your_signal.py`:
- Fields: `id`, `symbol`, `timestamp`, `signal_type`, `confidence`, `trigger_value`, `risk_level`, `extra_data` (JSONB)
- Add composite index on `symbol` and `timestamp`
- **NEVER** use column name `metadata` (SQLAlchemy reserved)

### 2. Backend: Pydantic Schema

Create in `backend/app/schemas/your_signal.py`:
- Use Pydantic v2 syntax: `model_config = {"from_attributes": True}`
- Include `currency: str = Field(default="USD")` for price fields
- Add comprehensive `Field(..., description="...")` for all fields

### 3. Backend: Service Layer

Create in `backend/app/services/your_signal_service.py`:
- Implement signal detection logic using specified indicators
- Calculate confidence score (0-100)
- Determine risk level (Low/Medium/High)
- Use `MexcContractClient` from `app.core.mexc.contract` for MEXC API calls (NEVER call MEXC directly)
- Include proper error handling and logging

### 4. Backend: API Endpoint

Create in `backend/app/api/v1/endpoints/your_signal.py`:
- GET endpoint: `/api/v1/signals/your-signal?symbol=BTC_USDT&limit=10`
- Response model with proper typing
- Comprehensive docstring for Swagger UI
- Query parameter validation (symbol required, limit 1-100)
- Error handling: 400 for validation, 404 for not found, 500 for server errors

Register router in `backend/app/main.py`:
```python
from app.api.v1.endpoints import your_signal
app.include_router(your_signal.router, prefix="/api/v1/signals", tags=["Trading Signals"])
```

### 5. Frontend: Page Component

Create in `frontend/src/app/your-signal/page.tsx`:
- **Cyberpunk theme**: `bg-background`, `text-primary`, `shadow-neon-cyan`
- Card layout with signal list
- Chart showing signal trigger history (Chart.js with Cyberpunk colors)
- Real-time updates via polling or WebSocket
- i18n: Add translation keys to `public/locales/{zh-TW,en-US}/translation.json`

### 6. Frontend: Navigation

Update `frontend/src/components/Navigation.tsx`:
- Add new navigation item with appropriate icon
- Translation key: `navigation.yourSignal`

### 7. Testing

- Test backend endpoint via Swagger UI (`/docs`)
- Verify signal detection logic with edge cases
- Test frontend page on mobile and desktop
- Check i18n for both zh-TW and en-US

## Quality Checklist

Before completing:
- [ ] Database model uses `extra_data` not `metadata`
- [ ] Pydantic schemas use v2 syntax
- [ ] API endpoint has comprehensive docstring
- [ ] MEXC API calls go through `MexcContractClient`
- [ ] Frontend uses ONLY Cyberpunk theme colors (no hardcoded hex)
- [ ] Charts use themed colors (#00D9FF, #B24BF3, #00FFB3)
- [ ] i18n keys added for zh-TW and en-US
- [ ] Mobile responsive layout tested
- [ ] Error states handled gracefully

## Example Signal Types

**Extreme Funding Rate Alert**
- Indicators: Funding rate history
- Triggers: Funding rate > 0.1% or < -0.1%
- Risk: Based on funding rate magnitude

**RSI Oversold/Overbought**
- Indicators: RSI (14 period)
- Triggers: RSI < 30 (oversold) or > 70 (overbought)
- Risk: Based on RSI extremity and volume

**Volume Spike Detection**
- Indicators: Volume, average volume (24h)
- Triggers: Current volume > 2x average
- Risk: Based on price movement + volume ratio

**Open Interest Surge**
- Indicators: Open interest change (%)
- Triggers: OI change > 10% in 1h
- Risk: Based on OI change rate and price volatility

Implement the complete feature following AlphaSelect Premier F conventions.
