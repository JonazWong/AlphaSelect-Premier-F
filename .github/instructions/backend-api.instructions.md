---
description: "Use when creating or modifying FastAPI endpoint files in backend/app/api/v1/endpoints/. Ensures proper API documentation, error handling, Pydantic v2 schemas, and MEXC API integration patterns."
applyTo: "backend/app/api/v1/endpoints/**/*.py"
---
# Backend API Endpoint Guidelines

## Required Imports

```python
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from app.api.deps import get_db
from app.schemas.your_schema import YourResponse, YourRequest
from app.services.your_service import YourService
```

## Router Pattern

```python
router = APIRouter()

@router.get("/endpoint", response_model=List[YourResponse], tags=["Category"])
async def get_endpoint(
    symbol: str = Query(..., description="Trading pair (e.g., BTC_USDT)"),
    limit: int = Query(10, ge=1, le=100, description="Max results"),
    db: Session = Depends(get_db)
):
    """
    Comprehensive endpoint documentation.
    
    - **symbol**: Trading pair symbol (required)
    - **limit**: Maximum number of results (1-100)
    
    Returns list of results with USD prices.
    """
    try:
        service = YourService(db)
        results = await service.get_data(symbol, limit)
        return results
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error in get_endpoint: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")
```

## Critical Rules

### 1. API Documentation
- **ALWAYS** include comprehensive docstrings
- Use `Query(..., description="...")` for all query parameters
- Set `response_model` for automatic validation
- Add parameter descriptions in docstring bullet points
- Include example values where helpful

### 2. Error Handling
- Wrap service calls in try-except blocks
- 400 for validation errors (bad user input)
- 404 for resource not found
- 500 for server errors (log details, return generic message)
- **NEVER** expose internal error details to clients

### 3. Pydantic v2 Syntax
- Use `model_config = {"from_attributes": True}` NOT old `Config` class
- Use `Field(..., description="...")` for schema documentation

### 4. MEXC API Integration
- **NEVER** call MEXC API directly
- **ALWAYS** use `MexcContractClient` from `app.core.mexc.contract`
- Client includes rate limiting and circuit breaker
- Example:
  ```python
  from app.core.mexc.contract import MexcContractClient
  mexc = MexcContractClient()
  data = await mexc.get_contract_detail(symbol)
  ```

### 5. Currency Display
- **ALWAYS** include `currency: "USD"` in price-related responses
- All MEXC USDT pairs map to USD for display

### 6. Versioning
- All API routes under `/api/v1/` prefix
- Register router in `backend/app/main.py`:
  ```python
  app.include_router(your_endpoint.router, prefix="/api/v1/your-prefix", tags=["Your Tag"])
  ```

### 7. Database Queries
- Use service layer for business logic
- Never write raw SQL in endpoints
- Use SQLAlchemy ORM with proper relationships

## Response Schema Template

```python
from pydantic import BaseModel, Field
from datetime import datetime

class YourResponse(BaseModel):
    symbol: str = Field(..., description="Trading pair symbol")
    price: float = Field(..., description="Current price")
    currency: str = Field(default="USD", description="Price currency")
    timestamp: datetime = Field(..., description="Data timestamp")
    
    model_config = {"from_attributes": True}  # Pydantic v2
```

## Query Parameter Validation

```python
# String with pattern
symbol: str = Query(..., regex=r"^[A-Z]+_[A-Z]+$", description="Trading pair (e.g., BTC_USDT)")

# Integer with range
limit: int = Query(10, ge=1, le=100, description="Max results (1-100)")

# Optional with default
timeframe: str = Query("1h", description="Timeframe: 1m, 5m, 15m, 1h, 4h, 1d")

# Enum for restricted values
from enum import Enum
class Direction(str, Enum):
    long = "long"
    short = "short"
    
direction: Direction = Query(Direction.long, description="Signal direction")
```

## Async Patterns

- Use `async def` when calling external APIs (MEXC, Redis)
- Use regular `def` for pure DB queries (SQLAlchemy sync)
- Service methods calling MEXC must be async

## Testing Notes

- Test via Swagger UI at `/docs`
- Verify all query parameters are validated
- Check error responses return proper status codes
- Ensure response matches declared `response_model`
