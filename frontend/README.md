# Frontend

정적 HTML 프로토타입을 대신하는 Next.js 프론트엔드입니다.

## 스택

- Next.js App Router
- React 19
- TypeScript
- 백엔드 API 직접 연동

## 실행

```powershell
cd C:\Users\user\Desktop\조귀현\위험웹사이트\frontend
Copy-Item .env.example .env.local
npm.cmd install
npm.cmd run dev
```

기본 주소:

- Frontend: `http://localhost:3000`
- Backend API: `http://localhost:4000/api`

## 주요 페이지

- `/`
- `/boards/[slug]`
- `/threads/[id]`
- `/write`
