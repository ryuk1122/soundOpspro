@echo off
setlocal

cd /d "%~dp0backend"

for /f "usebackq delims=" %%I in (`powershell -NoProfile -Command "Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.IPAddress -notlike '127.*' -and $_.IPAddress -notlike '169.254.*' } | Select-Object -First 1 -ExpandProperty IPAddress"`) do set "LAN_IP=%%I"

if exist ".venv\Scripts\python.exe" (
  set "PYTHON=.venv\Scripts\python.exe"
) else (
  set "PYTHON=python"
)

echo Starting SoundOps Pro API...
echo.
echo Local: http://127.0.0.1:8001/api/health
if defined LAN_IP echo Phone: http://%LAN_IP%:8001/api/health
echo.
echo Keep this window open while using the APK.
echo.

"%PYTHON%" -m uvicorn server:app --host 0.0.0.0 --port 8001

pause
