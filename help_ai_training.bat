@echo off
chcp 65001 >nul
echo ========================================
echo   檢查 AI Training 卡片功能
echo ========================================
echo.

echo [測試 1] 在瀏覽器按 F12 打開開發者工具
echo [測試 2] 點擊 Console 標籤
echo [測試 3] 點擊任一模型卡片
echo [測試 4] 查看是否有錯誤訊息
echo.
echo ----------------------------------------
echo 常見問題診斷：
echo ----------------------------------------
echo.

echo 問題 1: 卡片能選中但無法開始訓練？
echo 答案: 需要先收集至少 100 筆市場數據
echo.

echo 問題 2: 需要設置 MEXC API Key 嗎？
echo 答案: 不需要！公開 API 可以直接使用
echo.

echo 問題 3: 如何開始訓練？
echo 答案: 
echo   1. 選擇交易對（BTC_USDT）
echo   2. 點擊模型卡片選擇模型類型
echo   3. 點擊 "Train LSTM Model" 按鈕
echo.

echo ========================================
echo 立即測試：收集訓練數據
echo ========================================
echo.

set /p collect="是否現在收集 120 筆訓練數據？(Y/N): "
if /i "%collect%"=="Y" (
    echo.
    echo 開始收集數據...
    call quick_collect_100.bat
) else (
    echo.
    echo 跳過數據收集
)

pause
