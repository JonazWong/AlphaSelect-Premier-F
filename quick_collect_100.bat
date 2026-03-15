@echo off
setlocal enabledelayedexpansion

set "url=https://your-url.com/api"
set "max_retries=5"
set "exit_code=0"

:retry
for /L %%i in (1,1,%max_retries%) do (
    curl.exe -s -o NUL NUL "!url!" -w "%%{http_code}" > temp_code.txt
    set /p http_code=<temp_code.txt

    if "!http_code!"=="200" (
        echo Request was successful.
        exit /b 0
    ) else (
        echo Attempt %%i failed with HTTP code: !http_code!
        if %%i lss %max_retries% (
            echo Retrying...
            timeout /t 5 > NUL
        ) else (
            echo Max retries reached. Exiting with error.
            exit_code=1
        )
    )
)

if %exit_code% neq 0 (
    exit /b !exit_code!
)

endlocal