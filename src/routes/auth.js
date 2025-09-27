const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const { pool } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// 회원가입
router.post('/register', [
  body('name')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('이름은 2자 이상 50자 이하로 입력해주세요.'),
  body('phone')
    .trim()
    .matches(/^010-\d{4}-\d{4}$/)
    .withMessage('010-xxxx-xxxx 형식으로 입력해주세요. (예: 010-1234-5678)')
], async (req, res) => {
  try {
    // 입력값 검증
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: '입력값이 올바르지 않습니다.',
        errors: errors.array()
      });
    }

    const { name, phone } = req.body;
    
    // 전화번호 정규화 (하이픈 제거)
    const normalizedPhone = phone.replace(/-/g, '');

    // 기존 사용자 확인
    const [existingUsers] = await pool.execute(
      'SELECT id FROM users WHERE phone = ?',
      [normalizedPhone]
    );

    if (existingUsers.length > 0) {
      return res.status(409).json({
        success: false,
        message: '이미 가입된 전화번호입니다.'
      });
    }

    // 자동 승인 설정 확인
    const autoApprove = process.env.AUTO_APPROVE_USERS === 'true';
    
    // 첫 번째 사용자는 자동으로 관리자로 설정
    const [userCount] = await pool.execute('SELECT COUNT(*) as count FROM users');
    const isFirstUser = userCount[0].count === 0;

    // 사용자 생성
    const [result] = await pool.execute(
      'INSERT INTO users (name, phone, is_approved, is_admin) VALUES (?, ?, ?, ?)',
      [name, normalizedPhone, autoApprove || isFirstUser, isFirstUser]
    );

    const newUserId = result.insertId;

    // JWT 토큰 생성 (승인된 경우에만)
    let token = null;
    if (autoApprove || isFirstUser) {
      token = jwt.sign(
        { userId: newUserId },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
      );
    }

    res.status(201).json({
      success: true,
      message: autoApprove || isFirstUser 
        ? '회원가입이 완료되었습니다.' 
        : '회원가입이 완료되었습니다. 관리자 승인을 기다려주세요.',
      data: {
        userId: newUserId,
        name,
        phone: normalizedPhone,
        isApproved: autoApprove || isFirstUser,
        isAdmin: isFirstUser,
        token
      }
    });

  } catch (error) {
    console.error('회원가입 오류:', error);
    res.status(500).json({
      success: false,
      message: '회원가입 처리 중 오류가 발생했습니다.'
    });
  }
});

// 로그인
router.post('/login', [
  body('name')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('이름은 2자 이상 50자 이하로 입력해주세요.'),
  body('phone')
    .trim()
    .matches(/^010-\d{4}-\d{4}$/)
    .withMessage('010-xxxx-xxxx 형식으로 입력해주세요.')
], async (req, res) => {
  try {
    // 입력값 검증
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: '입력값이 올바르지 않습니다.',
        errors: errors.array()
      });
    }

    const { name, phone } = req.body;
    const normalizedPhone = phone.replace(/-/g, '');

    // 사용자 조회 (이름과 전화번호로 조회)
    const [users] = await pool.execute(
      'SELECT id, name, phone, is_approved, is_admin FROM users WHERE name = ? AND phone = ?',
      [name, normalizedPhone]
    );

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: '이름 또는 전화번호가 올바르지 않습니다.'
      });
    }

    const user = users[0];

    // 승인 상태 확인
    if (!user.is_approved) {
      return res.status(403).json({
        success: false,
        message: '승인 대기 중인 계정입니다. 관리자 승인을 기다려주세요.'
      });
    }

    // JWT 토큰 생성
    const token = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    res.json({
      success: true,
      message: '로그인 성공',
      data: {
        userId: user.id,
        name: user.name,
        phone: user.phone,
        isApproved: user.is_approved,
        isAdmin: user.is_admin,
        token
      }
    });

  } catch (error) {
    console.error('로그인 오류:', error);
    res.status(500).json({
      success: false,
      message: '로그인 처리 중 오류가 발생했습니다.'
    });
  }
});

// 토큰 검증 및 사용자 정보 조회
router.get('/me', authenticateToken, (req, res) => {
  res.json({
    success: true,
    data: {
      userId: req.user.id,
      name: req.user.name,
      phone: req.user.phone,
      isApproved: req.user.is_approved,
      isAdmin: req.user.is_admin
    }
  });
});

module.exports = router;