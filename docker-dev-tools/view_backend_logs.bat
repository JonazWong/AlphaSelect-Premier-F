@echo off
chcp 65001 >nul
echo ====================================
echo   查看 Backend 日誌
echo ====================================
echo.
echo 📋 正在獲取最新日誌...
echo.
echo ─────────────────────────────────────
docker compose logs --tail=100 backend
echo ─────────────────────────────────────
echo.
echo 💡 提示:
echo    - 查看實時日誌: docker compose logs -f backend
echo    - 重啟服務: docker compose restart backend
echo    - 進入容器: docker compose exec backend bash
echo.
pause
