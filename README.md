# AWOO/KR

AWOO/KR은 익명 이미지 게시판 스타일의 커뮤니티 웹 애플리케이션입니다. 글 작성, 댓글과 대댓글, 이미지 첨부, 추천/신고, 관리자 운영 화면까지 포함해 실제 공개 운영을 목표로 구현했습니다.

- Live demo: https://awoo-web.vercel.app
- Backend health: https://awoo-backend.onrender.com/api/health

> Render 무료 인스턴스를 사용하므로 첫 요청은 서버가 깨어나는 동안 지연될 수 있습니다. 이를 줄이기 위해 GitHub Actions scheduled ping으로 health endpoint를 주기적으로 호출합니다.

## 프로젝트 목표

- 프론트엔드와 백엔드를 분리한 풀스택 서비스 구현
- 게시판 도메인에 필요한 CRUD, 댓글, 검색, 이미지 업로드, 신고/관리자 기능 구현
- 익명 서비스에서 필요한 CAPTCHA, 비밀번호 기반 수정/삭제, CSRF, 토큰 보호 등 보안 요소 적용
- Vercel, Render, Supabase를 활용한 실제 배포 및 운영 경험 확보

## 주요 기능

### 게시판

- 카테고리별 게시판과 전체 게시글 목록
- 최신순, 인기순, 조회순 정렬
- HOT 게시글 표시
- 검색, 이미지 포함 게시글 필터링
- 페이지네이션

### 글과 댓글

- 익명 글 작성
- 댓글 및 대댓글 작성
- 작성자 비밀번호 기반 수정/삭제
- 삭제된 부모 댓글이 있어도 대댓글 흐름을 유지하는 placeholder 처리
- 이미지 첨부, 원본 이미지 최적화, 썸네일 생성

### 신고와 관리자 기능

- 게시글/댓글 신고
- 관리자 로그인/로그아웃/세션 확인
- 신고 목록 확인
- 게시글/댓글 숨김 처리
- 사용자 차단 관리
- 관리자 작업 로그
- 관리자 비밀번호 변경

### 보안

- 글 작성, 댓글 작성, 수정 요청에 CAPTCHA 적용
- CAPTCHA token 재사용 방지
- 이미지 삭제 token 보호
- 작성자 비밀번호 실패 횟수 제한
- 관리자 세션 cookie와 CSRF token 보호
- Next.js API proxy에서 위험한 forwarded header 제거
- 운영 secret은 환경변수로 분리

## 기술 스택

### Frontend

- Next.js 16
- React 19
- TypeScript
- Vercel

### Backend

- NestJS 11
- Prisma ORM
- PostgreSQL on Supabase
- Supabase Storage
- Sharp image processing
- Render

## 시스템 구조

```text
Browser
  |
  | HTTPS
  v
Vercel / Next.js
  |
  | /api/* proxy
  v
Render / NestJS API
  |
  +-- Supabase PostgreSQL
  |
  +-- Supabase Storage
```

프론트엔드는 Next.js API route를 proxy로 사용합니다. 브라우저가 백엔드 서버를 직접 호출하지 않고 `/api/*` 경로를 통해 요청하도록 구성했습니다. 공개 읽기 요청은 짧은 캐시를 적용하고, 글/댓글 작성 같은 변경 요청이 발생하면 관련 cache tag를 revalidate하여 최신 데이터가 빠르게 반영되도록 했습니다.

## 백엔드 구현 포인트

- Prisma schema 기반 게시판, 스레드, 댓글, 첨부파일, 신고, 관리자 세션 모델링
- 게시글/댓글 생성, 조회, 수정, 삭제 흐름 구현
- 관리자 인증, 세션 저장, CSRF 검증 구현
- 신고 처리와 차단 관리 기능 구현
- 이미지 업로드 시 Sharp를 이용해 원본 리사이징 및 썸네일 생성
- Supabase Storage 연동 및 업로드 파일 삭제 token 검증
- Health check endpoint와 GitHub Actions keep-alive workflow 구성

## 운영 및 배포

- Frontend: Vercel
- Backend: Render
- Database: Supabase PostgreSQL
- Storage: Supabase Storage
- Keep-alive: GitHub Actions scheduled workflow

무료 Render 인스턴스의 cold start 문제를 줄이기 위해 `.github/workflows/keepalive.yml`에서 10분마다 백엔드 health endpoint를 호출합니다.

## 환경변수

실제 운영 secret은 GitHub에 커밋하지 않고 배포 플랫폼의 환경변수로 관리합니다.

### Backend

```env
PORT=
APP_NAME=
DATABASE_URL=
CLIENT_ORIGIN=
CAPTCHA_SECRET=
CAPTCHA_TTL_SECONDS=
UPLOAD_DELETE_SECRET=
UPLOAD_DIR=
UPLOAD_BASE_URL=
UPLOAD_MAX_FILES=
UPLOAD_MAX_FILE_SIZE_MB=
UPLOAD_MAX_WIDTH=
UPLOAD_THUMB_SIZE=
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
SUPABASE_STORAGE_BUCKET=awoo-uploads
ADMIN_USERNAME=
ADMIN_PASSWORD=
ADMIN_SESSION_TTL_SECONDS=
ADMIN_LOGIN_MAX_ATTEMPTS=
ADMIN_LOGIN_LOCK_MINUTES=
REPORT_AUTO_HIDE_THRESHOLD=
```

### Frontend

```env
NEXT_PUBLIC_API_BASE_URL=
BACKEND_API_BASE_URL=
ADMIN_PANEL_TOKEN=
NEXT_PUBLIC_SITE_URL=
```

`SUPABASE_SERVICE_ROLE_KEY`, 관리자 비밀번호, CAPTCHA secret, upload delete secret은 프론트엔드에 노출하면 안 됩니다.

## 로컬 실행

### Backend

```bash
cd backend
npm install
npm run prisma:generate
npm run prisma:migrate
npm run db:boards
npm run start:dev
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

기본 로컬 주소:

- Frontend: http://localhost:3000
- Backend: http://localhost:4000/api

## 검증

```bash
cd frontend
npm run lint
npm run build

cd ../backend
npm run lint
npm run build
```

## 트러블슈팅 및 개선 경험

- 프론트엔드/백엔드 분리 배포 후 CORS와 API 호출 경로를 정리하기 위해 Next.js API proxy 구조로 개선
- Render 무료 인스턴스 cold start로 첫 요청 지연이 발생해 GitHub Actions 기반 keep-alive workflow 추가
- 이미지 업로드 후 원본 용량 문제를 줄이기 위해 Sharp 기반 리사이징과 썸네일 생성 적용
- 익명 게시판에서 작성자 인증이 어려운 문제를 비밀번호 hash 기반 수정/삭제 흐름으로 해결
- 관리자 요청의 위조 가능성을 줄이기 위해 session cookie와 CSRF token 검증 적용

## 포트폴리오 요약

AWOO/KR은 Next.js, NestJS, Prisma, PostgreSQL을 사용해 구현한 익명 커뮤니티 서비스입니다. 프론트엔드와 백엔드를 분리 배포하고, Supabase PostgreSQL/Storage를 연동해 게시글, 댓글, 이미지 업로드, 신고, 관리자 운영 기능을 구현했습니다. 또한 CAPTCHA, CSRF, 비밀번호 hash, token 검증, keep-alive workflow 등 실제 운영에서 필요한 보안 및 운영 요소를 적용했습니다.
