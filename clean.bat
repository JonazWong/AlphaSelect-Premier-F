@echo off
chcp 65001 >nul
echo ====================================
echo   AlphaSelect Premier F - 完全清理
echo ====================================
echo.
echo ⚠️  警告：這將刪除以下內容：
echo.
echo    🗑️  Docker 容器、鏡像、卷
echo    🗑️  環境配置文件 (.env)
echo    🗑️  AI 模型數據
echo    🗑️  node_modules
echo    🗑️  Python 緩存
echo    🗑️  Docker 構建緩存
echo.
echo ❗ 這個操作不可逆轉！
echo.
set /p confirm="確定要完全清理嗎？(輸入 YES 確認): "

if /i "%confirm%"=="YES" (
    echo.
    echo 🧹 開始清理...
    
    :: 1. 停止並刪除 Docker 資源
    echo.
    echo [1/8] 停止 Docker 容器...
    docker-compose down
    
    echo.
    echo [2/8] 刪除 Docker 卷（���據庫數據將丟失）...
    docker-compose down -v
    
    echo.
    echo [3/8] 刪除 Docker 鏡像...
    docker-compose down --rmi all
    
    :: 2. 刪除環境配置
    echo.
    echo [4/8] 刪除環境配置文件...
    if exist .env (
        echo    刪除根目錄 .env
        del /f /q .env
    )
    if exist backend\.env (
        echo    刪除 backend/.env
        del /f /q backend\.env
    )
    if exist frontend\.env.local (
        echo    刪除 frontend/.env.local
        del /f /q frontend\.env.local
    )
    
    :: 3. 刪除 AI 模型
    echo.
    echo [5/8] 刪除 AI 模型目錄...
    if exist ai_models (
        rmdir /s /q ai_models
        echo    ✅ ai_models/ 已刪除
    )
    
    :: 4. 刪除 node_modules
    echo.
    echo [6/8] 刪除 node_modules...
    if exist frontend\node_modules (
        rmdir /s /q frontend\node_modules
        echo    ✅ frontend/node_modules 已刪除
    )
    
    :: 5. 刪除 Python 緩存
    echo.
    echo [7/8] 刪除 Python 緩存...
    if exist backend\__pycache__ rmdir /s /q backend\__pycache__
    for /d /r backend %%d in (__pycache__) do @if exist "%%d" rmdir /s /q "%%d"
    if exist backend\*.pyc del /s /q backend\*.pyc >nul 2>&1
    echo    ✅ Python 緩存已清除
    
    :: 6. 清理 Docker 系統
    echo.
    echo [8/8] 清理 Docker 系統資源...
    docker system prune -af --volumes
    
    echo.
    echo ====================================
    echo   ✅ 清理完成！
    echo ====================================
    echo.
    echo 專案已恢復到初始狀態
    echo.
    echo 📝 重新開始:
    echo    1. 運行: setup.bat
    echo    2. 運行: start.bat
    echo.
) else (
    echo.
    echo ❌ 清理已取消
    echo.
)

pause