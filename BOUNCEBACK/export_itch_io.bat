@echo off
setlocal
REM Automated Godot 4.x Web Export + itch.io ZIP builder for Windows
REM Usage: Ensure Godot 4.3+ is installed and either on PATH or set GODOT_BIN below.

if not defined GODOT_BIN (
  where godot4 >nul 2>nul && set GODOT_BIN=godot4
)
if not defined GODOT_BIN (
  where godot >nul 2>nul && set GODOT_BIN=godot
)
if not defined GODOT_BIN (
  echo [ERROR] Godot 4 executable not found in PATH.
  echo Set GODOT_BIN=C:\Path\To\Godot_v4.3-stable_win64_console.exe and re-run.
  exit /b 1
)

if not exist "builds\web" mkdir "builds\web"
echo Exporting Web preset with %GODOT_BIN%...
"%GODOT_BIN%" --headless --path "%~dp0" --export-release "Web" "%~dp0builds\web\index.html"
if errorlevel 1 (
  echo [ERROR] Godot Web export failed. Make sure Web Export Templates are installed in Editor ^> Manage Export Templates.
  exit /b 1
)

echo Packaging BOUNCEBACK-ITCH-IO.zip with index.html at ZIP root...
powershell -NoProfile -Command "Compress-Archive -Path '%~dp0builds\web\*' -DestinationPath '%~dp0BOUNCEBACK-ITCH-IO.zip' -Force"
if errorlevel 1 exit /b 1

echo Done! Upload BOUNCEBACK-ITCH-IO.zip directly to itch.io (Kind of project: HTML).
