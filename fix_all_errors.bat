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

echo 📝 創建 config.py...
docker-compose exec backend bash -c "cat > /app/app/core/config.py << 'PYEOF'
from pydantic_settings import BaseSettings
from typing import Optional
import os

class Settings(BaseSettings):
    DATABASE_URL: str = 'postgresql://admin:Ken202318@postgres:5432/alphaselect'
    REDIS_URL: str = 'redis://redis:6379'
    MEXC_API_KEY: str = ''
    MEXC_SECRET_KEY: str = ''
    MEXC_CONTRACT_BASE_URL: str = 'https://contract.mexc.com'
    MEXC_SPOT_BASE_URL: str = 'https://api.mexc.com'
    AI_MODEL_DIR: str = '/app/ai_models'
    SECRET_KEY: str = 'M5uUiaDN8n2rkppAN3hYDyctX2xQswfG3V6Az'
    ALLOWED_ORIGINS: str = 'http://localhost:3000,http://frontend:3000'
    APP_NAME: str = 'AlphaSelect Premier F'
    APP_VERSION: str = '2.0.0'
    DEBUG: bool = True

    class Config:
        extra = 'ignore'
        env_file = '.env'
        case_sensitive = False

settings = Settings()
PYEOF"

echo ✅ config.py 已創建

echo.
pause
