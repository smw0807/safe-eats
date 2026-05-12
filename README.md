# SafeEats

식품의약품안전처 식품 리콜 정보를 실시간으로 모니터링하고 알림을 발송하는 서비스입니다.

## 주요 기능

- 식약처 MFDS API를 6시간 주기로 폴링하여 신규 리콜 정보 수집
- 리콜 목록 검색 및 상세 정보 조회
- 신규 리콜 발생 시 활성화된 채널(이메일, 웹 푸시)로 알림 발송
- 알림 채널별 ON/OFF 및 테스트 발송

## 기술 스택

| 영역 | 기술 |
|------|------|
| 모노레포 | Turborepo + pnpm Workspaces |
| API 서버 | NestJS 11, TypeScript |
| 웹 클라이언트 | Next.js 15 (App Router), Tailwind CSS |
| 메시지 큐 | RabbitMQ (amqplib) |
| 데이터베이스 | PostgreSQL (Supabase), Prisma ORM |
| 인증 | JWT (passport-jwt) |
| 알림 | nodemailer (이메일), web-push (웹 푸시) |
| CI/CD | GitHub Actions, Docker, DockerHub |

## 프로젝트 구조

```
safe-eats/
├── apps/
│   ├── api/          # NestJS REST API + 스케줄러
│   ├── consumer/     # RabbitMQ 이벤트 컨슈머 (이메일, 푸시, 카카오)
│   └── web/          # Next.js 웹 클라이언트
├── packages/
│   ├── database/     # Prisma 스키마 및 클라이언트
│   ├── dto/          # 공유 DTO 타입
│   └── config/       # 공유 설정
├── docker-compose.yml        # 로컬 개발용
└── docker-compose.prod.yml   # 프로덕션 배포용
```

## 아키텍처

```
[MFDS API]
    │ 6시간 주기 폴링
    ▼
[API 서버] ──── 신규 리콜 ────▶ [RabbitMQ]
    │                               │
    │                    ┌──────────┼──────────┐
    │                    ▼          ▼          ▼
    │             recall.email  recall.push  recall.kakao
    │                    │          │          │
    │                    └──────────┴──────────┘
    │                               │
    │                         [Consumer]
    │                        (이메일 / 웹 푸시 / 카카오)
    ▼
[PostgreSQL]
```

## 시작하기

### 사전 요구사항

- Node.js 20+
- pnpm 9+
- Docker & Docker Compose

### 설치

```bash
git clone https://github.com/smw0807/safe-eats.git
cd safe-eats
pnpm install
```

### 환경변수 설정

각 앱의 `.env.example`을 복사하여 `.env`를 생성합니다.

```bash
cp apps/api/.env.example apps/api/.env
cp apps/consumer/.env.example apps/consumer/.env
cp apps/web/.env.example apps/web/.env
```

**apps/api/.env**

```env
DATABASE_URL=postgresql://user:password@localhost:5432/safeeats
RABBITMQ_URL=amqp://guest:guest@localhost:5672
JWT_SECRET=your-jwt-secret
MFDS_API_KEY=your-mfds-api-key
SMTP_HOST=smtp.gmail.com
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
VAPID_PUBLIC_KEY=your-vapid-public-key
VAPID_PRIVATE_KEY=your-vapid-private-key
KAKAO_API_KEY=your-kakao-api-key
FRONTEND_URL=http://localhost:3000
PORT=3001
NODE_ENV=development
```

**apps/consumer/.env**

```env
DATABASE_URL=postgresql://user:password@localhost:5432/safeeats
RABBITMQ_URL=amqp://guest:guest@localhost:5672
SMTP_HOST=smtp.gmail.com
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
VAPID_PUBLIC_KEY=your-vapid-public-key
VAPID_PRIVATE_KEY=your-vapid-private-key
NODE_ENV=development
```

**apps/web/.env**

```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api
NEXT_PUBLIC_VAPID_PUBLIC_KEY=your-vapid-public-key
```

#### VAPID 키 생성

```bash
npx web-push generate-vapid-keys
```

### RabbitMQ 실행

```bash
docker compose up rabbitmq -d
```

### 데이터베이스 마이그레이션

```bash
pnpm db:migrate
```

### 개발 서버 실행

```bash
pnpm dev
```

| 서비스 | URL |
|--------|-----|
| 웹 | http://localhost:3000 |
| API | http://localhost:3001 |
| API Swagger | http://localhost:3001/api/docs |
| RabbitMQ 관리 콘솔 | http://localhost:15672 (guest/guest) |

## 배포

### CI/CD

`main` 브랜치에 푸시하면 GitHub Actions가 자동으로 실행됩니다.

- **CI**: `apps/api`, `apps/consumer` Docker 이미지 빌드 후 DockerHub 푸시
- **CD**: self-hosted runner에서 최신 이미지 pull 및 `docker compose -f docker-compose.prod.yml up -d` 실행

### GitHub Secrets 등록 필요 항목

```
DOCKER_USERNAME / DOCKER_PASSWORD
DATABASE_URL / RABBITMQ_URL / JWT_SECRET / MFDS_API_KEY
SMTP_HOST / SMTP_USER / SMTP_PASS
VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY
KAKAO_API_KEY / FRONTEND_URL
```

### 웹 클라이언트

Next.js 웹은 Vercel 배포를 권장합니다. Vercel 프로젝트에 `apps/web/.env`의 환경변수를 동일하게 등록하세요.

## 주요 API 엔드포인트

| 메서드 | 경로 | 설명 |
|--------|------|------|
| GET | `/api/recalls` | 리콜 목록 조회 (페이지네이션, 검색) |
| GET | `/api/recalls/:id` | 리콜 상세 조회 |
| GET | `/api/notifications/settings` | 알림 설정 조회 |
| PATCH | `/api/notifications/settings` | 알림 설정 변경 |
| POST | `/api/push/subscribe` | 웹 푸시 구독 등록 |
| POST | `/api/push/test` | 웹 푸시 테스트 발송 |
| POST | `/api/email/test` | 이메일 테스트 발송 |
| POST | `/api/kakao/test` | 카카오 알림톡 테스트 발송 |

전체 API 문서: `http://localhost:3001/api/docs` (Swagger)

## 데이터베이스 스키마

```
User ──┬── NotificationSetting  (이메일/푸시/카카오 활성화 여부, 카카오 수신 번호)
       ├── PushSubscription     (웹 푸시 구독 엔드포인트)
       └── NotificationLog      (알림 발송 이력)

Recall ── NotificationLog
```
