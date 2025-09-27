# PM2 배포 가이드

## 설치 및 설정

### 1. PM2 설치
```bash
npm install -g pm2
```

### 2. 의존성 설치
```bash
npm install
```

## PM2 명령어

### 기본 명령어
```bash
# 개발 환경으로 시작
npm run pm2:dev

# 프로덕션 환경으로 시작
npm run pm2:prod

# 서버 상태 확인
npm run pm2:status

# 로그 확인
npm run pm2:logs

# 모니터링
npm run pm2:monit

# 재시작
npm run pm2:restart

# 리로드 (무중단 재시작)
npm run pm2:reload

# 중지
npm run pm2:stop

# 삭제
npm run pm2:delete
```

## 배포 프로세스

### 1. 개발 환경 배포
```bash
# 1. 코드 업데이트 후
git pull origin main

# 2. 의존성 설치
npm install

# 3. PM2로 시작
npm run pm2:dev

# 4. 상태 확인
npm run pm2:status
```

### 2. 프로덕션 환경 배포
```bash
# 1. 코드 업데이트 후
git pull origin main

# 2. 의존성 설치
npm install --production

# 3. PM2로 시작
npm run pm2:prod

# 4. 상태 확인
npm run pm2:status
```

## 에러 복구 기능

### 자동 재시작
- **메모리 초과**: 1GB 초과시 자동 재시작
- **크래시 감지**: 프로세스 크래시시 자동 재시작
- **최대 재시작**: 10회까지 자동 재시작 시도
- **최소 실행 시간**: 10초 이상 실행되어야 재시작 카운트 리셋

### 에러 로깅
- **에러 로그**: `logs/error.log`
- **애플리케이션 로그**: `logs/out.log`
- **통합 로그**: `logs/combined.log`
- **특수 에러 로그**:
  - `logs/uncaught-exception.log`
  - `logs/unhandled-rejection.log`
  - `logs/startup-error.log`
  - `logs/application-error.log`

### 클러스터 모드
- **CPU 코어 수만큼 인스턴스 생성**
- **로드 밸런싱 자동 처리**
- **무중단 재시작 지원**

## 모니터링

### 실시간 모니터링
```bash
npm run pm2:monit
```

### 로그 실시간 확인
```bash
npm run pm2:logs
```

### 상태 확인
```bash
npm run pm2:status
```

## 환경 변수

### 개발 환경
```bash
NODE_ENV=development
PORT=3001
```

### 프로덕션 환경
```bash
NODE_ENV=production
PORT=3001
```

## 문제 해결

### 1. 포트 충돌
```bash
# 포트 사용 중인 프로세스 확인
lsof -i :3001

# 프로세스 종료
kill -9 <PID>
```

### 2. 메모리 부족
```bash
# 메모리 사용량 확인
npm run pm2:monit

# 메모리 제한 조정 (ecosystem.config.js)
max_memory_restart: '2G'
```

### 3. 로그 파일 크기 관리
```bash
# 로그 파일 정리
pm2 flush

# 로그 로테이션 설정 (ecosystem.config.js)
log_rotate: true
max_log_size: '10M'
```

## 보안 설정

### 1. 환경 변수 보호
- `.env` 파일을 `.gitignore`에 추가
- 프로덕션에서는 환경 변수로 직접 설정

### 2. 방화벽 설정
```bash
# 포트 3001만 열기
sudo ufw allow 3001
```

### 3. SSL 인증서 (선택사항)
```bash
# Let's Encrypt 인증서 설치
sudo certbot --nginx -d yourdomain.com
```

## 백업 및 복구

### 1. PM2 설정 백업
```bash
pm2 save
```

### 2. 자동 시작 설정
```bash
pm2 startup
pm2 save
```

### 3. 데이터베이스 백업
```bash
# MySQL 백업
mysqldump -u username -p database_name > backup.sql

# 복원
mysql -u username -p database_name < backup.sql
```

## 성능 최적화

### 1. 클러스터 모드
- CPU 코어 수만큼 인스턴스 생성
- 자동 로드 밸런싱

### 2. 메모리 관리
- 1GB 메모리 제한
- 자동 재시작

### 3. 로그 관리
- 로그 로테이션
- 파일 크기 제한

## 알림 설정 (선택사항)

### 1. 이메일 알림
```bash
# PM2 모듈 설치
pm2 install pm2-mail

# 설정
pm2 set pm2-mail:mail true
pm2 set pm2-mail:from "alerts@yourdomain.com"
pm2 set pm2-mail:to "admin@yourdomain.com"
```

### 2. 슬랙 알림
```bash
# PM2 모듈 설치
pm2 install pm2-slack

# 설정
pm2 set pm2-slack:webhook "https://hooks.slack.com/..."
```

이 가이드를 따라하면 안정적이고 자동 복구 가능한 서버를 구축할 수 있습니다.
