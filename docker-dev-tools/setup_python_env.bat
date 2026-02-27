@echo off
chcp 65001 >nul
echo ====================================
echo   設置 Python 開發環境
echo ====================================
echo.

echo 此腳本將設置完整的 Python 開發環境
echo （用於本地測試，不影響 Docker 容器）
echo.
pause

:: 檢查 Python
echo.
echo [1/5] 檢查 Python...
python --version 2>nul
if %errorlevel% neq 0 (
    echo ❌ 未找到 Python
    echo 請安裝 Python 3.11 或更高版本
    echo 下載地址: https://www.python.org/downloads/
    pause
    exit /b 1
)

:: 檢查版本
for /f "tokens=2" %%i in ('python --version 2^>^&1') do set PYTHON_VERSION=%%i
echo ✅ Python %PYTHON_VERSION%

:: 創建虛擬環境
echo.
echo [2/5] 創建虛擬環境...
if exist "venv" (
    echo ⚠️  虛擬環境已存在，是否刪除並重新創建？
    choice /C YN /M "輸入 Y 重建，N 跳過"
    if errorlevel 2 (
        echo 跳過虛擬環境創建
        goto activate_venv
    )
    rd /s /q venv
)

python -m venv venv
if %errorlevel% neq 0 (
    echo ❌ 創建虛擬環境失敗
    pause
    exit /b 1
)
echo ✅ 虛擬環境創建成功

:activate_venv
:: 激活虛擬環境
echo.
echo [3/5] 激活虛擬環境...
call venv\Scripts\activate.bat
if %errorlevel% neq 0 (
    echo ❌ 激活虛擬環境失敗
    pause
    exit /b 1
)
echo ✅ 虛擬環境已激活

:: 升級 pip
echo.
echo [4/5] 升級 pip...
python -m pip install --upgrade pip
echo ✅ pip 已升級

:: 安裝依賴
echo.
echo [5/5] 安裝 Python 依賴...
pip install -r backend\requirements.txt
if %errorlevel% neq 0 (
    echo ❌ 依賴安裝失敗
    pause
    exit /b 1
)
echo ✅ 依賴安裝成功

:: 驗證安裝
echo.
echo ====================================
echo   驗證安裝
echo ====================================
echo.

echo 測試關鍵模組導入...
python -c "from pydantic_settings import BaseSettings; print('✅ pydantic-settings')"
python -c "from fastapi import FastAPI; print('✅ fastapi')"
python -c "from sqlalchemy import create_engine; print('✅ sqlalchemy')"
python -c "import redis; print('✅ redis')"
python -c "import httpx; print('✅ httpx')"

echo.
echo ====================================
echo   設置完成
echo ====================================
echo.
echo ✅ Python 開發環境已設置完成！
echo.
echo 💡 使用說明:
echo    1. 激活虛擬環境: venv\Scripts\activate.bat
echo    2. 運行測試: python test_mexc_api.py
echo    3. 退出虛擬環境: deactivate
echo.
echo 📝 注意:
echo    - 此環境用於本地測試
echo    - Docker 容器有獨立的 Python 環境
echo    - 每次打開新終端需要重新激活虛擬環境
echo.
pause
