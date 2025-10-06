# Tennis Zam Backend

잠중 테니스 캘린더 플랫폼의 백엔드 서버입니다.

## 🚀 기능

### 인증 시스템
- 이름과 전화번호를 통한 회원가입
- 전화번호 기반 로그인
- JWT 토큰 기반 인증
- 자동 승인 기능 (환경 변수로 제어)
- 첫 번째 사용자는 자동으로 관리자 권한 부여

### 일정 관리
- 일정 생성, 조회, 수정, 삭제
- 날짜, 시간, 장소, 내용 포함
- 월별/년별 일정 필터링
- 참여자 수 및 확정 참여자 수 표시

### 참여 관리
- 개인별 참여 상태 설정 (참여/불참/미정)
- 관리자의 다른 사용자 참여 상태 관리
- 내 참여 일정 조회

### 관리자 기능
- 사용자 승인/승인 취소
- 사용자 삭제
- 모든 일정 관리 권한
- 다른 사용자 참여 상태 관리

## 📋 사전 요구사항

- Node.js 16 이상
- MySQL 8.0 이상
- npm 또는 yarn

## 🛠 설치 및 실행

### 1. 의존성 설치
```bash
npm install
```

### 2. 환경 변수 설정
`.env.example` 파일을 복사하여 `.env` 파일을 생성하고 설정값을 입력하세요.

```bash
cp .env.example .env
```

### 3. MySQL 데이터베이스 생성
```sql
CREATE DATABASE tenis_zam CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 4. 서버 실행
```bash
# 개발 모드
npm run dev

# 프로덕션 모드
npm start
```

서버는 기본적으로 포트 3001에서 실행됩니다.

## 📊 데이터베이스 스키마

### users 테이블
```sql
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  phone VARCHAR(20) NOT NULL UNIQUE,
  is_approved BOOLEAN DEFAULT FALSE,
  is_admin BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### schedules 테이블
```sql
CREATE TABLE schedules (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  location VARCHAR(500),
  location_detail TEXT,
  created_by INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES users(id)
);
```

### schedule_participants 테이블
```sql
CREATE TABLE schedule_participants (
  id INT AUTO_INCREMENT PRIMARY KEY,
  schedule_id INT NOT NULL,
  user_id INT NOT NULL,
  status ENUM('참여', '불참', '미정') DEFAULT '미정',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY unique_participation (schedule_id, user_id),
  FOREIGN KEY (schedule_id) REFERENCES schedules(id),
  FOREIGN KEY (user_id) REFERENCES users(id)
);
```

## 🌐 API 엔드포인트

### 인증 (Auth)
- `POST /api/auth/register` - 회원가입
- `POST /api/auth/login` - 로그인
- `GET /api/auth/me` - 내 정보 조회

### 사용자 관리 (Users) - 관리자 전용
- `GET /api/users` - 모든 사용자 조회
- `GET /api/users/pending` - 승인 대기 사용자 조회
- `PATCH /api/users/:userId/approve` - 사용자 승인
- `PATCH /api/users/:userId/revoke` - 승인 취소
- `DELETE /api/users/:userId` - 사용자 삭제

### 일정 관리 (Schedules)
- `GET /api/schedules` - 일정 목록 조회
- `GET /api/schedules/:scheduleId` - 일정 상세 조회
- `POST /api/schedules` - 일정 생성
- `PUT /api/schedules/:scheduleId` - 일정 수정
- `DELETE /api/schedules/:scheduleId` - 일정 삭제

### 참여 관리
- `POST /api/schedules/:scheduleId/participate` - 내 참여 상태 설정
- `POST /api/schedules/:scheduleId/participate/:userId` - 다른 사용자 참여 상태 설정 (관리자)
- `GET /api/schedules/my-participations` - 내 참여 일정 조회

## 🔧 환경 변수

| 변수명 | 설명 | 기본값 |
|--------|------|--------|
| PORT | 서버 포트 | 3001 |
| NODE_ENV | 실행 환경 | development |
| DB_HOST | MySQL 호스트 | localhost |
| DB_PORT | MySQL 포트 | 3306 |
| DB_NAME | 데이터베이스 이름 | tenis_zam |
| DB_USER | MySQL 사용자 | root |
| DB_PASSWORD | MySQL 비밀번호 | |
| JWT_SECRET | JWT 시크릿 키 | |
| JWT_EXPIRES_IN | JWT 만료 시간 | 7d |
| FRONTEND_URL | 프론트엔드 URL | http://localhost:3000 |
| AUTO_APPROVE_USERS | 자동 승인 여부 | true |

## 📝 주요 특징

1. **자동 승인 시스템**: `AUTO_APPROVE_USERS` 환경변수로 제어
2. **첫 번째 사용자**: 자동으로 관리자 권한 부여
3. **보안**: Helmet, Rate Limiting, CORS 적용
4. **입력 검증**: express-validator를 통한 데이터 검증
5. **에러 처리**: 글로벌 에러 핸들링
6. **데이터베이스**: 자동 테이블 생성 및 연결 관리

## 🧪 테스트

```bash
npm test
```

## 📄 라이선스

MIT License