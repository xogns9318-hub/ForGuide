# 배포 (AWS EC2 한 대)

서버 한 대(Ubuntu)에 백엔드·화면·MySQL·Redis를 함께 올린다. 설정 파일은 `deploy/`에 있다.
**서버 주소·키 파일·환경변수 값은 저장소·문서·채팅에 남기지 않는다.**

| 구성 | 내용 |
| --- | --- |
| 서버 | EC2 t3.small(2GB) + 스왑 2GB, Ubuntu 24.04, 디스크 20GB(gp3) |
| 백엔드 | Java 17, `bootJar` → `/opt/forguide/forguide.jar`, systemd `forguide` (재부팅 시 자동 시작) |
| 화면 | `vite build` 결과 → `/var/www/forguide`, Nginx가 제공하고 `/api`는 백엔드(8080)로 넘김 (SSE 버퍼링 끔) |
| DB | 같은 서버의 MySQL, DB `forguide`. 테이블은 서버 시작 때 Flyway가 V1부터 만든다 |
| 기타 | Redis(번역 캐시), 사진은 `/var/lib/forguide/uploads`, Elasticsearch는 쓰지 않음 |
| 비밀값 | `/etc/forguide/forguide.env` (권한 600, root만 읽음) |

## 1. AWS 콘솔 (처음 한 번)
1. EC2 인스턴스: Ubuntu 24.04, t3.small, 디스크 20GB, 키 페어(.pem)는 저장소 밖에 보관
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

## 4. 확인
- 브라우저로 `http://<서버 IP>`: 회원가입(메일 인증)·로그인·새로고침 후 로그인 유지·추천·챗봇(글자가 이어서 써지는지)·알림·사진 올리기(프로필·커뮤니티·문의·이력서·신고)
- 재부팅: `sudo reboot` 뒤 다시 접속해 로그인되는지 (백엔드 자동 시작)
- 관리자 계정: 환경변수 `FORGUIDE_ADMIN_*`로 서버 시작 때 만들어진다

## 문제 생길 때
| 확인 | 명령 |
| --- | --- |
| 백엔드 상태·로그 | `sudo systemctl status forguide`, `sudo journalctl -u forguide -n 200` |
| Nginx 오류 | `sudo nginx -t`, `sudo tail -n 100 /var/log/nginx/error.log` |
| DB 접속 | `sudo mysql forguide` |

- HTTP로 접속하는 동안은 `JWT_COOKIE_SECURE=false`여야 로그인 유지 쿠키가 저장된다. HTTPS를 붙이면 `true`로 바꾼다.
- 서버 DB는 팀 공용 DB와 따로다. 테스트 데이터는 서버에서 새로 만든다.
