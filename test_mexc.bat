@echo off
chcp 65001 >nul
echo ====================================
echo   測試 MEXC API 集成
echo ====================================
echo.

echo 💡 選擇測試方式:
echo    1. 在 Docker 容器中測試（推薦）
echo    2. 在本地 Python 環境測試
echo.
choice /C 12 /M "請選擇"

if errorlevel 2 goto local_test
if errorlevel 1 goto docker_test

:docker_test
echo.
echo 📦 使用 Docker 容器測試...
call test_mexc_docker.bat
goto end

:local_test
echo.
echo 💻 使用本地 Python 環境測試...
echo.

:: 檢查虛擬環境
if not exist "venv\Scripts\python.exe" (
    echo ⚠️  未找到 Python 虛擬環境
    echo.
    echo 是否要設置虛擬環境？
    choice /C YN /M "輸入 Y 設置，N 使用系統 Python"
    if errorlevel 2 goto use_system_python
    
    echo.
    call setup_python_env.bat
    if %errorlevel% neq 0 (
        echo ❌ 環境設置失敗
        pause
        exit /b 1
    )
)

:: 使用虛擬環境
echo.
echo 📋 激活虛擬環境並執行測試...
call venv\Scripts\activate.bat
python test_mexc_api.py
call deactivate
goto end

:use_system_python
echo.
echo 📋 使用系統 Python 執行測試...
echo.
python test_mexc_api.py
if %errorlevel% neq 0 (
    echo.
    echo ❌ 測試失敗，可能是依賴問題
    echo.
    echo 💡 建議:
    echo    1. 運行 fix_pydantic.bat 修復依賴
    echo    2. 運行 setup_python_env.bat 設置虛擬環境
    echo    3. 使用 Docker 容器測試: test_mexc_docker.bat
)

:end
echo.
echo ====================================
echo   測試完成
echo ====================================
echo.
pause
