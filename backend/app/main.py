from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api.v1.endpoints import contract_market, ai_training, ai_predict
from app.websocket.manager import sio
from app.db.init_db import init_db
import socketio
import datetime
import logging

# 配置日誌
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# 創建FastAPI應用
fastapi_app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="MEXC AI Trading Platform"
)

# CORS
fastapi_app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS.split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 啟動事件
@fastapi_app.on_event("startup")
async def startup_event():
    """應用啟動時執行"""
    logger.info("=" * 60)
    logger.info(f"🚀 Starting {settings.APP_NAME} v{settings.APP_VERSION}")
    logger.info("=" * 60)
    
    # 初始化數據庫
    try:
        init_db()
    except Exception as e:
        logger.error(f"❌ Database initialization failed: {e}")
        # 不阻止應用啟動，允許應用運行（可能只是表已存在）
    
    logger.info("✅ Application startup complete")
    logger.info(f"   - API Documentation: /docs")
    logger.info(f"   - Alternative Docs: /redoc")
    logger.info(f"   - Health Check: /health")
    logger.info("=" * 60)

@fastapi_app.on_event("shutdown")
async def shutdown_event():
    """應用關閉時執行"""
    logger.info("👋 Shutting down application...")

# API路由注冊
fastapi_app.include_router(contract_market.router, prefix="/api/v1/contract", tags=["Contract Market"])
fastapi_app.include_router(ai_training.router, prefix="/api/v1/ai/training", tags=["AI Training"])
fastapi_app.include_router(ai_predict.router, prefix="/api/v1/ai/predict", tags=["AI Prediction"])

@fastapi_app.get("/")
async def root():
    return {
        "message": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "status": "running"
    }

@fastapi_app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "timestamp": datetime.datetime.utcnow().isoformat()
    }

# WebSocket集成 - 將FastAPI應用包裝在Socket.IO中
# 配置自定義 Socket.IO 路徑以與前端 /ws/socket.io 對齊，避免 403 拒絕
app = socketio.ASGIApp(
    sio,
    other_asgi_app=fastapi_app,
    socketio_path="ws/socket.io"
)
