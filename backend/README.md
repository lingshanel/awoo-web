# Backend Scaffold

익명 게시판 프로토타입용 `NestJS + Prisma + PostgreSQL` 백엔드입니다.

## 지금 상태

- NestJS 앱 기본 설정 완료
- Prisma 스키마 작성 완료
- `boards`, `threads`, `posts`, `uploads`, `reports`, `reactions`, `health` 모듈 구현
- 서비스 레이어는 **스텁이 아니라 Prisma CRUD 기반**으로 변경 완료
- 기본 게시판 시드(`db:seed`) 추가 완료

## 이 PC에서 확인한 상태

- `Node.js`: 설치됨
- `npm.cmd`: 사용 가능
- `PostgreSQL`: 아직 없음
- `Docker`: 아직 없음

즉, **다음 실행을 위해 가장 먼저 PostgreSQL 설치가 필요합니다.**

## 1. PostgreSQL 설치

Windows에서는 공식 설치 파일을 쓰는 게 가장 쉽습니다.

- 다운로드: [PostgreSQL for Windows](https://www.postgresql.org/download/windows/)

설치 시 권장값:

- Username: `postgres`
- Port: `5432`
- Password: 직접 지정

설치가 끝나면 `SQL Shell (psql)` 또는 `pgAdmin`을 사용할 수 있습니다.

## 2. 데이터베이스 생성

`SQL Shell (psql)` 또는 `pgAdmin`에서 아래 SQL 실행:

```sql
CREATE DATABASE awoo;
```

## 3. 환경 파일 준비

PowerShell:

```powershell
cd C:\Users\user\Desktop\조귀현\위험웹사이트\backend
Copy-Item .env.example .env
```

그 다음 `.env` 파일에서 `DATABASE_URL`을 수정하세요.

예시:

```env
PORT=4000
DATABASE_URL="postgresql://postgres:여기에비밀번호@localhost:5432/awoo?schema=public"
APP_NAME="awoo"
CLIENT_ORIGIN="http://localhost:5500"
UPLOAD_MAX_FILES=4
UPLOAD_MAX_FILE_SIZE_MB=10
CAPTCHA_TTL_SECONDS=300
```

## 4. 의존성 설치

PowerShell 정책 때문에 `npm` 대신 `npm.cmd`를 사용하세요.

```powershell
cd C:\Users\user\Desktop\조귀현\위험웹사이트\backend
npm.cmd install
```

## 5. Prisma Client 생성

```powershell
npm.cmd run prisma:generate
```

## 6. DB 마이그레이션

```powershell
npm.cmd run prisma:migrate -- --name init
```

정상 완료되면 테이블이 생성됩니다.

## 7. 기본 게시판 데이터 넣기

```powershell
npm.cmd run db:seed
```

이 작업은 `anime`, `tech`, `game`, `random` 같은 기본 게시판을 넣습니다.

## 8. 서버 실행

```powershell
npm.cmd run start:dev
```

실행 주소:

- API: `http://localhost:4000`
- Health Check: `http://localhost:4000/api/health`

## 9. 빠른 동작 확인

### 헬스 체크

```powershell
Invoke-RestMethod http://localhost:4000/api/health
```

### 게시판 목록

```powershell
Invoke-RestMethod http://localhost:4000/api/boards
```

### 게임 게시판 스레드 목록

```powershell
Invoke-RestMethod http://localhost:4000/api/boards/game/threads
```

### 스레드 생성

```powershell
$body = @{
  boardSlug = "game"
  title = "테스트 글"
  content = "백엔드 연결 테스트"
  captchaToken = "local-dev"
  captchaAnswer = "local-dev"
} | ConvertTo-Json

Invoke-RestMethod `
  -Uri http://localhost:4000/api/threads `
  -Method Post `
  -ContentType "application/json" `
  -Body $body
```

### 댓글 생성

```powershell
$body = @{
  content = "첫 댓글 테스트"
} | ConvertTo-Json

Invoke-RestMethod `
  -Uri http://localhost:4000/api/threads/1/posts `
  -Method Post `
  -ContentType "application/json" `
  -Body $body
```

## 현재 구현 범위에서 알아둘 점

- CAPTCHA는 아직 실제 검증 로직이 아니라 입력 형식만 맞춰둔 상태입니다.
- 업로드는 현재 메타데이터 저장 중심입니다.
- 추천은 `like`일 때 카운트를 증가시키는 기본 구현만 들어가 있습니다.
- 관리자 기능, 금칙어, rate limit, 인증 없는 신고 제한은 다음 단계에서 강화하면 됩니다.

## 추천 다음 단계

1. 실제 프론트 HTML에서 이 API를 호출하도록 연결
2. CAPTCHA/도배 방지 로직 추가
3. 업로드를 로컬 파일 또는 S3로 확장
4. 신고/관리자 기능 강화
