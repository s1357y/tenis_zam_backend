const serverless = require('serverless-http');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const { testConnection, initializeDatabase } = require('../../src/config/database');
const { expressErrorHandler } = require('../../src/middleware/errorHandler');

// Routes import
const authRoutes = require('../../src/routes/auth');
const scheduleRoutes = require('../../src/routes/schedules');
const userRoutes = require('../../src/routes/users');

const app = express();

// Security middleware
app.use(helmet());

// Rate limiting (Netlify Functions에서는 더 관대하게 설정)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15분
  max: 200, // Netlify Functions에서는 더 높은 제한
  message: {
    error: '너무 많은 요청이 발생했습니다. 잠시 후 다시 시도해주세요.'
  }
});
app.use(limiter);

// CORS 설정 (Netlify 배포 시 더 유연하게)
app.use(cors({
  origin: function (origin, callback) {
    // Netlify Functions에서는 origin이 없을 수 있음
    const allowedOrigins = [
      process.env.FRONTEND_URL,
      'http://localhost:3000',
      'https://tenis-zam.netlify.app', // Netlify 프론트엔드 URL
      'https://tenis-zam-frontend.netlify.app' // 예상 프론트엔드 URL
    ].filter(Boolean);
    
    // origin이 없거나 허용된 origin인 경우
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('CORS 정책에 의해 차단되었습니다.'));
    }
  },
  credentials: true
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Tennis Zam Backend 서버가 Netlify Functions에서 정상적으로 작동 중입니다.',
    timestamp: new Date().toISOString(),
    environment: 'netlify-functions'
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
    message: '요청하신 리소스를 찾을 수 없습니다.',
    path: req.originalUrl
  });
});

// 글로벌 에러 핸들링
app.use(expressErrorHandler);

// Netlify Functions 핸들러
const handler = serverless(app, {
  // Netlify Functions 최적화 설정
  binary: false,
  request: (request, event, context) => {
    // Netlify Functions 컨텍스트 정보 추가
    request.netlify = {
      event,
      context
    };
  }
});

// 데이터베이스 연결 초기화 (Cold Start 최적화)
let dbInitialized = false;

const initializeDB = async () => {
  if (!dbInitialized) {
    try {
      await testConnection();
      await initializeDatabase();
      dbInitialized = true;
      console.log('✅ 데이터베이스 연결이 초기화되었습니다.');
    } catch (error) {
      console.error('❌ 데이터베이스 연결 초기화 실패:', error);
      // 에러가 발생해도 서버는 계속 실행
    }
  }
};

// Netlify Functions 핸들러 래핑
module.exports.handler = async (event, context) => {
  // 데이터베이스 초기화
  await initializeDB();
  
  // Netlify Functions 타임아웃 설정
  context.callbackWaitsForEmptyEventLoop = false;
  
  try {
    return await handler(event, context);
  } catch (error) {
    console.error('❌ Netlify Function 에러:', error);
    
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
      },
      body: JSON.stringify({
        success: false,
        message: '서버 내부 오류가 발생했습니다.',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      })
    };
  }
};
