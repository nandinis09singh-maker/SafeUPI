@echo off
setlocal
echo ===================================================
echo   Starting SafeUPI Spring Boot Backend (Port 8080)
echo ===================================================

if "%JAVA_HOME%"=="" (
    set "JAVA_HOME=C:\Users\rajveer singh\Documents\tools\jdk-17.0.10+7"
)
set "PATH=%JAVA_HOME%\bin;C:\Users\rajveer singh\Documents\tools\apache-maven-3.9.6\bin;%PATH%"

cd /d "%~dp0"
mvn spring-boot:run
