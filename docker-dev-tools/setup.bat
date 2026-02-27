@echo off
setlocal enabledelayedexpansion
chcp 65001 >nul
echo ====================================
echo   AlphaSelect Premier F - 一鍵配置
echo ====================================
echo.

:: 詢問是否清理舊資料
echo ⚠️  檢測到以下可能存在的舊資料:
echo.
if exist backend\.env echo    - backend/.env
if exist frontend\.env.local echo    - frontend/.env.local
if exist ai_models echo    - ai_models/ 目錄
docker volume ls | findstr "alphaselect-premier-f" >nul 2>&1
if %errorlevel% equ 0 echo    - Docker 數據卷 (postgres_data, redis_data)
echo.
set /p clean="是否清除所有舊資料並重新開始？(y/n，預設 n): "

if /i "%clean%"=="y" (
    echo.
    echo 🧹 清理舊資料中...
    
    :: 停止並刪除容器和卷
    echo [清理 1/6] 停止 Docker 容器...
    docker compose down -v >nul 2>&1
    
    :: 刪除環境配置文件
    echo [清理 2/6] 刪除環境配置文件...
    if exist backend\.env del /f /q backend\.env
    if exist frontend\.env.local del /f /q frontend\.env.local
    if exist .env del /f /q .env
    
    :: 刪除 AI 模型目錄
    echo [清理 3/6] 刪除 AI 模型...
    if exist ai_models rmdir /s /q ai_models
    
    :: 刪除 node_modules（可選）
    echo [清理 4/6] 清理 node_modules...
    if exist frontend\node_modules rmdir /s /q frontend\node_modules
    
    :: 刪除 Python 緩存
    echo [清理 5/6] 清理 Python 緩存...
    if exist backend\__pycache__ rmdir /s /q backend\__pycache__
    for /d /r backend %%d in (__pycache__) do @if exist "%%d" rmdir /s /q "%%d"
    
    :: 清理 Docker 緩存（可選）
    echo [清理 6/6] 清理 Docker 構建緩存...
    docker builder prune -f >nul 2>&1
    
    echo.
    echo ✅ 舊資料已清除
    echo.
) else (
    echo.
    echo ℹ️  保留舊資料，僅檢查和補充缺失文件
    echo.
)

:: 檢查 Docker Desktop 是否運行
echo [1/7] 檢查 Docker Desktop...
docker info >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Docker Desktop 未運行，請先啟動 Docker Desktop
    pause
    exit /b 1
)
echo ✅ Docker Desktop 運行中

:: 檢查 Python
echo.
echo [2/7] 檢查 Python 環境...
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ 未安裝 Python，請先安裝 Python 3.10+
    pause
    exit /b 1
)
for /f "tokens=2" %%i in ('python --version 2^>^&1') do set PYTHON_VER=%%i
echo ✅ Python %PYTHON_VER% 已安裝

:: 檢查 Node.js
echo.
echo [3/7] 檢查 Node.js 環境...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ 未安裝 Node.js，請先安裝 Node.js 18+
    pause
    exit /b 1
)
for /f %%i in ('node --version') do set NODE_VER=%%i
echo ✅ Node.js %NODE_VER% 已安裝

:: 檢查 Git（可選）
echo.
echo [4/7] 檢查 Git...
git --version >nul 2>&1
if %errorlevel% equ 0 (
    for /f "tokens=3" %%i in ('git --version') do set GIT_VER=%%i
    echo ✅ Git %GIT_VER% 已安裝
) else (
    echo ⚠️  Git 未安裝（可選，但建議安裝）
)

:: 生成 SECRET_KEY
echo.
echo [5/7] 生成 SECRET_KEY...

if not exist generate_secret_key.py (
    echo ❌ generate_secret_key.py 不存在
    echo 正在創建...
    (
        echo import secrets
        echo import string
        echo.
        echo def generate_secret_key^(length=50^):
        echo     alphabet = string.ascii_letters + string.digits + string.punctuation
        echo     secret_key = ''.join^(secrets.choice^(alphabet^) for _ in range^(length^)^)
        echo     return secret_key
        echo.
        echo if __name__ == "__main__":
        echo     key = generate_secret_key^(^)
        echo     print^(key^)
    ) > generate_secret_key.py
)

for /f %%i in ('python generate_secret_key.py') do set SECRET_KEY=%%i
echo ✅ SECRET_KEY 已生成: %SECRET_KEY:~0,20%...

:: 創建根目錄 .env 文件
echo.
echo [6/7] 創建環境變數文件...

if not exist .env (
    (
        echo # AlphaSelect Premier F - 環境變數配置
        echo # 生成時間: %date% %time%
        echo.
        echo # 數據庫密碼
        echo DB_PASSWORD=your_db_password_here
        echo.
        echo # SECRET_KEY ^(自動生成^)
        echo SECRET_KEY=%SECRET_KEY%
        echo.
        echo # MEXC API ^(請替換為您的真實 API Key^)
        echo MEXC_API_KEY=your_mexc_api_key_here
        echo MEXC_SECRET_KEY=your_mexc_secret_key_here
    ) > .env
    echo ✅ 創建根目錄 .env
) else (
    echo ⚠️  根目錄 .env 已存在
    set /p update_env="是否更新 SECRET_KEY？(y/n): "
    if /i "!update_env!"=="y" (
        :: 備份舊 .env
        copy .env .env.backup >nul
        echo ℹ️  已備份為 .env.backup
        
        :: 更新 SECRET_KEY
        powershell -Command "(Get-Content .env) -replace '^SECRET_KEY=.*', 'SECRET_KEY=%SECRET_KEY%' | Set-Content .env"
        echo ✅ SECRET_KEY 已更新
    )
)

:: 創建 backend/.env
if not exist backend\.env (
    if exist backend\.env.example (
        copy backend\.env.example backend\.env >nul
    ) else (
        :: 創建默認配置
        (
            echo # Backend 環境變數
            echo DATABASE_URL=postgresql://alphaselect_user:dev_password_123@postgres:5432/alphaselect
            echo REDIS_URL=redis://redis:6379
            echo MEXC_API_KEY=
            echo MEXC_SECRET_KEY=
            echo MEXC_CONTRACT_BASE_URL=https://contract.mexc.com
            echo MEXC_SPOT_BASE_URL=https://api.mexc.com
            echo AI_MODEL_DIR=./ai_models
            echo SECRET_KEY=%SECRET_KEY%
            echo ALLOWED_ORIGINS=http://localhost:3000
        ) > backend\.env
    )
    echo ✅ 創建 backend/.env
) else (
    echo ⚠️  backend/.env 已存在，跳過
)

:: 創建 frontend/.env.local
if not exist frontend\.env.local (
    if exist frontend\.env.example (
        copy frontend\.env.example frontend\.env.local >nul
    ) else (
        :: 創建默認配置
        (
            echo # Frontend 環境變數
            echo NEXT_PUBLIC_API_URL=http://localhost:8000
            echo NEXT_PUBLIC_WS_URL=ws://localhost:8000
        ) > frontend\.env.local
    )
    echo ✅ 創建 frontend/.env.local
) else (
    echo ⚠️  frontend/.env.local 已存在，跳過
)

:: 創建 ai_models 目錄
if not exist ai_models (
    mkdir ai_models
    mkdir ai_models\lstm
    mkdir ai_models\xgboost
    mkdir ai_models\random_forest
    mkdir ai_models\arima
    mkdir ai_models\linear_regression
    mkdir ai_models\ensemble
    echo ✅ 創建 ai_models 目錄結構
)

:: 檢查 docker-compose.yml 語法
echo.
echo [7/7] 檢查 docker-compose.yml 語法...
docker compose config >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ docker-compose.yml 語法錯誤
    echo.
    echo 詳細錯誤:
    docker compose config
    echo.
    pause
    exit /b 1
)
echo ✅ docker-compose.yml 語法正確

:: 顯示配置摘要
echo.
echo ====================================
echo   ✅ 配置完成！
echo ====================================
echo.
echo 📋 配置摘要:
echo    ✅ SECRET_KEY: %SECRET_KEY:~0,30%...
echo    ✅ 環境文件: .env, backend/.env, frontend/.env.local
echo    ✅ AI 模型目錄已創建
echo    ✅ Docker Compose 配置正確
echo.
echo 📝 下一步：
echo    1. 編輯根目錄 .env 文件，填入真實的 MEXC_API_KEY 和 MEXC_SECRET_KEY
echo    2. 運行: start.bat 啟動服務
echo    3. 訪問: http://localhost:3000
echo.
echo 💡 提示:
echo    - 查看日誌: logs.bat
echo    - 檢查語法: check.bat
echo    - ���啟服務: restart.bat
echo    - 停止服務: stop.bat
echo    - 完全清理: clean.bat
echo.
pause