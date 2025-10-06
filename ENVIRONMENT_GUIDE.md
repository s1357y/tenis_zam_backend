# 환경별 배포 가이드

## 환경 설정 개요

이 프로젝트는 개발(development)과 프로덕션(production) 환경을 분리하여 관리합니다.

## 환경변수 파일

- `.env` - 기본 환경변수 (로컬 개발용)
- `.env.development` - 개발 환경 전용 설정
- `.env.production` - 프로덕션 환경 전용 설정

## 실행 방법

### 1. 개발 환경 실행

```bash
# 일반 개발 서버 (nodemon 사용)
npm run dev

# 개발 환경으로 직접 실행
npm run start:dev

# PM2로 개발 환경 실행
npm run pm2:start:dev
```

### 2. 프로덕션 환경 실행

```bash
# 프로덕션 환경으로 직접 실행
npm run start:prod

# PM2로 프로덕션 환경 실행
npm run pm2:start:prod
```

### 3. PM2 관리 명령어

```bash
# 개발 환경 관리
npm run pm2:restart:dev    # 개발 환경 재시작
npm run pm2:reload:dev     # 개발 환경 리로드
npm run pm2:logs:dev       # 개발 환경 로그 확인

# 프로덕션 환경 관리
npm run pm2:restart:prod   # 프로덕션 환경 재시작
npm run pm2:reload:prod   # 프로덕션 환경 리로드
npm run pm2:logs:prod     # 프로덕션 환경 로그 확인

# 공통 관리
npm run pm2:status        # PM2 상태 확인
npm run pm2:monit        # PM2 모니터링
npm run pm2:stop         # PM2 중지
npm run pm2:delete       # PM2 프로세스 삭제
```

## 환경별 주요 차이점

### 개발 환경 (Development)
- 데이터베이스: `tenis_zam_dev`
- 로그 레벨: `debug`
- Rate Limit: 1000 requests/15분
- Trust Proxy: 비활성화
- 파일 로깅: 비활성화

### 프로덕션 환경 (Production)
- 데이터베이스: `tenis_zam_prod`
- 로그 레벨: `info`
- Rate Limit: 100 requests/15분
- Trust Proxy: 활성화
- 파일 로깅: 활성화
- SSL: 활성화
- 모니터링: 활성화

## 환경변수 설정

### 필수 환경변수
- `NODE_ENV`: 환경 (development/production)
- `PORT`: 서버 포트
- `DB_HOST`: 데이터베이스 호스트
- `DB_USER`: 데이터베이스 사용자
- `DB_NAME`: 데이터베이스 이름
- `JWT_SECRET`: JWT 시크릿 키

### 프로덕션 환경 추가 필수 변수
- `DB_PASSWORD`: 데이터베이스 비밀번호
- `FRONTEND_URL`: 프론트엔드 URL
- `JWT_SECRET`: 강력한 시크릿 키 (기본값 사용 금지)

## 배포 시 주의사항

1. **프로덕션 환경변수 설정**: `.env.production` 파일의 모든 값을 실제 환경에 맞게 수정
2. **JWT 시크릿 키**: 프로덕션에서는 강력한 시크릿 키 사용 필수
3. **데이터베이스**: 프로덕션용 데이터베이스 설정 확인
4. **SSL 인증서**: 프로덕션 환경에서 SSL 인증서 경로 설정
5. **보안 설정**: 프로덕션에서는 모든 보안 설정 활성화

## 문제 해결

### 환경변수 로딩 실패
- 환경변수 파일이 올바른 위치에 있는지 확인
- 파일 권한 확인
- 환경변수 파일 형식 확인 (공백, 따옴표 등)

### 데이터베이스 연결 실패
- 데이터베이스 서버 상태 확인
- 환경변수 값 확인
- 방화벽 설정 확인

### PM2 실행 실패
- PM2 설치 확인: `npm install -g pm2`
- 포트 충돌 확인
- 로그 파일 확인: `npm run pm2:logs`