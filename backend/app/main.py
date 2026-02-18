from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.db.init_db import init_db
import logging

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

logger = logging.getLogger(__name__)

# Create FastAPI app
app = FastAPI(
    title="AlphaSelect Premier F - MEXC AI Trading Platform",
    description="AI-driven cryptocurrency analysis monitoring platform for MEXC contract trading",
    version="1.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def startup_event():
    """Initialize database on startup"""
    logger.info("Initializing database...")
    try:
        init_db()
        logger.info("Database initialized successfully")
    except Exception as e:
        logger.error(f"Failed to initialize database: {e}")


@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "AlphaSelect Premier F - MEXC AI Trading Platform",
        "version": "1.0.0",
        "status": "running"
    }


@app.get("/api/v1/health")
async def health_check():
    """Health check endpoint"""
    from datetime import datetime
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat() + "Z"
    }


# Import and include routers
from app.api.v1.endpoints import contract_market, ai_training, ai_predict

app.include_router(
    contract_market.router,
    prefix="/api/v1/contract",
    tags=["Contract Market"]
)

app.include_router(
    ai_training.router,
    prefix="/api/v1/ai/training",
    tags=["AI Training"]
)

app.include_router(
    ai_predict.router,
    prefix="/api/v1/ai/predict",
    tags=["AI Prediction"]
)
