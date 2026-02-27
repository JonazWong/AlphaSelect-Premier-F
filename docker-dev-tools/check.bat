@echo off
chcp 65001 >nul
echo ====================================
echo   AlphaSelect Premier F - 語法檢查
echo ====================================
echo.

:: 1. 檢查 docker-compose.yml
echo [1/5] 檢查 docker-compose.yml...
docker compose config >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ docker-compose.yml 語法正確
) else (
    echo ❌ docker-compose.yml 語法錯誤
    echo.
    echo 詳細錯誤:
    docker compose config
    echo.
    pause
    exit /b 1
)

:: 2. 檢查 Backend Dockerfile
echo.
echo [2/5] 檢查 Backend Dockerfile...
if exist backend\Dockerfile (
    docker build -t test-backend -f backend\Dockerfile backend --dry-run >nul 2>&1
    if %errorlevel% equ 0 (
        echo ✅ Backend Dockerfile 語法正確
    ) else (
        echo ⚠️  Backend Dockerfile 可能有問題
    )
) else (
    echo ❌ backend/Dockerfile 不存在
)

:: 3. 檢查 Frontend Dockerfile
echo.
echo [3/5] 檢查 Frontend Dockerfile...
if exist frontend\Dockerfile (
    echo ✅ Frontend Dockerfile 存在
) else (
    echo ❌ frontend/Dockerfile 不存在
)

:: 4. 檢查 Python 依賴
echo.
echo [4/5] 檢查 Backend Python 依賴...
if exist backend\requirements.txt (
    cd backend
    pip install --dry-run -r requirements.txt >nul 2>&1
    if %errorlevel% equ 0 (
        echo ✅ requirements.txt 依賴正確
    ) else (
        echo ⚠️  requirements.txt 可能有問題
    )
    cd ..
) else (
    echo ❌ backend/requirements.txt 不存在
)

:: 5. 檢查 Frontend package.json
echo.
echo [5/5] 檢查 Frontend package.json...
if exist frontend\package.json (
    cd frontend
    npm install --dry-run >nul 2>&1
    if %errorlevel% equ 0 (
        echo ✅ package.json 依賴正確
    ) else (
        echo ⚠️  package.json 可能有問題
    )
    cd ..
) else (
    echo ❌ frontend/package.json 不存在
)

:: 6. 檢查環境變數文��
echo.
echo [6/6] 檢查環境變數文件...
if exist backend\.env (
    echo ✅ backend/.env 存在
) else (
    echo ⚠️  backend/.env 不存在，請運行 setup.bat
)

if exist frontend\.env.local (
    echo ✅ frontend/.env.local 存在
) else (
    echo ⚠️  frontend/.env.local 不存在，請運行 setup.bat
)

echo.
echo ====================================
echo   檢查完成！
echo ====================================
echo.
pause