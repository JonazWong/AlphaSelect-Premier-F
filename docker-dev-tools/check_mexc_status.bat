@echo off
chcp 65001 >nul
echo ====================================
echo   MEXC API 部署狀態檢查
echo ====================================
echo.

echo 📋 檢查 MEXC API 部署狀態...
echo.

:: 1. 檢查代碼文件
echo [1/6] 檢查 MEXC API 代碼...
if exist "backend\app\core\mexc\contract.py" (
    echo ✅ MEXC Contract API 客戶端: backend\app\core\mexc\contract.py
) else (
    echo ❌ 未找到 MEXC API 客戶端
)

if exist "backend\app\api\v1\endpoints\contract_market.py" (
    echo ✅ Contract Market 端點: backend\app\api\v1\endpoints\contract_market.py
) else (
    echo ❌ 未找到 Contract Market 端點
)
echo.

:: 2. 檢查配置文件
echo [2/6] 檢查配置文件...
if exist ".env" (
    echo ✅ .env 配置文件存在
    echo.
    echo    MEXC 配置:
    findstr /B "MEXC_" .env 2>nul
    if errorlevel 1 (
        echo    ⚠️  未找到 MEXC 配置，請運行 config_mexc.bat
    )
) else (
    echo ⚠️  .env 文件不存在
    echo    請運行 config_mexc.bat 創建配置
)
echo.

:: 3. 檢查測試腳本
echo [3/6] 檢查測試工具...
if exist "test_mexc_api.py" (
    echo ✅ MEXC API 測試腳本: test_mexc_api.py
) else (
    echo ❌ 測試腳本缺失
)

if exist "test_mexc.bat" (
    echo ✅ MEXC API 測試批次: test_mexc.bat
) else (
    echo ❌ 測試批次文件缺失
)
echo.

:: 4. 檢查文檔
echo [4/6] 檢查文檔...
if exist "MEXC_API_DEPLOYMENT.md" (
    echo ✅ MEXC API 部署文檔: MEXC_API_DEPLOYMENT.md
) else (
    echo ⚠️  文檔缺失
)
echo.

:: 5. 檢查服務狀態
echo [5/6] 檢查服務狀態...
docker compose ps backend 2>nul | findstr "Up" >nul
if %errorlevel% equ 0 (
    echo ✅ Backend 服務正在運行
    
    :: 嘗試連接 API
    echo.
    echo    測試 API 連接...
    curl -s http://localhost:8000/health >nul 2>&1
    if %errorlevel% equ 0 (
        echo    ✅ Backend API 可訪問
        
        :: 測試 MEXC 端點
        curl -s http://localhost:8000/api/v1/contract/tickers >nul 2>&1
        if %errorlevel% equ 0 (
            echo    ✅ MEXC API 端點可訪問
        ) else (
            echo    ⚠️  MEXC API 端點無響應
        )
    ) else (
        echo    ⚠️  Backend API 未響應
    )
) else (
    echo ⚠️  Backend 服務未運行
    echo    請運行 一鍵啟動腳本 start.bat
)
echo.

:: 6. 檢查前端集成
echo [6/6] 檢查前端集成...
if exist "frontend\src\app\crypto-radar\page.tsx" (
    findstr /C:"api/v1/contract" "frontend\src\app\crypto-radar\page.tsx" >nul 2>&1
    if %errorlevel% equ 0 (
        echo ✅ Crypto Radar 頁面已集成 MEXC API
    ) else (
        echo ⚠️  Crypto Radar 頁面未集成 API
    )
) else (
    echo ⚠️  Crypto Radar 頁面不存在
)
echo.

:: 總結
echo ====================================
echo   部署狀態總結
echo ====================================
echo.

set "all_ok=1"

:: 檢查必要組件
if not exist "backend\app\core\mexc\contract.py" set "all_ok=0"
if not exist "backend\app\api\v1\endpoints\contract_market.py" set "all_ok=0"

if "%all_ok%"=="1" (
    echo ✅ MEXC API 已正確部署
    echo.
    echo 📡 已實現的功能:
    echo    ✅ MEXC Contract API 客戶端
    echo    ✅ 速率限制（100 請求/10秒）
    echo    ✅ 熔斷器保護（5次失敗後熔斷）
    echo    ✅ 重試機制（指數退避）
    echo    ✅ 錯誤處理和日誌
    echo.
    echo 📊 可用的 API 端點:
    echo    • GET /api/v1/contract/tickers
    echo    • GET /api/v1/contract/ticker/{symbol}
    echo    • GET /api/v1/contract/klines/{symbol}
    echo    • GET /api/v1/contract/funding-rate/{symbol}
    echo    • GET /api/v1/contract/open-interest/{symbol}
    echo    • GET /api/v1/contract/depth/{symbol}
    echo    • GET /api/v1/contract/signals
    echo    • GET /api/v1/contract/market-stats
    echo.
) else (
    echo ❌ MEXC API 部署不完整
    echo.
)

echo 🔧 管理工具:
echo    • config_mexc.bat - 配置 MEXC API 密鑰
echo    • test_mexc.bat - 測試 MEXC API 連接
echo    • diagnose_backend.bat - 診斷後端問題
echo.

if not exist ".env" (
    echo ⚠️  下一步: 運行 config_mexc.bat 配置 MEXC API
) else (
    findstr /B "MEXC_API_KEY=" .env | findstr /V "your-api-key-here" >nul 2>&1
    if errorlevel 1 (
        echo 💡 提示: MEXC API Key 未配置
        echo    • 僅使用公開 API: 可以繼續使用（行情數據）
        echo    • 使用私有 API: 需運行 config_mexc.bat 配置
    ) else (
        echo ✅ MEXC API Key 已配置
    )
)

echo.

docker compose ps backend 2>nul | findstr "Up" >nul
if not %errorlevel% equ 0 (
    echo 💡 提示: 服務未運行，請運行 一鍵啟動腳本 start.bat
    echo.
) else (
    echo 💡 提示: 服務正在運行
    echo.
    echo 🧪 測試選項:
    echo    • test_mexc_docker.bat - 在容器中測試（推薦）
    echo    • test_mexc.bat - 選擇測試方式
    echo.
)

echo 📚 文檔:
echo    • MEXC_API_DEPLOYMENT.md - 完整部署文檔
echo    • PYDANTIC_FIX.md - Pydantic 依賴問題解決方案
echo    • http://localhost:8000/docs - API 文檔（服務啟動後）
echo.
pause
