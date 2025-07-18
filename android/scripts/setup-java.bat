@echo off
REM 🔧 Java Setup Script for Windows Android Development
REM This script helps set up Java for React Native Android development

echo 🚀 Setting up Java for Android Development on Windows...

REM Check if Java is already installed
java -version >nul 2>&1
if %errorlevel% == 0 (
    echo ✅ Java is already installed
    java -version
    
    REM Check if JAVA_HOME is set
    if defined JAVA_HOME (
        echo ✅ JAVA_HOME is set: %JAVA_HOME%
        echo 🎉 Java is properly configured!
        goto :end
    ) else (
        echo ⚠️  JAVA_HOME is not set
        goto :set_java_home
    )
) else (
    echo ❌ Java is not installed
    goto :install_java
)

:install_java
echo.
echo 📥 Java needs to be installed manually on Windows
echo.
echo Please follow these steps:
echo 1. Download JDK 17 from: https://adoptium.net/temurin/releases/
echo 2. Choose "Windows x64" and download the .msi installer
echo 3. Run the installer and follow the setup wizard
echo 4. After installation, run this script again
echo.
pause
goto :end

:set_java_home
echo.
echo 🔧 Setting up JAVA_HOME environment variable...

REM Try to find Java installation automatically
for /d %%i in ("C:\Program Files\Eclipse Adoptium\jdk-*") do (
    set "JAVA_PATH=%%i"
    goto :found_java
)

for /d %%i in ("C:\Program Files\Java\jdk-*") do (
    set "JAVA_PATH=%%i"
    goto :found_java
)

for /d %%i in ("C:\Program Files\OpenJDK\jdk-*") do (
    set "JAVA_PATH=%%i"
    goto :found_java
)

echo ❌ Could not find Java installation automatically
echo.
echo Please set JAVA_HOME manually:
echo 1. Find your Java installation directory (usually in C:\Program Files\)
echo 2. Right-click "This PC" → Properties → Advanced system settings
echo 3. Click "Environment Variables"
echo 4. Under "System Variables", click "New"
echo 5. Variable name: JAVA_HOME
echo 6. Variable value: [path to your JDK installation]
echo 7. Edit PATH variable and add: %%JAVA_HOME%%\bin
echo.
pause
goto :end

:found_java
echo ✅ Found Java installation: %JAVA_PATH%

REM Set JAVA_HOME for current session
set "JAVA_HOME=%JAVA_PATH%"

REM Set JAVA_HOME permanently
setx JAVA_HOME "%JAVA_PATH%" >nul
if %errorlevel% == 0 (
    echo ✅ JAVA_HOME set permanently: %JAVA_PATH%
) else (
    echo ❌ Failed to set JAVA_HOME permanently
)

REM Add to PATH
setx PATH "%PATH%;%JAVA_HOME%\bin" >nul
if %errorlevel% == 0 (
    echo ✅ Added Java to PATH
) else (
    echo ❌ Failed to add Java to PATH
)

echo.
echo 🎉 Java setup completed!
echo.
echo ⚠️  Important: You need to restart your command prompt/terminal
echo    for the environment variables to take effect.
echo.
echo After restarting, you can run: npm run android

:end
pause