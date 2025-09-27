const fs = require('fs');
const path = require('path');

// 에러 로깅 함수
const logError = (error, context = '') => {
  const timestamp = new Date().toISOString();
  const logDir = path.join(__dirname, '../../logs');
  
  // 로그 디렉토리 생성
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
  }
  
  const logFile = path.join(logDir, 'application-error.log');
  const logEntry = `[${timestamp}] ${context}: ${error.stack || error.message}\n`;
  
  try {
    fs.appendFileSync(logFile, logEntry);
  } catch (logError) {
    console.error('로그 파일 쓰기 실패:', logError);
  }
};

// 데이터베이스 에러 핸들러
const handleDatabaseError = (error) => {
  console.error('데이터베이스 에러:', error);
  logError(error, 'DATABASE_ERROR');
  
  // 연결 에러인 경우 재시도 로직
  if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
    console.log('🔄 데이터베이스 연결 실패. 재시도 중...');
    return {
      success: false,
      message: '데이터베이스 연결에 실패했습니다. 잠시 후 다시 시도해주세요.',
      code: 'DB_CONNECTION_ERROR'
    };
  }
  
  // 중복 키 에러
  if (error.code === 'ER_DUP_ENTRY') {
    return {
      success: false,
      message: '이미 존재하는 데이터입니다.',
      code: 'DUPLICATE_ENTRY'
    };
  }
  
  // 외래 키 제약 조건 에러
  if (error.code === 'ER_NO_REFERENCED_ROW_2') {
    return {
      success: false,
      message: '참조하는 데이터가 존재하지 않습니다.',
      code: 'FOREIGN_KEY_ERROR'
    };
  }
  
  // 일반적인 데이터베이스 에러
  return {
    success: false,
    message: '데이터베이스 작업 중 오류가 발생했습니다.',
    code: 'DATABASE_ERROR'
  };
};

// 인증 에러 핸들러
const handleAuthError = (error) => {
  console.error('인증 에러:', error);
  logError(error, 'AUTH_ERROR');
  
  if (error.name === 'JsonWebTokenError') {
    return {
      success: false,
      message: '유효하지 않은 토큰입니다.',
      code: 'INVALID_TOKEN'
    };
  }
  
  if (error.name === 'TokenExpiredError') {
    return {
      success: false,
      message: '토큰이 만료되었습니다.',
      code: 'TOKEN_EXPIRED'
    };
  }
  
  return {
    success: false,
    message: '인증에 실패했습니다.',
    code: 'AUTH_ERROR'
  };
};

// 유효성 검사 에러 핸들러
const handleValidationError = (error) => {
  console.error('유효성 검사 에러:', error);
  logError(error, 'VALIDATION_ERROR');
  
  if (error.isJoi) {
    const details = error.details.map(detail => detail.message).join(', ');
    return {
      success: false,
      message: `입력 데이터가 올바르지 않습니다: ${details}`,
      code: 'VALIDATION_ERROR'
    };
  }
  
  return {
    success: false,
    message: '입력 데이터가 올바르지 않습니다.',
    code: 'VALIDATION_ERROR'
  };
};

// 파일 업로드 에러 핸들러
const handleFileError = (error) => {
  console.error('파일 에러:', error);
  logError(error, 'FILE_ERROR');
  
  if (error.code === 'LIMIT_FILE_SIZE') {
    return {
      success: false,
      message: '파일 크기가 너무 큽니다.',
      code: 'FILE_TOO_LARGE'
    };
  }
  
  if (error.code === 'LIMIT_UNEXPECTED_FILE') {
    return {
      success: false,
      message: '예상치 못한 파일이 업로드되었습니다.',
      code: 'UNEXPECTED_FILE'
    };
  }
  
  return {
    success: false,
    message: '파일 처리 중 오류가 발생했습니다.',
    code: 'FILE_ERROR'
  };
};

// 네트워크 에러 핸들러
const handleNetworkError = (error) => {
  console.error('네트워크 에러:', error);
  logError(error, 'NETWORK_ERROR');
  
  if (error.code === 'ECONNRESET') {
    return {
      success: false,
      message: '연결이 재설정되었습니다.',
      code: 'CONNECTION_RESET'
    };
  }
  
  if (error.code === 'ETIMEDOUT') {
    return {
      success: false,
      message: '연결 시간이 초과되었습니다.',
      code: 'CONNECTION_TIMEOUT'
    };
  }
  
  return {
    success: false,
    message: '네트워크 오류가 발생했습니다.',
    code: 'NETWORK_ERROR'
  };
};

// 에러 타입별 핸들러 매핑
const errorHandlers = {
  'ER_DUP_ENTRY': handleDatabaseError,
  'ER_NO_REFERENCED_ROW_2': handleDatabaseError,
  'ECONNREFUSED': handleDatabaseError,
  'ENOTFOUND': handleDatabaseError,
  'JsonWebTokenError': handleAuthError,
  'TokenExpiredError': handleAuthError,
  'ValidationError': handleValidationError,
  'LIMIT_FILE_SIZE': handleFileError,
  'LIMIT_UNEXPECTED_FILE': handleFileError,
  'ECONNRESET': handleNetworkError,
  'ETIMEDOUT': handleNetworkError
};

// 메인 에러 핸들러
const handleError = (error) => {
  // 에러 타입 확인
  const errorType = error.code || error.name || 'UNKNOWN';
  const handler = errorHandlers[errorType];
  
  if (handler) {
    return handler(error);
  }
  
  // 기본 에러 처리
  console.error('알 수 없는 에러:', error);
  logError(error, 'UNKNOWN_ERROR');
  
  return {
    success: false,
    message: '서버 내부 오류가 발생했습니다.',
    code: 'INTERNAL_ERROR'
  };
};

// Express 미들웨어용 에러 핸들러
const expressErrorHandler = (error, req, res, next) => {
  const errorResponse = handleError(error);
  
  // HTTP 상태 코드 설정
  let statusCode = 500;
  if (errorResponse.code === 'VALIDATION_ERROR') {
    statusCode = 400;
  } else if (errorResponse.code === 'AUTH_ERROR' || errorResponse.code === 'INVALID_TOKEN' || errorResponse.code === 'TOKEN_EXPIRED') {
    statusCode = 401;
  } else if (errorResponse.code === 'DUPLICATE_ENTRY' || errorResponse.code === 'FOREIGN_KEY_ERROR') {
    statusCode = 409;
  } else if (errorResponse.code === 'FILE_TOO_LARGE' || errorResponse.code === 'UNEXPECTED_FILE') {
    statusCode = 413;
  }
  
  res.status(statusCode).json({
    ...errorResponse,
    ...(process.env.NODE_ENV === 'development' && { 
      stack: error.stack,
      originalError: error.message 
    })
  });
};

module.exports = {
  handleError,
  expressErrorHandler,
  logError,
  handleDatabaseError,
  handleAuthError,
  handleValidationError,
  handleFileError,
  handleNetworkError
};
