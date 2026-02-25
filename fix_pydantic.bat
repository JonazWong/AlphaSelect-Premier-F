@echo off
chcp 65001 >nul
echo ====================================
echo   修復 Pydantic 依賴問題
echo ====================================
echo.

echo 此腳本將修復 pydantic 模塊導入錯誤
echo.
pause

echo.
echo [1/3] 卸載舊版本 pydantic...
pip uninstall -y pydantic pydantic-settings pydantic-core 2>nul

echo.
echo [2/3] 安裝新版本 pydantic...
pip install pydantic==2.9.2 pydantic-settings==2.6.1

echo.
echo [3/3] 驗證安裝...
python -c "from pydantic_settings import BaseSettings; print('✅ pydantic-settings 導入成功')"
if %errorlevel% equ 0 (
    echo ✅ Pydantic 依賴修復成功！
) else (
    echo ❌ 修復失敗，請查看錯誤信息
)

echo.
echo 💡 如果仍有問題，請嘗試：
echo    1. 重新創建虛擬環境
echo    2. pip install --upgrade pip
echo    3. pip install -r backend\requirements.txt
echo.
pause
