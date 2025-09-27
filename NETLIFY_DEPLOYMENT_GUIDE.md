# Netlify 배포 가이드

이 가이드는 Tennis Zam 백엔드를 Netlify Functions로 배포하는 방법을 설명합니다.

## 📋 사전 준비사항

1. **Netlify 계정**: [netlify.com](https://netlify.com)에서 계정 생성
2. **GitHub 저장소**: 코드가 GitHub에 푸시되어 있어야 함
3. **데이터베이스**: MySQL 데이터베이스 (PlanetScale, Railway, 또는 다른 클라우드 서비스)

## 🚀 배포 단계

### 1. GitHub에 코드 푸시

```bash
# Git 초기화 (아직 안 했다면)
git init
git add .
git commit -m "Initial commit with Netlify configuration"

# GitHub 저장소 연결
git remote add origin https://github.com/your-username/tenis-zam-backend.git
git push -u origin main
```

### 2. Netlify에서 새 사이트 생성

1. [Netlify 대시보드](https://app.netlify.com)에 로그인
2. "New site from Git" 클릭
3. GitHub 선택 후 저장소 연결
4. 빌드 설정:
   - **Build command**: `npm install`
   - **Publish directory**: `.` (루트 디렉토리)
   - **Functions directory**: `netlify/functions`

### 3. 환경 변수 설정

Netlify 대시보드에서 Site settings > Environment variables에 다음 변수들을 추가:

#### 필수 환경 변수
```
DB_HOST=your_database_host
DB_PORT=3306
DB_USER=your_database_username
DB_PASSWORD=your_database_password
DB_NAME=tenis_zam
JWT_SECRET=your_super_secret_jwt_key_here
NODE_ENV=production
FRONTEND_URL=https://your-frontend-domain.netlify.app
```

#### 선택적 환경 변수
```
JWT_EXPIRES_IN=7d
BCRYPT_ROUNDS=12
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=200
LOG_LEVEL=info
```

### 4. 데이터베이스 설정

#### PlanetScale 사용 시 (권장)
1. [PlanetScale](https://planetscale.com)에서 계정 생성
2. 새 데이터베이스 생성
3. 연결 정보를 Netlify 환경 변수에 설정

#### Railway 사용 시
1. [Railway](https://railway.app)에서 MySQL 서비스 생성
2. 연결 정보를 Netlify 환경 변수에 설정

### 5. 배포 확인

1. Netlify에서 "Deploy site" 클릭
2. 배포 완료 후 Functions 탭에서 `server` 함수 확인
3. 다음 URL로 테스트:
   - `https://your-site-name.netlify.app/health`
   - `https://your-site-name.netlify.app/api/auth/test`

## 🔧 로컬 개발 설정

### Netlify CLI 설치 및 사용

```bash
# Netlify CLI 설치
npm install -g netlify-cli

# 로컬에서 Netlify Functions 실행
netlify dev

# 또는 npm 스크립트 사용
npm run netlify:dev
```

### 로컬 환경 변수 설정

```bash
# .env 파일 생성 (env.example 참고)
cp env.example .env

# .env 파일 편집
nano .env
```

## 📊 모니터링 및 로그

### Netlify Functions 로그 확인
1. Netlify 대시보드 > Functions 탭
2. `server` 함수 클릭
3. Logs 탭에서 실시간 로그 확인

### 성능 모니터링
- Netlify Analytics 사용
- Functions 실행 시간 및 메모리 사용량 모니터링

## 🚨 문제 해결

### 일반적인 문제들

#### 1. CORS 에러
```javascript
// netlify/functions/server.js에서 CORS 설정 확인
app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true
}));
```

#### 2. 데이터베이스 연결 실패
- 환경 변수 확인
- 데이터베이스 서비스 상태 확인
- 연결 문자열 형식 확인

#### 3. Functions 타임아웃
- `netlify.toml`에서 타임아웃 설정 조정
- 데이터베이스 쿼리 최적화

#### 4. 메모리 부족
- Functions 메모리 사용량 최적화
- 불필요한 의존성 제거

### 디버깅 팁

1. **로컬 테스트**: `netlify dev`로 로컬에서 Functions 테스트
2. **환경 변수 확인**: Netlify 대시보드에서 설정 확인
3. **로그 분석**: Functions 로그에서 에러 메시지 확인
4. **단계별 테스트**: 각 API 엔드포인트를 개별적으로 테스트

## 🔄 CI/CD 설정

### 자동 배포 설정
1. Netlify에서 "Deploy settings" 확인
2. GitHub 브랜치 연결 설정
3. 자동 배포 활성화

### 배포 전 체크리스트
- [ ] 환경 변수 설정 완료
- [ ] 데이터베이스 연결 테스트
- [ ] API 엔드포인트 테스트
- [ ] CORS 설정 확인
- [ ] 보안 설정 검토

## 📈 성능 최적화

### Cold Start 최적화
- 데이터베이스 연결 풀링
- 불필요한 의존성 제거
- Functions 코드 최적화

### 메모리 사용량 최적화
- 이미지 및 파일 처리 최적화
- 메모리 누수 방지
- 정기적인 가비지 컬렉션

## 🔐 보안 고려사항

1. **환경 변수 보안**: 민감한 정보는 Netlify 환경 변수에만 저장
2. **CORS 설정**: 허용된 도메인만 접근 가능하도록 설정
3. **Rate Limiting**: API 남용 방지
4. **JWT 보안**: 강력한 시크릿 키 사용
5. **HTTPS**: Netlify에서 자동으로 HTTPS 제공

## 📞 지원

문제가 발생하면 다음을 확인하세요:
1. [Netlify 문서](https://docs.netlify.com)
2. [Netlify Functions 문서](https://docs.netlify.com/functions/overview/)
3. 프로젝트 Issues 탭에서 이슈 등록

---

**참고**: 이 가이드는 Tennis Zam 백엔드 프로젝트를 위한 것입니다. 다른 프로젝트에 적용할 때는 설정을 조정해야 할 수 있습니다.
