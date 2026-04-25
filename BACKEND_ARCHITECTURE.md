# 백엔드 구조 설계

## 1. 현재 프론트 기준 서비스 성격

현재 폴더의 HTML을 보면 사이트는 아래 흐름을 가진 **익명 게시판형 커뮤니티**입니다.

- `index.html`: 메인, 게시판 목록, 최근 스레드, 검색 진입
- `board.html`: 게시판별 스레드 목록, 정렬, 페이지네이션
- `thread.html`: 본문, 댓글, 대댓글 느낌의 답글, 추천, 신고, 이미지 첨부
- `write.html`: 새 글 작성, 이미지 업로드, 옵션(sage, spoiler 등), CAPTCHA

즉 백엔드는 단순 CMS가 아니라 다음이 핵심입니다.

- 게시판 관리
- 스레드/댓글 생성 및 조회
- 이미지 업로드
- 정렬/검색/페이지네이션
- 익명 사용자 식별 최소화
- 신고/관리/차단
- 트래픽 증가 시 읽기 성능 확보

---

## 2. 추천 기술 스택

### 1순위 추천

- **언어/런타임:** TypeScript + Node.js
- **프레임워크:** NestJS
- **DB:** PostgreSQL
- **캐시:** Redis
- **파일 저장소:** S3 호환 스토리지
- **ORM:** Prisma

### 이 조합을 가장 추천하는 이유

- 현재 프론트가 웹 중심이라 JS/TS 생태계와 연결이 가장 자연스럽습니다.
- 추후 정적 HTML을 React/Next 등으로 바꿔도 백엔드와 팀 기술 스택을 맞추기 쉽습니다.
- NestJS는 게시판처럼 기능이 늘어나는 서비스에서 모듈 분리가 깔끔합니다.
- Prisma + PostgreSQL 조합은 CRUD, 검색 조건, 운영 난이도 면에서 균형이 좋습니다.
- 익명 게시판은 조회 수가 많아지기 쉬워 Redis 캐시를 붙이기 좋습니다.

### 대안

- **Python + FastAPI**
  - 장점: 빠른 개발, 문서 자동화, 러닝커브 낮음
  - 단점: 팀이 프론트까지 JS 기반이면 풀스택 통일감은 조금 떨어짐
- **Go + Fiber/Echo**
  - 장점: 성능, 단일 바이너리 배포
  - 단점: 초기 개발 속도와 운영 도구 편의성은 TS보다 무거울 수 있음

### 최종 추천

**혼자 만들거나 빠르게 MVP를 만들고 점진적으로 키울 계획이면 `TypeScript + NestJS + PostgreSQL`이 가장 무난하고 강합니다.**

---

## 3. 권장 아키텍처

### 기본 구조

- Client
  - 정적 HTML 또는 이후 SPA/SSR 프론트
- API Server
  - 인증 없는 익명 요청 처리
  - 게시판/스레드/댓글/신고 API
- Worker
  - 이미지 후처리
  - 신고 처리 큐
  - 인기글 집계
- PostgreSQL
  - 서비스 원본 데이터 저장
- Redis
  - 인기글/목록 캐시
  - rate limit
  - CAPTCHA/세션성 토큰
- Object Storage
  - 업로드 이미지 저장

### 서버 분리 단계

- 1단계 MVP
  - API 서버 1개
  - PostgreSQL 1개
  - 로컬 파일 또는 S3
- 2단계 성장
  - Redis 추가
  - Worker 분리
  - CDN 추가
- 3단계 확장
  - 읽기 전용 캐시 강화
  - 검색 엔진(OpenSearch/Elasticsearch) 도입
  - 관리자 백오피스 분리

---

## 4. 백엔드 모듈 설계

NestJS 기준 추천 모듈입니다.

- `boards`
  - 게시판 목록
  - 게시판 상세
  - 게시판별 규칙/옵션
- `threads`
  - 스레드 생성/조회/목록
  - 정렬(최신, 추천, 조회수, 댓글수)
- `posts`
  - 댓글/답글 생성/조회
  - sage/spoiler 처리
- `uploads`
  - 이미지 업로드
  - 썸네일/메타데이터 생성
- `reactions`
  - 추천/비추천
- `reports`
  - 신고 접수
  - 관리자 검토 상태 관리
- `moderation`
  - 금칙어
  - 차단 IP/해시 식별자
  - 소프트 삭제/블라인드
- `search`
  - 제목/본문 검색
- `admin`
  - 게시글 숨김
  - 신고 처리
  - 게시판 생성/수정
- `common`
  - pagination
  - response format
  - logging
  - exception filter

---

## 5. 데이터 모델 초안

### 핵심 테이블

- `boards`
  - `id`
  - `slug`
  - `name`
  - `description`
  - `is_active`
  - `sort_order`

- `threads`
  - `id`
  - `board_id`
  - `title`
  - `content`
  - `author_name`
  - `author_hash`
  - `author_ip_hash`
  - `view_count`
  - `reply_count`
  - `like_count`
  - `is_pinned`
  - `is_locked`
  - `is_deleted`
  - `has_spoiler`
  - `has_nsfw`
  - `created_at`
  - `updated_at`
  - `bumped_at`

- `posts`
  - `id`
  - `thread_id`
  - `parent_post_id` nullable
  - `content`
  - `author_name`
  - `author_hash`
  - `author_ip_hash`
  - `like_count`
  - `is_sage`
  - `is_deleted`
  - `created_at`

- `attachments`
  - `id`
  - `thread_id` nullable
  - `post_id` nullable
  - `storage_key`
  - `original_name`
  - `mime_type`
  - `size`
  - `width`
  - `height`
  - `thumbnail_key`
  - `created_at`

- `reports`
  - `id`
  - `target_type` (`thread` / `post`)
  - `target_id`
  - `reason`
  - `reporter_ip_hash`
  - `status`
  - `created_at`
  - `resolved_at`

- `reactions`
  - `id`
  - `target_type`
  - `target_id`
  - `reaction_type`
  - `actor_hash`
  - `created_at`

- `captcha_tokens`
  - `id`
  - `token`
  - `answer_hash`
  - `expires_at`

### 익명 게시판에서 중요한 점

- IP 원문 저장보다 **해시 저장**을 우선 고려
- 닉네임은 선택값
- 동일 스레드 내 작성자 식별은 `author_hash` 기반으로 표시 가능
- 법적/운영상 필요하면 원문 IP는 별도 보안 정책 하에 최소 기간만 저장

---

## 6. API 설계 초안

### 게시판

- `GET /api/boards`
- `GET /api/boards/:slug`
- `GET /api/boards/:slug/threads?sort=latest&page=1`

### 스레드

- `POST /api/threads`
- `GET /api/threads/:id`
- `POST /api/threads/:id/view`
- `POST /api/threads/:id/reactions`
- `POST /api/threads/:id/report`

### 댓글

- `GET /api/threads/:id/posts?page=1`
- `POST /api/threads/:id/posts`
- `POST /api/posts/:id/reactions`
- `POST /api/posts/:id/report`

### 업로드

- `POST /api/uploads/image`
- `DELETE /api/uploads/:id`

### 검색

- `GET /api/search?q=...&board=game&page=1`

### 관리자

- `POST /api/admin/threads/:id/hide`
- `POST /api/admin/posts/:id/hide`
- `POST /api/admin/reports/:id/resolve`

---

## 7. 요청 흐름 예시

### 글 작성

1. 클라이언트가 CAPTCHA 토큰 발급
2. 이미지가 있으면 업로드 API 호출
3. `POST /api/threads`로 제목/본문/옵션/첨부 ID 전송
4. 서버가 금칙어, rate limit, CAPTCHA 검증
5. DB 저장
6. 게시판 캐시 무효화
7. 생성된 스레드 ID 반환

### 댓글 작성

1. `POST /api/threads/:id/posts`
2. 서버가 thread 잠금 여부 확인
3. 저장 후 `reply_count`, `bumped_at` 갱신
4. 단 `sage=true`면 `bumped_at` 갱신 안 함

---

## 8. 게시판 서비스에서 꼭 넣어야 할 운영 기능

- rate limiting
  - 글쓰기/댓글쓰기/신고/추천 남용 방지
- CAPTCHA
  - 봇 도배 차단
- 금칙어/URL 필터
  - 스팸 차단
- soft delete
  - 즉시 삭제보다 복구 가능하게
- audit log
  - 관리자 조치 추적
- image validation
  - MIME, 확장자, 크기, EXIF 제거
- pagination cursor 또는 offset
  - 초기엔 offset, 이후 대규모면 cursor 검토

---

## 9. 검색/정렬 전략

### 초반

- PostgreSQL `ILIKE` + index
- 정렬 기준
  - `latest`: `created_at DESC`
  - `bump`: `bumped_at DESC`
  - `popular`: `like_count DESC, reply_count DESC`
  - `views`: `view_count DESC`

### 규모 커질 때

- 제목/본문 전문 검색
  - PostgreSQL Full Text Search
- 더 커지면
  - OpenSearch/Elasticsearch 도입

---

## 10. 보안/운영 설계

### 필수

- DTO validation
- HTML sanitize 또는 마크업 화이트리스트
- XSS 방지
- 업로드 파일 검사
- CORS 정책 명확화
- 환경변수 분리
- 관리자 API 별도 보호

### 익명 커뮤니티 특화

- 동일인 추적은 최소화하되 운영상 필요한 수준의 해시 식별자 유지
- 신고 누적 임계치 넘으면 자동 블라인드 가능
- 프록시/IP 우회 고려한 rate limit 설계

---

## 11. 폴더 구조 예시

```txt
backend/
  src/
    main.ts
    app.module.ts
    common/
    config/
    modules/
      boards/
      threads/
      posts/
      uploads/
      reactions/
      reports/
      moderation/
      search/
      admin/
    infra/
      prisma/
      redis/
      storage/
      queue/
  prisma/
    schema.prisma
  test/
```

---

## 12. 개발 순서 추천

### 1차 MVP

- 게시판 목록 조회
- 게시판별 글 목록
- 글 작성
- 글 상세 조회
- 댓글 작성
- 이미지 1장 업로드
- 신고

### 2차

- 추천/비추천
- 검색
- 관리자 페이지
- 금칙어
- Redis 캐시

### 3차

- 대댓글 UX 강화
- 인기글 집계
- 알림
- 검색 엔진 분리

---

## 13. 언어 선택 결론

### TypeScript + NestJS를 추천하는 경우

- 프론트와 언어를 통일하고 싶다
- 유지보수 가능한 구조가 중요하다
- 게시판 기능이 계속 늘어날 가능성이 크다
- 혼자서도 빠르게 만들고 싶다

### Python + FastAPI를 추천하는 경우

- 가장 빠르게 API를 만들고 싶다
- 구조보다 개발 속도를 우선한다
- 팀이 Python에 익숙하다

### Go를 추천하는 경우

- 높은 동시성/성능이 가장 중요하다
- 백엔드 경험이 충분하고 초반 생산성 저하를 감수할 수 있다

### 최종 한 줄 추천

**이 프로젝트는 `TypeScript + NestJS + PostgreSQL + Redis`로 시작하는 것이 가장 균형 좋습니다.**

---

## 14. 다음 단계

원하면 다음 중 바로 이어서 만들 수 있습니다.

1. NestJS 기준으로 실제 `backend/` 폴더를 바로 생성
2. DB 스키마(`Prisma schema`)부터 작성
3. API 명세서를 Swagger 기준으로 구체화
4. 현재 HTML이 붙을 수 있게 API 연동 포인트까지 정리
