# AWOO/KR

익명 이미지 게시판 스타일의 커뮤니티 웹 애플리케이션입니다. 글 작성, 댓글과 대댓글, 이미지 첨부, 추천/신고, 관리자 운영 화면까지 포함해 실제 공개 운영을 가정하고 구현했습니다.

- Live demo: https://awoo-web.vercel.app
- Backend health: https://awoo-backend.onrender.com/api/health
- Repository: private, review access available on request

> Render 무료 인스턴스를 사용하므로 첫 요청은 서버가 깨어나는 동안 지연될 수 있습니다. 이를 줄이기 위해 GitHub Actions scheduled ping으로 health endpoint를 주기적으로 호출합니다.

## Highlights

- 익명 게시판 CRUD와 카테고리별 스레드 목록
- 댓글, 대댓글, 삭제된 부모 댓글 유지 처리
- 이미지 업로드, 썸네일 생성, Supabase Storage 저장
- CAPTCHA 기반 작성/수정 보호와 토큰 재사용 방지
- 추천, 신고, 숨김 처리, 차단, 운영 로그
- 관리자 로그인, 세션, CSRF 보호, 비밀번호 변경
- 목록/검색 페이지네이션과 반응형 UI
- Vercel 프론트엔드, Render 백엔드, Supabase PostgreSQL/Storage 배포

## Tech Stack

### Frontend

- Next.js 16
- React 19
- TypeScript
- Vercel deployment

### Backend

- NestJS 11
- Prisma ORM
- PostgreSQL on Supabase
- Supabase Storage
- Sharp image processing
- Render deployment

## Architecture

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

The frontend uses a Next.js API proxy so the browser does not call the backend service directly for application requests. Public read pages use short cache windows for faster page loads, and mutation requests revalidate public thread caches so newly created content appears immediately.

## Core Features

### Board

- Category board list and `/all` aggregate board
- Latest, popular, and view-based sorting
- HOT thread marking
- Numbered pagination with ellipsis
- Search and image-only filtering

### Posting

- Anonymous thread creation
- Comment and nested reply creation
- Owner password based edit/delete
- Deleted parent comments remain visible as placeholders when replies exist
- Image attachment upload with optimized original and thumbnail files

### Security

- CAPTCHA required for thread creation, comment creation, and edit flows
- CAPTCHA token reuse prevention
- Upload delete token protection
- Password failure throttling for owner actions
- Admin session and CSRF protection
- Dangerous forwarded headers removed from frontend API proxy

### Admin

- Private tokenized admin route
- Login/logout/session check
- Report queue
- Hide thread/post
- Ban management
- Operation logs
- Admin password change

## Performance And Operations

- Public board and thread reads are cached briefly on the frontend server.
- Thread and post mutations invalidate the public cache tags.
- The backend exposes `/api/health` for deployment checks and keep-alive pings.
- `.github/workflows/keepalive.yml` calls the backend health endpoint every 10 minutes to reduce Render Free cold starts.

## Local Development

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

Default local URLs:

- Frontend: http://localhost:3000
- Backend: http://localhost:4000/api

## Environment Variables

### Backend

```env
DATABASE_URL=
CLIENT_ORIGIN=
CAPTCHA_SECRET=
UPLOAD_DELETE_SECRET=
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
SUPABASE_STORAGE_BUCKET=awoo-uploads
ADMIN_PRIVATE_TOKEN=
ADMIN_SESSION_SECRET=
```

### Frontend

```env
NEXT_PUBLIC_API_BASE_URL=
BACKEND_API_BASE_URL=
NEXT_PUBLIC_ADMIN_PATH_TOKEN=
```

Never expose `SUPABASE_SERVICE_ROLE_KEY`, admin secrets, or upload secrets to the frontend.

## Deployment

- Frontend: deploy `frontend` to Vercel.
- Backend: deploy `backend` to Render.
- Database: provision Supabase PostgreSQL and run Prisma migrations.
- Storage: create a public Supabase Storage bucket named `awoo-uploads`.
- Keep-alive: enable GitHub Actions for this repository and keep `.github/workflows/keepalive.yml` active.

## Verification

```bash
cd frontend
npm run lint
npm run build

cd ../backend
npm run lint
npm run build
```

## Notes

This project is built as a portfolio-grade full-stack application rather than a static prototype. The focus is on implementing realistic community workflows, moderation tooling, image handling, and deployment operations with practical security controls.
