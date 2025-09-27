# Tennis Zam Backend

테니스 일정 관리 플랫폼의 백엔드 API 서버입니다.

## 🚀 주요 기능

- **사용자 인증**: JWT 기반 인증 시스템
- **일정 관리**: 테니스 일정 생성, 수정, 삭제
- **사용자 관리**: 사용자 프로필 및 권한 관리
- **보안**: Rate limiting, CORS, Helmet 보안 미들웨어
- **로깅**: 구조화된 로깅 시스템

## 🛠 기술 스택

- **Node.js**: JavaScript 런타임
- **Express.js**: 웹 프레임워크
- **MySQL**: 데이터베이스
- **JWT**: 인증 토큰
- **bcryptjs**: 비밀번호 해싱
- **PM2**: 프로세스 관리
- **Netlify Functions**: 서버리스 배포

## 📦 설치 및 실행

### 로컬 개발 환경

```bash
# 의존성 설치
npm install

# 환경 변수 설정
cp env.example .env
# .env 파일을 편집하여 실제 값으로 변경

# 개발 서버 실행
npm run dev
```

### PM2를 사용한 프로덕션 실행

```bash
# PM2로 프로덕션 실행
npm run pm2:prod

# PM2 상태 확인
npm run pm2:status

# PM2 로그 확인
npm run pm2:logs
```

### Netlify Functions로 배포

```bash
# Netlify CLI 설치 (전역)
npm install -g netlify-cli

# 로컬에서 Netlify Functions 테스트
npm run netlify:dev

# Netlify에 배포
npm run netlify:deploy
```

## 🔧 환경 변수

필수 환경 변수들을 `env.example` 파일을 참고하여 설정하세요:

```bash
# 데이터베이스 설정
DB_HOST=localhost
DB_PORT=3306
DB_USER=your_username
DB_PASSWORD=your_password
DB_NAME=tenis_zam

# JWT 설정
JWT_SECRET=your_super_secret_jwt_key_here
JWT_EXPIRES_IN=7d

# 서버 설정
PORT=3001
NODE_ENV=production
FRONTEND_URL=https://your-frontend-domain.netlify.app
```

## 📚 API 문서

### 인증 API

- `POST /api/auth/register` - 사용자 회원가입
- `POST /api/auth/login` - 사용자 로그인
- `POST /api/auth/logout` - 사용자 로그아웃
- `GET /api/auth/me` - 현재 사용자 정보 조회

### 일정 API

- `GET /api/schedules` - 일정 목록 조회
- `POST /api/schedules` - 새 일정 생성
- `GET /api/schedules/:id` - 특정 일정 조회
- `PUT /api/schedules/:id` - 일정 수정
- `DELETE /api/schedules/:id` - 일정 삭제

### 사용자 API

- `GET /api/users` - 사용자 목록 조회 (관리자)
- `GET /api/users/:id` - 특정 사용자 조회
- `PUT /api/users/:id` - 사용자 정보 수정
- `DELETE /api/users/:id` - 사용자 삭제 (관리자)

## 🏗 프로젝트 구조

```
tenis_zam_backend/
├── src/
│   ├── config/
│   │   └── database.js          # 데이터베이스 설정
│   ├── controllers/             # 컨트롤러
│   ├── middleware/
│   │   ├── auth.js              # 인증 미들웨어
│   │   └── errorHandler.js      # 에러 핸들러
│   ├── models/                  # 데이터 모델
│   ├── routes/
│   │   ├── auth.js              # 인증 라우트
│   │   ├── schedules.js         # 일정 라우트
│   │   └── users.js             # 사용자 라우트
│   ├── utils/                   # 유틸리티 함수
│   └── server.js                # 메인 서버 파일
├── netlify/
│   └── functions/
│       └── server.js            # Netlify Functions 핸들러
├── logs/                        # 로그 파일
├── ecosystem.config.js          # PM2 설정
├── netlify.toml                 # Netlify 설정
├── package.json
└── README.md
```

## 🚀 배포

### PM2 배포

```bash
# 프로덕션 환경으로 PM2 시작
npm run pm2:prod

# PM2 모니터링
npm run pm2:monit
```

### Netlify Functions 배포

자세한 배포 가이드는 [NETLIFY_DEPLOYMENT_GUIDE.md](./NETLIFY_DEPLOYMENT_GUIDE.md)를 참고하세요.

## 🧪 테스트

```bash
# 테스트 실행
npm test

# 테스트 커버리지 확인
npm run test:coverage
```

## 📊 모니터링

### 로그 확인

```bash
# PM2 로그 확인
npm run pm2:logs

# 실시간 로그 모니터링
npm run pm2:monit
```

### 헬스체크

```bash
# 서버 상태 확인
curl http://localhost:3001/health
```

## 🔒 보안

- **Rate Limiting**: API 요청 제한
- **CORS**: Cross-Origin 요청 제어
- **Helmet**: 보안 헤더 설정
- **JWT**: 안전한 인증 토큰
- **bcryptjs**: 비밀번호 해싱

## 🤝 기여하기

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 라이선스

이 프로젝트는 MIT 라이선스 하에 배포됩니다. 자세한 내용은 `LICENSE` 파일을 참고하세요.

## 📞 지원

문제가 발생하면 다음을 확인하세요:

1. [Issues](https://github.com/your-username/tenis-zam-backend/issues)에서 기존 이슈 확인
2. 새로운 이슈 생성
3. [NETLIFY_DEPLOYMENT_GUIDE.md](./NETLIFY_DEPLOYMENT_GUIDE.md) 참고

---

**Tennis Zam Team** - 테니스 일정 관리 플랫폼