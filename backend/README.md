# AWOO Backend

AWOO Backend는 익명 이미지 게시판 서비스 AWOO/KR의 API 서버입니다. NestJS, Prisma, PostgreSQL을 기반으로 게시판, 글, 댓글, 이미지 업로드, 신고, 관리자 운영 기능을 제공합니다.

## 역할

- 게시판/스레드/댓글 도메인 API 제공
- Prisma 기반 PostgreSQL 데이터 모델 관리
- 이미지 업로드, 리사이징, 썸네일 생성, Supabase Storage 연동
- 익명 작성자의 비밀번호 기반 수정/삭제 처리
- CAPTCHA, CSRF, 관리자 세션, 업로드 삭제 token 등 보안 흐름 처리
- 신고, 숨김, 차단, 관리자 작업 로그 등 운영 기능 제공

## 기술 스택

- NestJS 11
- TypeScript
- Prisma ORM
- PostgreSQL
- Supabase Storage
- Sharp
- Render

## 모듈 구조

```text
src/
  app.module.ts
  main.ts
  prisma/
    prisma.module.ts
    prisma.service.ts
  common/
    request/
    security/
    uploads/
    utils/
  modules/
    admin/
    boards/
    health/
    posts/
    reactions/
    reports/
    threads/
    uploads/
```

### 주요 모듈

- `boards`: 게시판 목록, 게시판별 스레드 조회, 최근 글 조회
- `threads`: 스레드 생성, 조회, 수정, 삭제, 조회수 증가
- `posts`: 댓글/대댓글 생성, 수정, 삭제
- `uploads`: 이미지 업로드, 썸네일 생성, 삭제 token 검증
- `reports`: 게시글/댓글 신고 접수
- `reactions`: 게시글/댓글 추천 처리
- `admin`: 관리자 로그인, 세션, 신고 처리, 숨김, 차단, 운영 로그
- `security`: CAPTCHA, 작성자 비밀번호 hash, 스팸 방지 유틸리티
- `health`: 배포 상태 확인용 health check

## 데이터 모델

Prisma schema는 `prisma/schema.prisma`에 정의되어 있습니다.

```text
Board
  └─ Thread
       ├─ Post
       ├─ Attachment
       ├─ Report
       └─ Reaction

AdminUser
  ├─ AdminSession
  ├─ AdminActionLog
  └─ AdminBan
```

### 핵심 모델

- `Board`: 게시판 카테고리
- `Thread`: 게시글 본문, 작성자 hash, 조회수, 추천수, 삭제 여부
- `Post`: 댓글과 대댓글, 작성자 hash, 삭제 여부
- `Attachment`: 업로드 이미지와 썸네일 메타데이터
- `Report`: 신고 대상, 신고 사유, 처리 상태
- `Reaction`: 추천/비추천 기록
- `AdminUser`: 관리자 계정과 권한
- `AdminSession`: 관리자 session token hash와 CSRF token hash
- `AdminActionLog`: 관리자 작업 기록
- `AdminBan`: 작성자 hash 또는 IP hash 기반 차단

## 보안 구현

- 작성자 수정/삭제 비밀번호는 hash로 저장합니다.
- 관리자 비밀번호는 `scrypt` 기반 hash로 저장합니다.
- 관리자 session token과 CSRF token은 hash로 저장하고 요청 시 검증합니다.
- 글/댓글 작성과 수정 요청에는 CAPTCHA 검증을 적용합니다.
- CAPTCHA token은 nonce와 만료 시간을 포함하고 재사용을 방지합니다.
- 이미지 삭제는 업로드별 delete token으로 보호합니다.
- 관리자 로그인 실패 횟수 제한과 잠금 시간을 적용합니다.
- 요청자의 IP/식별 정보는 hash 형태로 저장해 차단과 중복 방지에 사용합니다.

## API 개요

대표 API 경로는 다음과 같습니다.

```text
GET    /api/health
GET    /api/boards
GET    /api/boards/recent/threads
GET    /api/boards/:slug/threads
GET    /api/threads/:id
POST   /api/threads
PATCH  /api/threads/:id
DELETE /api/threads/:id
POST   /api/threads/:id/view
GET    /api/threads/:id/posts
POST   /api/threads/:id/posts
PATCH  /api/threads/:threadId/posts/:postId
DELETE /api/threads/:threadId/posts/:postId
POST   /api/uploads/images
DELETE /api/uploads/:id
POST   /api/threads/:id/reactions
POST   /api/posts/:id/reactions
POST   /api/threads/:id/report
POST   /api/posts/:id/report
POST   /api/admin/login
POST   /api/admin/logout
GET    /api/admin/me
GET    /api/admin/summary
GET    /api/admin/reports
POST   /api/admin/reports/:id/resolve
POST   /api/admin/threads/:id/hide
POST   /api/admin/posts/:id/hide
GET    /api/admin/bans
POST   /api/admin/bans
POST   /api/admin/bans/:id/revoke
GET    /api/admin/logs
POST   /api/admin/password
```

## 환경변수

로컬 개발은 `.env.example`을 복사해 `.env`를 만든 뒤 값을 채워 실행합니다. 실제 운영 secret은 GitHub에 커밋하지 않고 Render/Supabase/Vercel 환경변수로 관리합니다.

```env
PORT=4000
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/awoo?schema=public"
APP_NAME="awoo"
CLIENT_ORIGIN="http://localhost:3000,http://localhost:5500"
UPLOAD_MAX_FILES=4
UPLOAD_MAX_FILE_SIZE_MB=10
CAPTCHA_TTL_SECONDS=300
CAPTCHA_SECRET="replace-with-a-long-random-secret"
UPLOAD_DIR="uploads"
UPLOAD_BASE_URL="http://localhost:4000/uploads"
UPLOAD_DELETE_SECRET="replace-with-a-different-long-random-secret"
UPLOAD_MAX_WIDTH=1600
UPLOAD_THUMB_SIZE=320
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
SUPABASE_STORAGE_BUCKET=
ADMIN_USERNAME="admin"
ADMIN_PASSWORD="change-this-long-password"
ADMIN_SESSION_TTL_SECONDS=28800
ADMIN_LOGIN_MAX_ATTEMPTS=5
ADMIN_LOGIN_LOCK_MINUTES=15
REPORT_AUTO_HIDE_THRESHOLD=
```

운영 환경에서는 `CAPTCHA_SECRET`, `UPLOAD_DELETE_SECRET`, `ADMIN_PASSWORD`, `DATABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`를 반드시 안전한 값으로 교체해야 합니다.

## 로컬 실행

```bash
cd backend
npm install
cp .env.example .env
npm run prisma:generate
npm run prisma:migrate
npm run db:boards
npm run admin:create
npm run start:dev
```

기본 실행 주소:

- API: http://localhost:4000/api
- Health check: http://localhost:4000/api/health

## 주요 스크립트

```bash
npm run start:dev        # 개발 서버 실행
npm run build            # NestJS 빌드
npm run start:prod       # 빌드 결과 실행
npm run lint             # TypeScript type check
npm run prisma:generate  # Prisma client 생성
npm run prisma:migrate   # 로컬 DB 마이그레이션
npm run prisma:studio    # Prisma Studio 실행
npm run db:boards        # 기본 게시판 upsert
npm run admin:create     # 관리자 계정 생성/갱신
```

## 검증

```bash
npm run lint
npm run build
```

## 구현하며 고려한 점

- 익명 게시판 특성상 일반 회원 인증 대신 작성자 비밀번호 hash와 actor hash를 조합했습니다.
- 관리자 기능은 단순 hidden route에만 의존하지 않고 session cookie와 CSRF token을 함께 검증하도록 구성했습니다.
- 이미지 업로드는 원본 파일을 그대로 저장하지 않고 크기 제한, 리사이징, 썸네일 생성을 거치도록 했습니다.
- 무료 배포 환경에서도 상태 확인과 운영 점검이 가능하도록 health endpoint를 별도로 제공했습니다.
