@echo off
chcp 65001 >nul
echo ╔════════════════════════════════════════════════════════════╗
echo ║     AlphaSelect Premier F - 配置自動檢查工具              ║
echo ╚════════════════════════════════════════════════════════════╝
echo.
echo 正在檢查您的開發環境配置...
echo.

REM 設置顏色（綠色=成功，紅色=失敗）
set "SUCCESS=[92m✓[0m"
set "FAILED=[91m✗[0m"
set "WARNING=[93m⚠[0m"

echo.
echo ═══════════════════════════════════════════════════════════
echo  1. 檢查 Docker 安裝
echo ═══════════════════════════════════════════════════════════

docker --version >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo %SUCCESS% Docker 已安裝
    docker --version
) else (
    echo %FAILED% Docker 未安裝或未啟動
    echo.
    echo    請先安裝 Docker Desktop:
    echo    https://www.docker.com/products/docker-desktop/
    echo.
)

echo.
echo ═══════════════════════════════════════════════════════════
echo  2. 檢查 Docker 服務狀態
echo ═══════════════════════════════════════════════════════════

docker info >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo %SUCCESS% Docker 服務正在運行
) else (
    echo %FAILED% Docker 服務未運行
    echo.
    echo    請啟動 Docker Desktop
    echo.
)

echo.
echo ═══════════════════════════════════════════════════════════
echo  3. 檢查配置文件
echo ═══════════════════════════════════════════════════════════

REM 檢查後端 .env
if exist "backend\.env" (
    echo %SUCCESS% 後端配置文件存在: backend\.env
    
    REM 檢查是否修改了 SECRET_KEY
    findstr /C:"your-secret-key-change-this-in-production" backend\.env >nul 2>&1
    if %ERRORLEVEL% EQU 0 (
        echo %WARNING% 警告: SECRET_KEY 尚未修改（使用預設值不安全）
    ) else (
        echo %SUCCESS% SECRET_KEY 已自定義
    )
    
    REM 檢查是否有 MEXC API 設置
    findstr /C:"your-api-key-here" backend\.env >nul 2>&1
    if %ERRORLEVEL% EQU 0 (
        echo %WARNING% 提示: MEXC_API_KEY 使用預設值（測試可以，生產環境需要真實的）
    ) else (
        echo %SUCCESS% MEXC_API_KEY 已設置
    )
) else (
    echo %FAILED% 後端配置文件不存在: backend\.env
    echo.
    echo    請執行以下步驟:
    echo    1. 複製 backend\.env.example
    echo    2. 重命名為 backend\.env
    echo    3. 編輯並修改相關設置
    echo.
)

REM 檢查前端 .env.local
if exist "frontend\.env.local" (
    echo %SUCCESS% 前端配置文件存在: frontend\.env.local
) else (
    echo %WARNING% 前端配置文件不存在: frontend\.env.local
    echo.
    echo    請執行以下步驟:
    echo    1. 複製 frontend\.env.example
    echo    2. 重命名為 frontend\.env.local
    echo.
    echo    注意: 本地開發可以使用預設值
    echo.
)

echo.
echo ═══════════════════════════════════════════════════════════
echo  4. 檢查 Docker 容器狀態
echo ═══════════════════════════════════════════════════════════

docker compose ps >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo.
    docker compose ps
    echo.
    echo %SUCCESS% Docker Compose 配置正常
) else (
    echo %WARNING% Docker Compose 容器尚未啟動
    echo.
    echo    執行以下命令啟動所有服務:
    echo    docker compose up -d
    echo.
)

echo.
echo ═══════════════════════════════════════════════════════════
echo  5. 檢查端口占用
echo ═══════════════════════════════════════════════════════════

REM 檢查 3000 端口（前端）
netstat -ano | findstr ":3000" >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo %SUCCESS% 端口 3000 (前端) 正在使用
) else (
    echo %WARNING% 端口 3000 (前端) 未使用
)

REM 檢查 8000 端口（後端）
netstat -ano | findstr ":8000" >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo %SUCCESS% 端口 8000 (後端) 正在使用
) else (
    echo %WARNING% 端口 8000 (後端) 未使用
)

REM 檢查 5432 端口（PostgreSQL）
netstat -ano | findstr ":5432" >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo %SUCCESS% 端口 5432 (PostgreSQL) 正在使用
) else (
    echo %WARNING% 端口 5432 (PostgreSQL) 未使用
)

REM 檢查 6379 端口（Redis）
netstat -ano | findstr ":6379" >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo %SUCCESS% 端口 6379 (Redis) 正在使用
) else (
    echo %WARNING% 端口 6379 (Redis) 未使用
)

echo.
echo ═══════════════════════════════════════════════════════════
echo  6. 測試服務連接
echo ═══════════════════════════════════════════════════════════

REM 測試後端健康檢查
echo.
echo 正在測試後端 API...
curl -s http://localhost:8000/api/v1/health >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo %SUCCESS% 後端 API 響應正常
    echo    URL: http://localhost:8000/api/v1/health
) else (
    echo %WARNING% 後端 API 無法訪問
    echo    請確保容器已啟動: docker compose ps
)

echo.
echo 正在測試前端網站...
curl -s http://localhost:3000 >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo %SUCCESS% 前端網站響應正常
    echo    URL: http://localhost:3000
) else (
    echo %WARNING% 前端網站無法訪問
    echo    請確保容器已啟動: docker compose ps
)

echo.
echo ═══════════════════════════════════════════════════════════
echo  檢查完成！
echo ═══════════════════════════════════════════════════════════
echo.
echo 如果所有項目都是 %SUCCESS% 標記，恭喜您配置成功！
echo.
echo 下一步:
echo   1. 訪問前端: http://localhost:3000
echo   2. 訪問API文檔: http://localhost:8000/docs
echo   3. 閱讀文檔: QUICKSTART.md
echo.
echo 如果有 %FAILED% 或 %WARNING% 標記，請根據提示進行修正。
echo.
echo ═══════════════════════════════════════════════════════════
echo.
pause
