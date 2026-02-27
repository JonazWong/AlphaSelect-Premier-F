@echo off
chcp 65001 >nul
cls
echo.
echo ============================================================
echo            AlphaSelect Premier F - 快速入門
echo ============================================================
echo.
echo 💡 遇到 "No module named 'pydantic._internal'" 錯誤？
echo.
echo    這是正常的！請繼續閱讀...
echo.
pause
cls
echo.
echo ============================================================
echo                     重要說明
echo ============================================================
echo.
echo 📦 這個項目使用 Docker 容器運行
echo    - Backend (Python/FastAPI)
echo    - Frontend (Next.js)
echo    - PostgreSQL 數據庫
echo    - Redis 緩存
echo.
echo 🎯 實際運行環境在 Docker 容器內
echo    - 容器有獨立的 Python 環境
echo    - 本地 Python 環境僅用於開發和測試
echo.
echo ⚠️  "pydantic" 錯誤是本地 Python 環境的問題
echo    - 不影響 Docker 容器運行
echo    - 容器內的環境是完整的
echo.
pause
cls
echo.
echo ============================================================
echo                  您有兩個選擇
echo ============================================================
echo.
echo [選項 1] 只使用 Docker（推薦，無需本地 Python）
echo ─────────────────────────────────────────────────────
echo    優點：
echo    ✅ 最簡單，無需配置本地 Python
echo    ✅ 環境一致，沒有依賴衝突
echo    ✅ 所有功能都在容器內運行
echo.
echo    操作步驟：
echo    1. 一鍵啟動腳本 start.bat      （啟動所有服務）
echo    2. test_mexc_docker.bat        （在容器中測試）
echo    3. 訪問 http://localhost:8000/docs
echo.
echo [選項 2] 設置本地 Python 環境（用於開發）
echo ─────────────────────────────────────────────────────
echo    優點：
echo    ✅ 可以在本地快速測試代碼
echo    ✅ IDE 支持更好（智能提示）
echo    ✅ 方便調試
echo.
echo    操作步驟：
echo    1. setup_python_env.bat        （一次性設置）
echo    2. venv\Scripts\activate.bat   （激活環境）
echo    3. python test_mexc_api.py     （本地測試）
echo.
pause
cls
echo.
echo ============================================================
echo                   推薦工作流程
echo ============================================================
echo.
echo 🚀 快速上手（5 分鐘）
echo ─────────────────────────────────────────────────────
echo.
echo    第1步：啟動服務
echo    $ 一鍵啟動腳本 start.bat
echo.
echo    第2步：等待啟動完成（約 30-40 秒）
echo    - 數據庫初始化
echo    - Backend 啟動
echo    - Frontend 構建
echo.
echo    第3步：驗證服務
echo    ✅ http://localhost:8000/health  （Backend 健康檢查）
echo    ✅ http://localhost:8000/docs    （API 文檔）
echo    ✅ http://localhost:3000         （前端應用）
echo.
echo    第4步：測試 MEXC API（可選）
echo    $ test_mexc_docker.bat
echo.
pause
cls
echo.
echo ============================================================
echo                     常見問題
echo ============================================================
echo.
echo Q1: test_mexc.bat 出現 pydantic 錯誤怎麼辦？
echo A1: 有三種解決方案：
echo     方案1（推薦）：使用 test_mexc_docker.bat 在容器中測試
echo     方案2：運行 fix_pydantic.bat 修復本地依賴
echo     方案3：運行 setup_python_env.bat 設置虛擬環境
echo.
echo Q2: 我必須修復本地 Python 環境嗎？
echo A2: 不必須！
echo     - 如果只是使用應用，Docker 容器就足夠了
echo     - 如果需要開發調試，建議設置本地環境
echo.
echo Q3: Docker 容器測試和本地測試有什麼區別？
echo A3: 
echo     - Docker 測試：測試實際運行環境（更準確）
echo     - 本地測試：快速測試代碼改動（開發用）
echo.
echo Q4: 服務啟動後無法訪問怎麼辦？
echo A4: 運行診斷工具：
echo     $ diagnose_backend.bat
echo     查看詳細錯誤信息和解決建議
echo.
pause
cls
echo.
echo ============================================================
echo                     工具箱
echo ============================================================
echo.
echo 🎬 啟動和停止
echo    一鍵啟動腳本 start.bat     - 啟動所有服務
echo    一鍵停止腳本 stop.bat       - 停止所有服務
echo    restart_backend.bat        - 重啟後端
echo    rebuild_backend.bat        - 重建後端鏡像
echo.
echo 🔧 MEXC API
echo    config_mexc.bat            - 配置 MEXC API 密鑰
echo    test_mexc_docker.bat       - 在容器中測試（推薦）
echo    test_mexc.bat              - 選擇測試方式
echo    check_mexc_status.bat      - 檢查部署狀態
echo.
echo 🐛 診斷和修復
echo    diagnose_backend.bat       - 診斷後端問題
echo    view_backend_logs.bat      - 查看後端日誌
echo    fix_pydantic.bat           - 修復 pydantic 依賴
echo    setup_python_env.bat       - 設置 Python 環境
echo.
echo 📚 文檔
echo    MEXC_API_DEPLOYMENT.md     - MEXC API 部署文檔
echo    PYDANTIC_FIX.md            - Pydantic 問題解決
echo    BACKEND_TROUBLESHOOTING.md - 後端故障排除
echo    README.md                  - 項目說明
echo.
pause
cls
echo.
echo ============================================================
echo                  現在該做什麼？
echo ============================================================
echo.
echo 請選擇您的使用場景：
echo.
echo [1] 我只想快速啟動和使用應用
echo     → 運行：一鍵啟動腳本 start.bat
echo     → 訪問：http://localhost:3000
echo.
echo [2] 我要測試 MEXC API 是否正常
echo     → 運行：test_mexc_docker.bat
echo.
echo [3] 我要配置 MEXC API 密鑰
echo     → 運行：config_mexc.bat
echo.
echo [4] 我要開發調試代碼
echo     → 運行：setup_python_env.bat
echo.
echo [5] 遇到問題需要診斷
echo     → 運行：diagnose_backend.bat
echo.
echo [6] 查看完整文檔
echo     → 閱讀：MEXC_API_DEPLOYMENT.md
echo.
echo.
choice /C 123456 /M "請選擇（1-6）"

if errorlevel 6 (
    start MEXC_API_DEPLOYMENT.md
    goto end
)
if errorlevel 5 (
    call diagnose_backend.bat
    goto end
)
if errorlevel 4 (
    call setup_python_env.bat
    goto end
)
if errorlevel 3 (
    call config_mexc.bat
    goto end
)
if errorlevel 2 (
    call test_mexc_docker.bat
    goto end
)
if errorlevel 1 (
    call "一鍵啟動腳本 start.bat"
    goto end
)

:end
echo.
echo ============================================================
echo   需要更多幫助？
echo ============================================================
echo.
echo 📖 完整文檔：
echo    • README.md - 項目概述
echo    • MEXC_API_DEPLOYMENT.md - MEXC API 集成
echo    • PYDANTIC_FIX.md - 依賴問題解決
echo.
echo 🆘 再次運行此向導：
echo    quick_start.bat
echo.
pause
