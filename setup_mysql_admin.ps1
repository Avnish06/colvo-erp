# Run this script as Administrator to register and start MySQL 8.4 as a Windows service
# Right-click PowerShell -> "Run as Administrator" -> paste this script

$MySQLBin  = "C:\Program Files\MySQL\MySQL Server 8.4\bin"
$MySQLData = "C:\ProgramData\MySQL\MySQL Server 8.4\Data"
$MyIni     = "C:\ProgramData\MySQL\MySQL Server 8.4\my.ini"

Write-Host "==================================================" -ForegroundColor Cyan
Write-Host "  MySQL 8.4 Service Setup" -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Cyan

# 1. Install MySQL as a Windows service
Write-Host "`n[1/4] Installing MySQL84 service..." -ForegroundColor Yellow
& "$MySQLBin\mysqld.exe" --install MySQL84 --defaults-file="$MyIni"

# 2. Start the service
Write-Host "[2/4] Starting MySQL84 service..." -ForegroundColor Yellow
Start-Service -Name MySQL84
Start-Sleep -Seconds 5

# 3. Verify service is running
$svc = Get-Service -Name MySQL84 -ErrorAction SilentlyContinue
if ($svc.Status -eq "Running") {
    Write-Host "[3/4] MySQL service is RUNNING!" -ForegroundColor Green
} else {
    Write-Host "[3/4] ERROR: MySQL service failed to start. Check: $MySQLData\mysql_error.log" -ForegroundColor Red
    exit 1
}

# 4. Create the database
Write-Host "[4/4] Creating management_system database..." -ForegroundColor Yellow
Start-Sleep -Seconds 3
& "$MySQLBin\mysql.exe" -u root -h 127.0.0.1 -P 3306 -e "CREATE DATABASE IF NOT EXISTS management_system CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci; SHOW DATABASES;"

Write-Host "`n==================================================" -ForegroundColor Green
Write-Host "  Done! MySQL is ready on 127.0.0.1:3306" -ForegroundColor Green
Write-Host "  Database: management_system" -ForegroundColor Green
Write-Host "  User: root (no password)" -ForegroundColor Green
Write-Host "==================================================" -ForegroundColor Green
Write-Host "`nNow import the schema by running:" -ForegroundColor Cyan
Write-Host "  & `"$MySQLBin\mysql.exe`" -u root -h 127.0.0.1 management_system < `"d:\OLD-REACT6july\management_system.sql`"" -ForegroundColor White
