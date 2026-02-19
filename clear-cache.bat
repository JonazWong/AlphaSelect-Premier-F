@echo off
chcp 65001 >nul
title 清除瀏覽器緩存說明
color 0E

echo.
echo ╔════════════════════════════════════════════════════════════╗
echo ║                                                            ║
echo ║              前端樣式更新 - 清除緩存指南                 ║
echo ║                                                            ║
echo ╚════════════════════════════════════════════════════════════╝
echo.
echo.
echo 已修復輸入框文字顏色問題！
echo.
echo 修復內容:
echo   ✓ 市場篩選器輸入框文字顏色（白色）
echo   ✓ 輸入框背景顏色（深灰色）
echo   ✓ Placeholder 文字顏色（灰色）
echo   ✓ 全局輸入框樣式
echo.
echo ═══════════════════════════════════════════════════════════
echo  清除瀏覽器緩存步驟（請選擇您的瀏覽器）:
echo ═══════════════════════════════════════════════════════════
echo.
echo 【Chrome / Edge】
echo   1. 按 Ctrl + Shift + Delete
echo   2. 選擇「時間範圍」→「過去 1 小時」
echo   3. 勾選「快取圖片和檔案」
echo   4. 點擊「清除資料」
echo   5. 或直接按 Ctrl + F5 強制重新整理
echo.
echo 【Firefox】
echo   1. 按 Ctrl + Shift + Delete
echo   2. 選擇「時間範圍」→「過去 1 小時」
echo   3. 勾選「快取」
echo   4. 點擊「立即清除」
echo   5. 或直接按 Ctrl + F5 強制重新整理
echo.
echo 【快速方法（推薦）】
echo   1. 開啟 http://localhost:3000/market-screener
echo   2. 按 Ctrl + Shift + R （強制重新載入）
echo   或 Ctrl + F5
echo.
echo ═══════════════════════════════════════════════════════════
echo.
echo 💡 提示:
echo   - 如果仍然看不到文字，請完全關閉瀏覽器後重新開啟
echo   - Next.js 開發模式會自動重新編譯，請稍等幾秒
echo.
echo ═══════════════════════════════════════════════════════════
echo.
echo 按任意鍵開啟市場篩選器頁面...
pause >nul

start http://localhost:3000/market-screener

echo.
echo 頁面已開啟！
echo.
echo 如果輸入框文字仍然看不到，請:
echo   1. 按 Ctrl + F5 強制重新整理
echo   2. 或完全關閉瀏覽器後重新開啟
echo.
pause
