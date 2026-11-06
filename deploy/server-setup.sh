#!/usr/bin/env bash
# ForGuide 서버 처음 준비 (Ubuntu 24.04, 한 번만 실행).
# 먼저 /etc/forguide/forguide.env를 채워 둔다 (forguide.env.example 참고).
# 실행: sudo bash server-setup.sh   (deploy 폴더 안에서)
set -euo pipefail

if [[ $EUID -ne 0 ]]; then
    echo "sudo로 실행해 주세요: sudo bash server-setup.sh" >&2
    exit 1
fi

ENV_FILE=/etc/forguide/forguide.env
HERE="$(cd "$(dirname "$0")" && pwd)"

if [[ ! -f "$ENV_FILE" ]]; then
    echo "$ENV_FILE 이 없습니다. forguide.env.example을 복사해 값을 채운 뒤 다시 실행해 주세요." >&2
    exit 1
fi
chmod 600 "$ENV_FILE"
chown root:root "$ENV_FILE"

# 환경변수 파일에서 DB 계정만 읽는다 (화면에 출력하지 않는다)
env_value() { grep -E "^$1=" "$ENV_FILE" | head -n1 | cut -d= -f2-; }
DB_USERNAME="$(env_value DB_USERNAME)"
DB_PASSWORD="$(env_value DB_PASSWORD)"
if [[ -z "$DB_USERNAME" || -z "$DB_PASSWORD" ]]; then
    echo "$ENV_FILE 에 DB_USERNAME·DB_PASSWORD를 채워 주세요." >&2
    exit 1
fi
if [[ "$DB_USERNAME$DB_PASSWORD" == *"'"* || "$DB_USERNAME$DB_PASSWORD" == *'\'* ]]; then
    echo "DB_USERNAME·DB_PASSWORD에는 작은따옴표(')와 역슬래시(\\)를 쓰지 마세요." >&2
    exit 1
fi

echo "[1/7] 시간대와 패키지"
timedatectl set-timezone Asia/Seoul
apt-get update -y
DEBIAN_FRONTEND=noninteractive apt-get install -y openjdk-17-jre-headless nginx mysql-server redis-server

echo "[2/7] 스왑 2GB (메모리 2GB 서버에서 빌드·MySQL·Spring이 함께 돌 때 대비)"
if ! swapon --show | grep -q /swapfile; then
    fallocate -l 2G /swapfile
    chmod 600 /swapfile
    mkswap /swapfile
    swapon /swapfile
    grep -q '^/swapfile' /etc/fstab || echo '/swapfile none swap sw 0 0' >> /etc/fstab
fi

echo "[3/7] 실행 계정과 폴더"
id forguide >/dev/null 2>&1 || useradd --system --home /opt/forguide --shell /usr/sbin/nologin forguide
mkdir -p /opt/forguide /var/www/forguide \
    /var/lib/forguide/uploads/community-images \
    /var/lib/forguide/uploads/profile-images \
    /var/lib/forguide/uploads/inquiry-images \
    /var/lib/forguide/uploads/resume-images \
    /var/lib/forguide/uploads/community-report-images
chown -R forguide:forguide /opt/forguide /var/lib/forguide

echo "[4/7] MySQL DB와 계정 (Flyway가 서버 시작 때 V1부터 테이블을 만든다)"
# 비밀번호가 명령줄(프로세스 목록)에 남지 않게 표준 입력으로 넘긴다
mysql <<SQL
CREATE DATABASE IF NOT EXISTS forguide CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS '${DB_USERNAME}'@'localhost' IDENTIFIED BY '${DB_PASSWORD}';
ALTER USER '${DB_USERNAME}'@'localhost' IDENTIFIED BY '${DB_PASSWORD}';
GRANT ALL PRIVILEGES ON forguide.* TO '${DB_USERNAME}'@'localhost';
FLUSH PRIVILEGES;
SQL
systemctl enable --now mysql redis-server

echo "[5/7] 백엔드 서비스 등록 (재부팅 시 자동 시작)"
cp "$HERE/forguide.service" /etc/systemd/system/forguide.service
systemctl daemon-reload
systemctl enable forguide

echo "[6/7] Nginx 설정"
cp "$HERE/nginx-forguide.conf" /etc/nginx/sites-available/forguide
ln -sf /etc/nginx/sites-available/forguide /etc/nginx/sites-enabled/forguide
rm -f /etc/nginx/sites-enabled/default
nginx -t
systemctl enable --now nginx
systemctl reload nginx

echo "[7/7] 끝. 이제 내 PC에서 deploy.ps1로 백엔드·화면을 올린다."
