module.exports = {
  apps: [
    {
      name: 'tenis-zam-backend',
      script: 'src/server.js',
      instances: 'max', // CPU 코어 수만큼 인스턴스 생성
      exec_mode: 'cluster', // 클러스터 모드
      watch: false, // 프로덕션에서는 파일 감시 비활성화
      max_memory_restart: '1G', // 메모리 사용량이 1GB 초과시 재시작
      env: {
        NODE_ENV: 'development',
        PORT: 3001
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3001
      },
      // 에러 로그 설정
      error_file: './logs/err.log',
      out_file: './logs/out.log',
      log_file: './logs/combined.log',
      time: true, // 로그에 타임스탬프 추가
      
      // 자동 재시작 설정
      autorestart: true,
      max_restarts: 10, // 최대 재시작 횟수
      min_uptime: '10s', // 최소 실행 시간
      
      // 크래시 감지 및 복구
      kill_timeout: 5000, // 강제 종료 대기 시간
      listen_timeout: 3000, // 리스닝 대기 시간
      
      // 고급 설정
      node_args: '--max-old-space-size=1024', // 메모리 제한
      merge_logs: true, // 로그 병합
      
      // 헬스체크 설정
      health_check_grace_period: 3000,
      
      // 무시할 신호
      ignore_watch: [
        'node_modules',
        'logs',
        '*.log'
      ]
    }
  ],

  // 배포 설정 (선택사항)
  deploy: {
    production: {
      user: 'node',
      host: 'your-server.com',
      ref: 'origin/main',
      repo: 'git@github.com:your-username/tenis-zam-backend.git',
      path: '/var/www/tenis-zam-backend',
      'pre-deploy-local': '',
      'post-deploy': 'npm install && pm2 reload ecosystem.config.js --env production',
      'pre-setup': ''
    }
  }
};
