@echo off
chcp 65001 >nul
echo ========================================
echo   測試完整訓練流程
echo ========================================
echo.

echo 步驟 1: 檢查瀏覽器 Console
echo ========================================
echo 1. 按 F12 開啟開發者工具
echo 2. 切換到 "Console" 標籤
echo 3. 點擊 "Train LSTM Model" 按鈕
echo 4. 查看 Console 輸出
echo.
echo 應該會看到以下訊息之一：
echo   ✅ "Training started" + session_id
echo   ❌ "Failed to start training: Insufficient data"
echo   ❌ "Failed to start training: 其他錯誤"
echo.
pause
echo.

echo 步驟 2: 檢查 Network 請求
echo ========================================
echo 1. 在開發者工具中切換到 "Network" 標籤
echo 2. 再次點擊 "Train LSTM Model" 按鈕
echo 3. 查看是否有 POST /api/v1/ai/training/train 請求
echo 4. 點擊該請求查看 Response
echo.
pause
echo.

echo 步驟 3: 收集訓練數據（如果需要）
echo ========================================
set /p collect="是否需要收集 120 筆訓練數據？(Y/N): "
if /i "%collect%"=="Y" (
    echo.
    echo 開始收集數據...
    call quick_collect_100.bat
) else (
    echo 跳過數據收集
)

echo.
echo ========================================
echo 完成！請回到瀏覽器測試
echo ========================================
pause
