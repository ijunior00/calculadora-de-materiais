@echo off
chcp 65001 >nul
title Vestas Blade Repair Calculator
cd /d "%~dp0"

echo =======================================================
echo   Vestas Blade Repair Calculator - Materials Estimate
echo =======================================================
echo.

:: ---------- BUSCA DO PYTHON ----------
set "PY="

if exist "C:\ProgramData\anaconda3\python.exe" set "PY=C:\ProgramData\anaconda3\python.exe" & goto FOUND
if exist "%USERPROFILE%\anaconda3\python.exe" set "PY=%USERPROFILE%\anaconda3\python.exe" & goto FOUND
if exist "%USERPROFILE%\anaconda_envs\calculadora_env\python.exe" set "PY=%USERPROFILE%\anaconda_envs\calculadora_env\python.exe" & goto FOUND

where python >nul 2>nul
if %errorlevel%==0 for /f "delims=" %%i in ('where python') do set "PY=%%i" & goto FOUND

where py >nul 2>nul
if %errorlevel%==0 set "PY=py" & goto FOUND

echo [ERRO] Nenhum Python encontrado. Instale Python 3.10+ ou Anaconda.
pause
exit /b 1

:FOUND
echo [INFO] Python: "%PY%"
echo.

:: ---------- INSTALAR DEPENDENCIAS ----------
echo [1/3] Verificando dependencias...
"%PY%" -m pip >nul 2>nul
if %errorlevel%==0 (
    rem Try normal install first; fall back to --user if access is denied (no admin rights)
    "%PY%" -m pip install fastapi uvicorn pydantic fpdf2 openpyxl -q >nul 2>&1 || ^
    "%PY%" -m pip install --user fastapi uvicorn pydantic fpdf2 openpyxl -q >nul 2>&1
) else (
    echo [AVISO] pip nao disponivel.
)

:: ---------- INICIAR SERVIDOR ----------

rem Kill any previous server still running on port 8010 to avoid stale code.
echo [INFO] Atualizando servidor...
for /f "tokens=5" %%p in ('netstat -ano 2^>nul ^| findstr /C:":8010 " 2^>nul ^| findstr /C:"LISTENING" 2^>nul') do (
    taskkill /F /PID %%p >nul 2>&1
)
timeout /t 1 /nobreak >nul

rem Output is always written to the user's own Documents folder so the shared
rem OneDrive folder never needs write access (other users only have read rights).
set "BOM_OUT_DIR=%USERPROFILE%\Documents\BOM_Reports_Generated"
if not exist "%BOM_OUT_DIR%" mkdir "%BOM_OUT_DIR%" 2>nul

echo [2/3] Iniciando servidor (logs em %BOM_OUT_DIR%\server.log)...

rem BOM_OUT_DIR is inherited automatically by the child process.
rem /d sets the working directory so the server finds front-end/ and static/.
start "Servidor Vestas" /d "%~dp0" cmd /k ""%PY%" run_server.py > "%BOM_OUT_DIR%\server.log" 2>&1"

echo [3/3] Aguardando servidor (3 segundos)...
timeout /t 3 /nobreak >nul

:: ---------- ABRIR NAVEGADOR ----------
set "APP_URL=http://localhost:8010"
echo.
echo Abrindo %APP_URL% no navegador...
start "" "%APP_URL%"

echo.
echo =======================================================
echo   Servidor rodando em %APP_URL%
echo   PDFs salvos em: %BOM_OUT_DIR%
echo   Feche esta janela para encerrar.
echo =======================================================
pause
exit /b 0