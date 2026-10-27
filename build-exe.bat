@echo off
setlocal
cd /d "%~dp0"

rem ============================================================
rem  MyMapleUnion - build a Windows app folder with jpackage
rem  Result: dist\MyMapleUnion\MyMapleUnion.exe (Java is bundled)
rem
rem  Before running: build the jar in Eclipse
rem    Project: right click, Run As, Maven build...
rem    Goals: clean package   then press Run
rem ============================================================

rem --- Settings ---
rem If jpackage is not found automatically, write your JDK 17+ folder here (no quotes), e.g.
rem   set JDK_HOME=C:\Program Files\Eclipse Adoptium\jdk-17.0.12.7-hotspot
set JDK_HOME=
rem To show a console window (useful to find errors), set:  set WIN_CONSOLE=--win-console
set WIN_CONSOLE=
set APP_NAME=MyMapleUnion
set APP_VERSION=1.0.0

rem --- Find jpackage ---
set "JPACKAGE=jpackage"
if not "%JAVA_HOME%"=="" set "JPACKAGE=%JAVA_HOME%\bin\jpackage.exe"
if not "%JDK_HOME%"=="" set "JPACKAGE=%JDK_HOME%\bin\jpackage.exe"
"%JPACKAGE%" --version >nul 2>&1
if errorlevel 1 goto nojpackage

rem --- Find the jar built by Maven ---
set "JAR="
for %%F in (target\mymapleunion-web-*.jar) do set "JAR=%%F"
if "%JAR%"=="" goto nojar

echo Using jar: %JAR%
echo Using jpackage: %JPACKAGE%

rem --- Prepare folders ---
if exist build-tmp rmdir /s /q build-tmp
if exist dist rmdir /s /q dist
mkdir build-tmp\input
copy /y "%JAR%" build-tmp\input\app.jar >nul

rem --- Build ---
"%JPACKAGE%" --type app-image --name %APP_NAME% --app-version %APP_VERSION% ^
  --input build-tmp\input --main-jar app.jar --dest dist ^
  --add-modules java.se,jdk.unsupported,jdk.crypto.ec ^
  --java-options "-Dapp.open-browser=true" %WIN_CONSOLE%
if errorlevel 1 goto failed

rem --- Make a zip to share ---
powershell -NoProfile -Command "Compress-Archive -Path 'dist\%APP_NAME%' -DestinationPath 'dist\%APP_NAME%-windows.zip' -Force"

echo.
echo ===== DONE =====
echo App folder : dist\%APP_NAME%\
echo Run        : dist\%APP_NAME%\%APP_NAME%.exe
echo Zip to share: dist\%APP_NAME%-windows.zip
echo.
pause
exit /b 0

:nojpackage
echo.
echo [ERROR] jpackage was not found.
echo  1) Install JDK 17 or newer (it includes jpackage), then
echo  2) Open this file in a text editor and set JDK_HOME to the JDK folder.
echo     In Eclipse you can see the folder at: Window ^> Preferences ^> Java ^> Installed JREs
echo.
pause
exit /b 1

:nojar
echo.
echo [ERROR] No jar found in the target folder.
echo  Build it first in Eclipse: right click the project ^> Run As ^> Maven build...
echo  Goals: clean package, press Run, then run this file again
echo.
pause
exit /b 1

:failed
echo.
echo [ERROR] jpackage failed. Copy the messages above and ask for help.
echo.
pause
exit /b 1
