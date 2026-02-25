@echo off
chcp 65001 >nul
echo ====================================
echo   AlphaSelect Premier F - 安全重置
echo ====================================
echo.
echo 這將重置數據但保留代碼:
echo.
echo    🔄 重置 Docker 容器和卷
echo    🔄 重置環境配置文件
echo    🔄 清空 AI 模型數據
echo    ✅ 保留所有源代碼
echo    ✅ 保留 node_modules
echo.
set /p confirm="確定要重置嗎？(y/n): "

if /i "%confirm%"=="y" (
    echo.
    echo 🔄 開始重置...
    
    :: 停止容器
    echo [1/4] 停止 Docker 容器...
    docker-compose down -v
    
    :: 清空 AI 模型（但保留目錄結構）
    echo.
    echo [2/4] 清空 AI 模型...
    if exist ai_models (
        for /d %%d in (ai_models\*) do (
            if exist "%%d" (
                del /q "%%d\*.*" >nul 2>&1
            )
        )
        echo    ✅ AI 模型已清空
    )
    
    :: 重新生成環境配置
    echo.
    echo [3/4] 重新生成環境配置...
    if exist .env del /f /q .env
    if exist backend\.env del /f /q backend\.env
    if exist frontend\.env.local del /f /q frontend\.env.local
    
    :: 運行配置腳本
    echo.
    echo [4/4] 重新配置...
    call setup.bat
    
    echo.
    echo ====================================
    echo   ✅ 重置完成！
    echo ====================================
    echo.
) else (
    echo.
    echo ❌ 重置已取消
    echo.
)

pause