@echo off

REM Your current batch commands here
FOR /F "tokens=*" %%i IN (some command) DO (
    curl.exe -s -o NUL -w "%%{http_code}" %%i
)

curl.exe -fsS http://health.check.endpoint
