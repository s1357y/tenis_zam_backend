const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const { testConnection, initializeDatabase } = require('./config/database');
const { expressErrorHandler } = require('./middleware/errorHandler');

// Routes import
const authRoutes = require('./routes/auth');
const scheduleRoutes = require('./routes/schedules');
const userRoutes = require('./routes/users');

const app = express();
const PORT = process.env.PORT || 3001;

// Security middleware
app.use(helmet());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15분
  max: 100, // 최대 100 요청
  message: {
    error: '너무 많은 요청이 발생했습니다. 잠시 후 다시 시도해주세요.'
  }
});
app.use(limiter);

// CORS 설정
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Tennis Zam Backend 서버가 정상적으로 작동 중입니다.',
    timestamp: new Date().toISOString()
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/schedules', scheduleRoutes);
app.use('/api/users', userRoutes);

// 404 에러 핸들링
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: '요청하신 리소스를 찾을 수 없습니다.'
  });
});

// 글로벌 에러 핸들링 (개선된 에러 핸들러 사용)
app.use(expressErrorHandler);

// 프로세스 레벨 에러 핸들링
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  
  // 에러 로깅
  if (process.env.NODE_ENV === 'production') {
    const fs = require('fs');
    const path = require('path');
    
    const logDir = path.join(__dirname, '../logs');
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }
    
    const logFile = path.join(logDir, 'uncaught-exception.log');
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] Uncaught Exception: ${error.stack}\n`;
    
    fs.appendFileSync(logFile, logEntry);
  }
  
  // PM2가 실행 중이면 재시작, 아니면 종료
  if (process.env.PM2_HOME) {
    console.log('🔄 PM2가 프로세스를 재시작합니다...');
  } else {
    console.log('💀 프로세스를 종료합니다...');
    process.exit(1);
  }
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  
  // 에러 로깅
  if (process.env.NODE_ENV === 'production') {
    const fs = require('fs');
    const path = require('path');
    
    const logDir = path.join(__dirname, '../logs');
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }
    
    const logFile = path.join(logDir, 'unhandled-rejection.log');
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] Unhandled Rejection: ${reason}\n`;
    
    fs.appendFileSync(logFile, logEntry);
  }
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM 신호를 받았습니다. 서버를 종료합니다...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('🛑 SIGINT 신호를 받았습니다. 서버를 종료합니다...');
  process.exit(0);
});

// 서버 시작
async function startServer() {
  try {
    // 로그 디렉토리 생성
    const fs = require('fs');
    const path = require('path');
    const logDir = path.join(__dirname, '../logs');
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }
    
    // 데이터베이스 연결 테스트
    await testConnection();
    
    // 데이터베이스 초기화
    await initializeDatabase();
    
    // 서버 시작
    const server = app.listen(PORT, () => {
      console.log(`🚀 Tennis Zam Backend 서버가 포트 ${PORT}에서 실행 중입니다.`);
      console.log(`🌍 환경: ${process.env.NODE_ENV || 'development'}`);
      console.log(`📊 PM2 모드: ${process.env.PM2_HOME ? '활성화' : '비활성화'}`);
    });
    
    // 서버 에러 핸들링
    server.on('error', (error) => {
      if (error.code === 'EADDRINUSE') {
        console.error(`❌ 포트 ${PORT}가 이미 사용 중입니다.`);
      } else {
        console.error('❌ 서버 에러:', error);
      }
      
      // PM2가 실행 중이면 재시작, 아니면 종료
      if (process.env.PM2_HOME) {
        console.log('🔄 PM2가 프로세스를 재시작합니다...');
      } else {
        process.exit(1);
      }
    });
    
  } catch (error) {
    console.error('❌ 서버 시작 실패:', error);
    
    // 에러 로깅
    if (process.env.NODE_ENV === 'production') {
      const fs = require('fs');
      const path = require('path');
      
      const logDir = path.join(__dirname, '../logs');
      if (!fs.existsSync(logDir)) {
        fs.mkdirSync(logDir, { recursive: true });
      }
      
      const logFile = path.join(logDir, 'startup-error.log');
      const timestamp = new Date().toISOString();
      const logEntry = `[${timestamp}] Startup Error: ${error.stack}\n`;
      
      fs.appendFileSync(logFile, logEntry);
    }
    
    // PM2가 실행 중이면 재시작, 아니면 종료
    if (process.env.PM2_HOME) {
      console.log('🔄 PM2가 프로세스를 재시작합니다...');
    } else {
      process.exit(1);
    }
  }
}

startServer();