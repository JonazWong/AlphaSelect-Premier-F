# Docker 開發工具集

此資料夾收納了專案在 Docker Desktop 本地開發環境下使用的輔助腳本與工具，包含啟動、停止、診斷、測試、修復等用途的批次檔與 Python 腳本。

這些檔案僅供本地開發使用，不屬於正式部署流程的一部分。

## 包含的工具類別

- **啟動/停止腳本**：`一鍵啟動腳本 start.bat`、`一鍵停止腳本 stop.bat`、`restart.bat` 等
- **診斷工具**：`diagnose_backend.bat`、`diagnose_db.bat`、`diagnose_radar.bat` 等
- **測試腳本**：`test_mexc.bat`、`test_mexc_docker.bat`、`test_connection.bat` 等
- **修復工具**：`fix_all_errors.bat`、`fix_build_error.bat`、`fix_docker_compose.py` 等
- **日誌查看**：`logs.bat`、`view_backend_logs.bat`、`show_backend_logs.bat`
- **重建工具**：`rebuild_backend.bat`、`rebuild_frontend.bat`
- **環境設定**：`setup.bat`、`setup_python_env.bat`、`config_mexc.bat`
