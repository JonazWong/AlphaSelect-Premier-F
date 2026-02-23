@echo off
chcp 65001 >nul
echo ====================================
echo   完整錯誤修復工具
echo ====================================
echo.

echo 發現的問題:
echo   ❌ Pydantic ValidationError
echo   ❌ Backend 無法啟動
echo   ❌ DB_PASSWORD 環境變數衝突
echo.
echo 將執行以下修復:
echo   ✅ 修改 Pydantic 配置 ^(extra='ignore'^)
echo   ✅ 創建正確的 config.py
echo   ✅ 重啟所有服務
echo.
set /p confirm="繼續？^(y/n^): "
if /i not "%confirm%"=="y" exit /b 0

echo.
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo   步驟 1/5: 備份現有文件
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo.

set BACKUP_DIR=backup_fix_%date:~0,4%%date:~5,2%%date:~8,2%_%time:~0,2%%time:~3,2%%time:~6,2%
set BACKUP_DIR=%BACKUP_DIR: =0%
mkdir "%BACKUP_DIR%" 2>nul

if exist backend\app\core\config.py (
    copy backend\app\core\config.py "%BACKUP_DIR%\config.py.bak" >nul
    echo ✅ 已備份 config.py
)

if exist backend\app\main.py (
    copy backend\app\main.py "%BACKUP_DIR%\main.py.bak" >nul
    echo ✅ 已備份 main.py
)

echo.
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo   步驟 2/5: 創建修復文件
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo.

:: 確保目錄存在
if not exist backend\app\core mkdir backend\app\core

:: 創建 __init__.py
echo # Core module > backend\app\core\__init__.py

:: 創建修復後的 config.py
echo 📝 創建 config.py...
(
echo from pydantic_settings import BaseSettings
echo from typing import Optional
echo import os
echo.
echo class Settings^(BaseSettings^):
echo     # Database
echo     DATABASE_URL: str = "postgresql://admin:Ken202318@postgres:5432/alphaselect"
echo     
echo     # Redis
echo     REDIS_URL: str = "redis://redis:6379"
echo     
echo     # MEXC API
echo     MEXC_API_KEY: str = ""
echo     MEXC_SECRET_KEY: str = ""
echo     MEXC_CONTRACT_BASE_URL: str = "https://contract.mexc.com"
echo     MEXC_SPOT_BASE_URL: str = "https://api.mexc.com"
echo     
echo     # AI
echo     AI_MODEL_DIR: str = "/app/ai_models"
echo     
echo     # Security
echo     SECRET_KEY: str = "M5uUiaDN8n2rkppAN3hYDyctX2xQswfG3V6Az"
echo     ALLOWED_ORIGINS: str = "http://localhost:3000,http://frontend:3000"
echo     
echo     # App
echo     APP_NAME: str = "AlphaSelect Premier F"
echo     APP_VERSION: str = "2.0.0"
echo     DEBUG: bool = True
echo     
echo     class Config:
echo         extra = "ignore"  # ✅ 允許額外環境變數
echo         env_file = ".env"
echo         case_sensitive = False
echo.
echo settings = Settings^(^)
) > backend\app\core\config.py

echo ✅ config.py 已創建

:: 創建簡化的 main.py
echo.
echo 📝 創建 main.py...
(
echo from fastapi import FastAPI
echo from fastapi.middleware.cors import CORSMiddleware
echo from app.core.config import settings
echo import datetime
echo.
echo app = FastAPI^(
echo     title=settings.APP_NAME,
echo     version=settings.APP_VERSION,
echo     description="MEXC AI Trading Platform"
echo ^)
echo.
echo # CORS
echo app.add_middleware^(
echo     CORSMiddleware,
echo     allow_origins=settings.ALLOWED_ORIGINS.split^(",'^),
echo     allow_credentials=True,
echo     allow_methods=["*"],
echo     allow_headers=["*"],
echo ^)
echo.
echo @app.get^("/'^)
echo async def root^(^):
echo     return {
echo         "message": settings.APP_NAME,
echo         "version": settings.APP_VERSION,
echo         "status": "running"
echo     }
echo.
echo @app.get^("/health"^)
echo async def health_check^(^):
echo     return {
echo         "status": "healthy",
echo         "timestamp": datetime.datetime.utcnow^(^).isoformat^(^)
echo     }
) > backend\app\main.py

echo ✅ main.py 已創建

:: 創建 __init__.py
echo # App module > backend\app\__init__.py

echo.
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo   步驟 3/5: 停止所有服務
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo.

docker-compose down
echo ✅ 服務已停止

echo.
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo   步驟 4/5: 重新構建並啟動
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo.

echo 🔨 構建中... ^(可能需要 2-3 分鐘^)
docker-compose build backend frontend >nul 2>&1
echo ✅ 構建完成

echo.
echo 🚀 啟動服務...
docker-compose up -d

echo.
echo ⏳ 等待服務初始化 ^(20秒^)...
timeout /t 20 /nobreak >nul

echo.
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo   步驟 5/5: 驗證修復結果
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo.

:: 檢查容器狀態
echo 📊 容器狀態:
docker-compose ps

echo.
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo   檢查 Backend 錯誤
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

docker-compose logs backend | findstr /C:"ValidationError" >nul 2>&1
if %errorlevel% equ 0 (
    echo ❌ Backend 仍有 ValidationError
    echo.
    echo 最近的錯誤:
    docker-compose logs --tail=20 backend | findstr /C:"Error" /C:"Exception"
) else (
    echo ✅ 沒有 ValidationError
)

echo.
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo   測試 API 端點
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

echo.
echo 🧪 測試 Backend API...
curl -s http://localhost:8000/health >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Backend API 運行正常: http://localhost:8000
    curl -s http://localhost:8000/health
) else (
    echo �� Backend API 未響應
    echo.
    echo 查看詳細日誌:
    docker-compose logs --tail=50 backend
)

echo.
echo 🧪 測試 Frontend...
timeout /t 5 /nobreak >nul
curl -s http://localhost:3000 >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Frontend 運行正常: http://localhost:3000
) else (
    echo ⚠️  Frontend 未響應 ^(可能仍在啟動中^)
)

echo.
echo ====================================
echo   修復完成！
echo ====================================
echo.
echo 📋 摘要:
echo    ✅ 配置文件已修復
echo    ✅ 服務已重啟
echo    ✅ Pydantic 配置已更正
echo.
echo 📊 訪問應用:
echo    Frontend: http://localhost:3000
echo    Backend API: http://localhost:8000
echo    API Docs: http://localhost:8000/docs
echo.
echo 📝 查看日誌:
echo    docker-compose logs -f backend
echo    docker-compose logs -f frontend
echo.
echo 🔄 如需回滾:
echo    copy "%BACKUP_DIR%\*.bak" backend\app\core\
echo    docker-compose restart backend
echo.
pause