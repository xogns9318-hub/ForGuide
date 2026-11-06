# ForGuide 배포 (내 PC → 서버). 백엔드 jar와 화면 빌드 결과를 올리고 백엔드를 다시 켠다.
# 서버 주소와 키 파일은 저장소에 두지 않는다. 실행할 때 넘기거나 환경변수로 둔다.
#   .\deploy\deploy.ps1 -Server ubuntu@<서버 IP> -Key C:\keys\forguide.pem
#   (또는 FORGUIDE_SERVER, FORGUIDE_SSH_KEY 환경변수)
param(
    [string]$Server = $env:FORGUIDE_SERVER,
    [string]$Key = $env:FORGUIDE_SSH_KEY,
    [switch]$SkipBuild
)

$ErrorActionPreference = "Stop"
if (-not $Server -or -not $Key) {
    throw "서버 주소(-Server ubuntu@IP)와 키 파일(-Key 경로)이 필요합니다."
}

$root = Split-Path -Parent $PSScriptRoot
$ssh = @("-i", $Key, "-o", "StrictHostKeyChecking=accept-new")

function Invoke-Step($title, [scriptblock]$action) {
    Write-Host "`n== $title" -ForegroundColor Cyan
    & $action
    if ($LASTEXITCODE -ne 0) { throw "$title 단계에서 실패했습니다 (종료 코드 $LASTEXITCODE)." }
}

if (-not $SkipBuild) {
    Invoke-Step "백엔드 빌드 (bootJar)" {
        Push-Location "$root\backend"
        try { .\gradlew.bat bootJar -q } finally { Pop-Location }
    }
    Invoke-Step "화면 빌드 (vite build)" {
        Push-Location "$root\frontend"
        try { npm run build } finally { Pop-Location }
    }
}

$jar = Get-ChildItem "$root\backend\build\libs\*.jar" | Where-Object { $_.Name -notlike "*-plain.jar" } | Select-Object -First 1
if (-not $jar) { throw "backend/build/libs에 jar가 없습니다." }
$web = Join-Path $env:TEMP "forguide-web.tar.gz"
Invoke-Step "화면 묶기" { tar -czf $web -C "$root\frontend\dist" . }

Invoke-Step "서버로 올리기" { scp @ssh $jar.FullName "${Server}:/tmp/forguide.jar"; scp @ssh $web "${Server}:/tmp/forguide-web.tar.gz" }

$remote = @'
set -e
sudo install -o forguide -g forguide -m 644 /tmp/forguide.jar /opt/forguide/forguide.jar
sudo rm -rf /var/www/forguide/*
sudo tar -xzf /tmp/forguide-web.tar.gz -C /var/www/forguide
sudo chown -R root:root /var/www/forguide
rm -f /tmp/forguide.jar /tmp/forguide-web.tar.gz
sudo systemctl restart forguide
for i in $(seq 1 60); do
  if curl -fs -o /dev/null http://127.0.0.1:8080/api/v1/recommend/loan/choices; then echo "백엔드 켜짐 (${i}초)"; exit 0; fi
  sleep 1
done
echo "백엔드가 60초 안에 켜지지 않았습니다. sudo journalctl -u forguide -n 100 으로 확인하세요." >&2
exit 1
'@
# 서버(bash)로 보내는 명령은 UTF-8·LF로 보낸다 (Windows PowerShell 기본값이면 한글이 깨지고 CRLF가 섞인다)
$OutputEncoding = New-Object System.Text.UTF8Encoding $false
$remote = $remote -replace "`r", ""
Invoke-Step "서버에서 설치·재시작" { $remote | ssh @ssh $Server "bash -s" }

Write-Host "`n배포 완료: http://$($Server.Split('@')[-1])" -ForegroundColor Green
