# AWOO/KR API 명세

AWOO/KR 백엔드는 NestJS를 사용하고, 모든 API는 `main.ts`에서 설정한 global prefix에 따라 `/api` 아래에 위치합니다.

## Health

| Method | Path | 설명 |
| --- | --- | --- |
| GET | `/api/health` | 백엔드 상태 확인 |

## Boards

| Method | Path | 설명 |
| --- | --- | --- |
| GET | `/api/boards` | 게시판 목록 조회 |
| GET | `/api/boards/recent/threads` | 최근 스레드 목록 조회 |
| GET | `/api/boards/:slug` | 게시판 상세 조회 |
| GET | `/api/boards/:slug/threads` | 게시판별 스레드 목록 조회 |

### 게시판 스레드 조회 query 예시

| Query | 설명 |
| --- | --- |
| `sort` | `latest`, `popular`, `views` |
| `page` | 페이지 번호 |
| `limit` | 페이지 크기 |
| `q` | 검색어 |
| `media` | 이미지 포함 필터 |

## Threads

| Method | Path | 설명 |
| --- | --- | --- |
| POST | `/api/threads` | 스레드 생성 |
| GET | `/api/threads/:id` | 스레드 상세 조회 |
| POST | `/api/threads/:id/view` | 스레드 조회수 증가 |
| PATCH | `/api/threads/:id` | 스레드 수정 |
| DELETE | `/api/threads/:id` | 스레드 삭제 |

### 스레드 생성 body 예시

```json
{
  "boardSlug": "tech",
  "title": "제목",
  "content": "내용",
  "authorName": "익명",
  "email": "",
  "isSage": false,
  "hasSpoiler": false,
  "hasNsfw": false,
  "attachmentIds": [1],
  "attachmentDeleteTokens": ["token"],
  "editPassword": "password",
  "captchaToken": "captcha-token",
  "captchaAnswer": "ABCDE"
}
```

### 스레드 수정 body 예시

```json
{
  "title": "수정 제목",
  "content": "수정 내용",
  "editPassword": "password",
  "captchaToken": "captcha-token",
  "captchaAnswer": "ABCDE"
}
```

### 스레드 삭제 body 예시

```json
{
  "editPassword": "password"
}
```

## Posts

| Method | Path | 설명 |
| --- | --- | --- |
| GET | `/api/threads/:id/posts` | 댓글 목록 조회 |
| POST | `/api/threads/:id/posts` | 댓글/대댓글 생성 |
| PATCH | `/api/threads/:id/posts/:postId` | 댓글 수정 |
| DELETE | `/api/threads/:id/posts/:postId` | 댓글 삭제 |

### 댓글 생성 body 예시

```json
{
  "content": "댓글 내용",
  "authorName": "익명",
  "email": "",
  "parentPostId": null,
  "editPassword": "password",
  "isSage": false,
  "attachmentIds": [],
  "attachmentDeleteTokens": [],
  "captchaToken": "captcha-token",
  "captchaAnswer": "ABCDE"
}
```

## Uploads

| Method | Path | 설명 |
| --- | --- | --- |
| POST | `/api/uploads/images` | 이미지 업로드 |
| DELETE | `/api/uploads/:id` | 업로드 이미지 삭제 |

### 이미지 삭제 body 예시

```json
{
  "deleteToken": "upload-delete-token"
}
```

## Reactions

| Method | Path | 설명 |
| --- | --- | --- |
| POST | `/api/threads/:id/reactions` | 스레드 추천/비추천 |
| POST | `/api/posts/:id/reactions` | 댓글 추천/비추천 |

### reaction body 예시

```json
{
  "reactionType": "like"
}
```

## Reports

| Method | Path | 설명 |
| --- | --- | --- |
| POST | `/api/threads/:id/report` | 스레드 신고 |
| POST | `/api/posts/:id/report` | 댓글 신고 |

### report body 예시

```json
{
  "targetType": "thread",
  "reason": "신고 사유"
}
```

## Admin

관리자 API는 관리자 세션과 CSRF token이 필요한 요청이 포함됩니다.

| Method | Path | 설명 |
| --- | --- | --- |
| POST | `/api/admin/login` | 관리자 로그인 |
| POST | `/api/admin/logout` | 관리자 로그아웃 |
| GET | `/api/admin/me` | 현재 관리자 세션 확인 |
| GET | `/api/admin/summary` | 관리자 요약 정보 조회 |
| GET | `/api/admin/logs` | 관리자 작업 로그 조회 |
| GET | `/api/admin/bans` | 차단 목록 조회 |
| POST | `/api/admin/bans` | 차단 생성 |
| POST | `/api/admin/bans/:id/revoke` | 차단 해제 |
| POST | `/api/admin/password` | 관리자 비밀번호 변경 |
| GET | `/api/admin/reports` | 신고 목록 조회 |
| POST | `/api/admin/threads/:id/hide` | 스레드 숨김 |
| POST | `/api/admin/posts/:id/hide` | 댓글 숨김 |
| POST | `/api/admin/reports/:id/resolve` | 신고 처리 |

### 관리자 로그인 body 예시

```json
{
  "username": "admin",
  "password": "password"
}
```

## 공통 메모

- 요청 body는 DTO와 `ValidationPipe`를 통해 검증합니다.
- 운영 환경에서는 `CLIENT_ORIGIN`을 설정해야 CORS가 정상 동작합니다.
- 이미지 업로드는 운영 환경에서 Supabase Storage 설정이 필요합니다.
- 관리자 변경 요청은 session cookie와 CSRF token 검증을 함께 사용합니다.
