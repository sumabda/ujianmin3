@echo off
setlocal EnableExtensions
chcp 65001 >nul
title E-Ujian MIN 3 Mukomuko - Server LAN
cd /d "%~dp0"

set "PORT=8080"
if not "%~1"=="" set "PORT=%~1"

echo ============================================================
echo   E-Ujian MIN 3 Mukomuko - Server Jaringan Lokal (LAN)
echo ============================================================
echo.
echo Alamat IP laptop ini (pakai yang berawalan 192.168 / 10 / 172):
ipconfig | findstr /C:"IPv4"
echo.
echo Setelah server berjalan, buka dari laptop/HP lain:
echo    http://IP-LAPTOP:%PORT%
echo Contoh: http://192.168.1.10:%PORT%
echo.
echo Catatan: perangkat lain harus tersambung ke Wi-Fi/LAN yang sama.
echo Hentikan server dengan Ctrl+C atau tutup jendela ini.
echo.

set "PY="
py -3 --version >nul 2>nul
if not errorlevel 1 set "PY=py -3"
if defined PY goto run_python

python -c "import sys; sys.exit(0)" >nul 2>nul
if not errorlevel 1 set "PY=python"
if defined PY goto run_python

where node >nul 2>nul
if not errorlevel 1 goto run_node

echo Python dan Node.js belum terpasang di laptop ini.
echo.
echo Pilihan termudah: pasang Python dari https://www.python.org/downloads/
echo   - saat instalasi, centang "Add python.exe to PATH"
echo   - setelah selesai, jalankan ulang file ini
echo.
echo Alternatif: pasang Node.js LTS dari https://nodejs.org/
echo.
pause
goto :eof

:run_python
echo Menjalankan server dengan Python di port %PORT% ...
start "" "http://localhost:%PORT%/index.html"
%PY% -m http.server %PORT% --bind 0.0.0.0
goto selesai

:run_node
echo Menjalankan server dengan Node.js di port %PORT% ...
echo Jika baru pertama kali, npx akan mengunduh paket serve (butuh internet).
start "" "http://localhost:%PORT%/index.html"
npx --yes serve -l %PORT% .
goto selesai

:selesai
echo.
echo Server berhenti.
pause
