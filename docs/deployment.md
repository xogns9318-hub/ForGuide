# 배포 (AWS EC2 한 대)

서버 한 대(Ubuntu)에 백엔드·화면·MySQL·Redis·Elasticsearch를 함께 올린다. 설정 파일은 `deploy/`에 있다.
**서버 주소·키 파일·환경변수 값은 저장소·문서·채팅에 남기지 않는다.**

| 구성 | 내용 |
| --- | --- |
| 서버 | EC2 c7i-flex.large(x86, 2 vCPU·4GB) + 스왑 2GB, Ubuntu 24.04, 디스크 20GB(gp3) |
| 백엔드 | Java 17, `bootJar` → `/opt/forguide/forguide.jar`, systemd `forguide` (재부팅 시 자동 시작) |
| 화면 | `vite build` 결과 → `/var/www/forguide`, Nginx가 제공하고 `/api`는 백엔드(8080)로 넘김 (SSE 버퍼링 끔) |
| DB | 같은 서버의 MySQL, DB `forguide`. 테이블은 서버 시작 때 Flyway가 V1부터 만든다 |
| 기타 | Redis(번역 캐시), 사진은 `/var/lib/forguide/uploads` |
| 기관 검색 | Docker로 팀 `compose.yml`의 Elasticsearch(Nori)만 실행, 서버용 값은 `deploy/compose.server.yml` (힙 768MB, 재부팅 시 자동 시작) |
| 주소 | `https://forguide.duckdns.org` (DuckDNS 무료 도메인 → 탄력적 IP, Let's Encrypt 인증서·자동 갱신). http·IP로 들어와도 https로 넘긴다 |
| 비밀값 | `/etc/forguide/forguide.env` (권한 600, root만 읽음) |

## 1. AWS 콘솔 (처음 한 번)
1. EC2 인스턴스: Ubuntu 24.04, c7i-flex.large(검색 서버까지 쓰려면 x86·4GB 필요, t3.medium도 가능. 바꿀 때는 중지 → 스냅샷 → 인스턴스 유형 변경 → 시작), 디스크 20GB, 키 페어(.pem)는 저장소 밖에 보관
2. 보안 그룹 인바운드: 22(내 IP만), 80, 443만 연다. 3306·6379·8080은 열지 않는다
3. (선택) 탄력적 IP를 붙이면 재시작해도 주소가 바뀌지 않는다

## 2. 서버 준비 (처음 한 번)
```bash
# 내 PC에서 deploy 폴더를 서버로 복사
scp -i <키.pem> -r deploy ubuntu@<서버 IP>:~/
# 서버에서
ssh -i <키.pem> ubuntu@<서버 IP>
sudo mkdir -p /etc/forguide
sudo cp ~/deploy/forguide.env.example /etc/forguide/forguide.env
sudo chmod 600 /etc/forguide/forguide.env
sudo nano /etc/forguide/forguide.env      # 값 채우기 (DB 비밀번호에 ' \ 쓰지 않기, JWT_SECRET은 openssl rand -base64 48)
sudo bash ~/deploy/server-setup.sh        # Java·Nginx·MySQL·Redis 설치, 스왑, DB 계정, 서비스·Nginx 등록
```

## 3. 배포 (코드가 바뀔 때마다, 내 PC의 PowerShell)
```powershell
.\deploy\deploy.ps1 -Server ubuntu@<서버 IP> -Key <키.pem 경로>
```
백엔드 jar·화면을 빌드해 올리고 백엔드를 다시 켠 뒤, 켜질 때까지 기다린다. 빌드 없이 올리기만 하려면 `-SkipBuild`.
`deploy/nginx-forguide.conf`가 바뀌었으면(배포 스크립트는 Nginx 설정을 올리지 않는다) 그 파일을 서버 `~/deploy/`에 복사한 뒤 서버에서 `sudo cp ~/deploy/nginx-forguide.conf /etc/nginx/sites-available/forguide && sudo nginx -t && sudo systemctl reload nginx`.

## 4. 확인
- 브라우저로 `https://forguide.duckdns.org` (6절 전에는 `http://<서버 IP>`): 회원가입(메일 인증)·로그인·새로고침 후 로그인 유지·추천·챗봇(글자가 이어서 써지는지)·알림·사진 올리기(프로필·커뮤니티·문의·이력서·신고 — 올린 뒤 `/var/lib/forguide/uploads/` 아래 각 폴더에 파일이 생기는지도 본다. 이력서·신고는 경로를 Spring 설정 이름으로 넘겨서 실서버 확인이 필요하다)
- 재부팅: `sudo reboot` 뒤 다시 접속해 로그인되는지 (백엔드 자동 시작)
- 관리자 계정: 환경변수 `FORGUIDE_ADMIN_*`로 서버 시작 때 만들어진다

## 5. 기관 검색 켜기 (처음 한 번)
```powershell
# 내 PC: 팀 compose와 검색 서버 이미지 설정을 서버의 ~/forguide로 복사
ssh -i <키.pem> ubuntu@<서버 IP> "mkdir -p forguide/database forguide/deploy"
scp -i <키.pem> compose.yml ubuntu@<서버 IP>:~/forguide/
scp -i <키.pem> database/Dockerfile.elasticsearch ubuntu@<서버 IP>:~/forguide/database/
scp -i <키.pem> deploy/compose.server.yml ubuntu@<서버 IP>:~/forguide/deploy/
```
```bash
# 서버: Docker 설치 후 Elasticsearch만 실행 (Redis는 서버에 직접 설치돼 있어 띄우지 않는다)
sudo apt-get install -y docker.io docker-compose-v2
cd ~/forguide
sudo docker compose -f compose.yml -f deploy/compose.server.yml --profile search up -d --build --wait --wait-timeout 300 elasticsearch
curl -s http://127.0.0.1:9200        # "number" : "9.4.7"이 보이면 켜진 것
```
1. `sudo nano /etc/forguide/forguide.env`에서 `FORGUIDE_ELASTICSEARCH_ENABLED=true`, `FORGUIDE_ELASTICSEARCH_REINDEX_ON_START=true`
2. `sudo systemctl restart forguide` 후 `sudo journalctl -u forguide -n 300 --no-pager | grep -E "Elasticsearch|Nori|기관 검색"` → `기관 검색 자료 복사 완료: MySQL N개 / Elasticsearch N개`(두 수가 같아야 함)
3. `FORGUIDE_ELASTICSEARCH_REINDEX_ON_START=false`로 되돌리고 다시 `sudo systemctl restart forguide`
4. 화면의 도움 기관 검색에서 결과가 나오는지 본다. 팀이 `compose.yml`·`database/Dockerfile.elasticsearch`를 바꾸면 위 복사와 `up` 명령을 다시 실행한다

## 6. HTTPS (도메인 연결, 처음 한 번)
1. duckdns.org에서 이름(`forguide`)을 만들고 current ip를 **서버의 탄력적 IP**로 바꾼다 (처음엔 내 PC IP가 들어 있다). token은 공유하지 않는다
2. 서버에서 인증서를 받는다 (Let's Encrypt 약관 동의, 만료 메일 없이):
```bash
sudo sed -i "s|server_name _;|server_name forguide.duckdns.org;|" /etc/nginx/sites-available/forguide
sudo apt-get install -y certbot python3-certbot-nginx
sudo certbot --nginx -d forguide.duckdns.org --agree-tos --register-unsafely-without-email --redirect --non-interactive
```
3. certbot이 만든 맨 아래 `listen 80` 블록을 아래로 바꿔 IP로 들어와도 https로 넘긴다 (그대로 두면 IP 접속이 404)
```nginx
server {
    listen 80 default_server;
    listen [::]:80 default_server;
    server_name _;
    return 301 https://forguide.duckdns.org$request_uri;
}
```
4. `sudo nginx -t && sudo systemctl reload nginx`, `/etc/forguide/forguide.env`의 `JWT_COOKIE_SECURE=true` → `sudo systemctl restart forguide`
5. 갱신 확인: `sudo certbot renew --dry-run` (자동 실행이라 몇 분 기다렸다가 끝난다). 갱신은 `certbot.timer`가 알아서 한다

## 문제 생길 때
| 확인 | 명령 |
| --- | --- |
| 백엔드 상태·로그 | `sudo systemctl status forguide`, `sudo journalctl -u forguide -n 200` |
| Nginx 오류 | `sudo nginx -t`, `sudo tail -n 100 /var/log/nginx/error.log` |
| DB 접속 | `sudo mysql forguide` |
| 검색 서버 | `sudo docker ps`, `sudo docker logs forguide-elasticsearch --tail 100` |

- `JWT_COOKIE_SECURE`는 https면 `true`, http만 쓰는 동안(6절 전)은 `false`여야 로그인 유지 쿠키가 저장된다.
- `server-setup.sh`를 다시 실행하면 Nginx 설정이 http용으로 돌아간다. 그 뒤엔 6절 2~4를 다시 한다.
- 서버 DB는 팀 공용 DB와 따로다. 테스트 데이터는 서버에서 새로 만든다.
