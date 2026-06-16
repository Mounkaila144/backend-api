@echo off
REM Wrapper double-cliquable pour install-windows.ps1.
REM Bypass de l'ExecutionPolicy + lancement du script PowerShell.

setlocal
cd /d "%~dp0"

powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0install-windows.ps1" %*

if errorlevel 1 (
    echo.
    echo [ERREUR] L'installation a echoue. Voir les messages ci-dessus.
    pause
)

endlocal
