const express = require('express');
const { body, validationResult } = require('express-validator');
const { pool } = require('../config/database');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// 모든 일정 조회
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { year, month } = req.query;
    
    let query = `
      SELECT 
        s.id,
        s.title,
        s.description,
        s.date,
        s.start_time,
        s.end_time,
        s.location,
        s.location_detail,
        s.created_at,
        u.name as created_by_name,
        COUNT(sp.id) as participant_count,
        SUM(CASE WHEN sp.status = '참여' THEN 1 ELSE 0 END) as confirmed_count
      FROM schedules s
      LEFT JOIN users u ON s.created_by = u.id
      LEFT JOIN schedule_participants sp ON s.id = sp.schedule_id
    `;
    
    const params = [];
    
    // 년/월 필터링
    if (year && month) {
      query += ' WHERE YEAR(s.date) = ? AND MONTH(s.date) = ?';
      params.push(year, month);
    } else if (year) {
      query += ' WHERE YEAR(s.date) = ?';
      params.push(year);
    }
    
    query += `
      GROUP BY s.id
      ORDER BY s.date ASC, s.start_time ASC
    `;

    const [schedules] = await pool.execute(query, params);
    
    res.json({
      success: true,
      data: schedules
    });

  } catch (error) {
    console.error('일정 조회 오류:', error);
    res.status(500).json({
      success: false,
      message: '일정 조회 중 오류가 발생했습니다.'
    });
  }
});

// 특정 일정 상세 조회
router.get('/:scheduleId', authenticateToken, async (req, res) => {
  try {
    const { scheduleId } = req.params;

    // 일정 기본 정보 조회
    const [schedules] = await pool.execute(`
      SELECT 
        s.*,
        u.name as created_by_name
      FROM schedules s
      LEFT JOIN users u ON s.created_by = u.id
      WHERE s.id = ?
    `, [scheduleId]);

    if (schedules.length === 0) {
      return res.status(404).json({
        success: false,
        message: '일정을 찾을 수 없습니다.'
      });
    }

    const schedule = schedules[0];

    // 참여자 정보 조회
    const [participants] = await pool.execute(`
      SELECT 
        sp.status,
        u.id as user_id,
        u.name as user_name,
        u.phone as user_phone
      FROM schedule_participants sp
      JOIN users u ON sp.user_id = u.id
      WHERE sp.schedule_id = ?
      ORDER BY sp.created_at ASC
    `, [scheduleId]);

    res.json({
      success: true,
      data: {
        ...schedule,
        participants
      }
    });

  } catch (error) {
    console.error('일정 상세 조회 오류:', error);
    res.status(500).json({
      success: false,
      message: '일정 상세 조회 중 오류가 발생했습니다.'
    });
  }
});

// 일정 생성
router.post('/', [
  authenticateToken,
  body('title')
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('제목은 1자 이상 200자 이하로 입력해주세요.'),
  body('date')
    .isISO8601()
    .withMessage('올바른 날짜 형식을 입력해주세요. (YYYY-MM-DD)'),
  body('start_time')
    .matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('올바른 시작 시간 형식을 입력해주세요. (HH:MM)'),
  body('end_time')
    .matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('올바른 종료 시간 형식을 입력해주세요. (HH:MM)'),
  body('location')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('장소는 500자 이하로 입력해주세요.')
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

    const { title, description, date, start_time, end_time, location, location_detail } = req.body;

    // 시간 검증 (종료 시간이 시작 시간보다 늦어야 함)
    if (start_time >= end_time) {
      return res.status(400).json({
        success: false,
        message: '종료 시간은 시작 시간보다 늦어야 합니다.'
      });
    }

    // 일정 생성
    const [result] = await pool.execute(`
      INSERT INTO schedules 
      (title, description, date, start_time, end_time, location, location_detail, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [title, description || null, date, start_time, end_time, location || null, location_detail || null, req.user.id]);

    const newScheduleId = result.insertId;

    // 생성된 일정 정보 조회
    const [newSchedule] = await pool.execute(`
      SELECT 
        s.*,
        u.name as created_by_name
      FROM schedules s
      LEFT JOIN users u ON s.created_by = u.id
      WHERE s.id = ?
    `, [newScheduleId]);

    res.status(201).json({
      success: true,
      message: '일정이 생성되었습니다.',
      data: newSchedule[0]
    });

  } catch (error) {
    console.error('일정 생성 오류:', error);
    res.status(500).json({
      success: false,
      message: '일정 생성 중 오류가 발생했습니다.'
    });
  }
});

// 일정 수정
router.put('/:scheduleId', [
  authenticateToken,
  body('title')
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('제목은 1자 이상 200자 이하로 입력해주세요.'),
  body('date')
    .isISO8601()
    .withMessage('올바른 날짜 형식을 입력해주세요. (YYYY-MM-DD)'),
  body('start_time')
    .matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('올바른 시작 시간 형식을 입력해주세요. (HH:MM)'),
  body('end_time')
    .matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('올바른 종료 시간 형식을 입력해주세요. (HH:MM)'),
  body('location')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('장소는 500자 이하로 입력해주세요.')
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

    const { scheduleId } = req.params;
    const { title, description, date, start_time, end_time, location, location_detail } = req.body;

    // 일정 존재 및 권한 확인
    const [schedules] = await pool.execute(
      'SELECT id, created_by FROM schedules WHERE id = ?',
      [scheduleId]
    );

    if (schedules.length === 0) {
      return res.status(404).json({
        success: false,
        message: '일정을 찾을 수 없습니다.'
      });
    }

    const schedule = schedules[0];

    // 작성자 또는 관리자만 수정 가능
    if (schedule.created_by !== req.user.id && !req.user.is_admin) {
      return res.status(403).json({
        success: false,
        message: '일정을 수정할 권한이 없습니다.'
      });
    }

    // 시간 검증
    if (start_time >= end_time) {
      return res.status(400).json({
        success: false,
        message: '종료 시간은 시작 시간보다 늦어야 합니다.'
      });
    }

    // 일정 수정
    await pool.execute(`
      UPDATE schedules 
      SET title = ?, description = ?, date = ?, start_time = ?, end_time = ?, 
          location = ?, location_detail = ?
      WHERE id = ?
    `, [title, description || null, date, start_time, end_time, location || null, location_detail || null, scheduleId]);

    // 수정된 일정 정보 조회
    const [updatedSchedule] = await pool.execute(`
      SELECT 
        s.*,
        u.name as created_by_name
      FROM schedules s
      LEFT JOIN users u ON s.created_by = u.id
      WHERE s.id = ?
    `, [scheduleId]);

    res.json({
      success: true,
      message: '일정이 수정되었습니다.',
      data: updatedSchedule[0]
    });

  } catch (error) {
    console.error('일정 수정 오류:', error);
    res.status(500).json({
      success: false,
      message: '일정 수정 중 오류가 발생했습니다.'
    });
  }
});

// 일정 삭제 (작성자 또는 관리자만)
router.delete('/:scheduleId', authenticateToken, async (req, res) => {
  try {
    const { scheduleId } = req.params;

    // 일정 존재 및 권한 확인
    const [schedules] = await pool.execute(
      'SELECT id, title, created_by FROM schedules WHERE id = ?',
      [scheduleId]
    );

    if (schedules.length === 0) {
      return res.status(404).json({
        success: false,
        message: '일정을 찾을 수 없습니다.'
      });
    }

    const schedule = schedules[0];

    // 작성자 또는 관리자만 삭제 가능
    if (schedule.created_by !== req.user.id && !req.user.is_admin) {
      return res.status(403).json({
        success: false,
        message: '일정을 삭제할 권한이 없습니다.'
      });
    }

    // 일정 삭제 (참여 정보도 CASCADE로 삭제됨)
    await pool.execute('DELETE FROM schedules WHERE id = ?', [scheduleId]);

    res.json({
      success: true,
      message: `"${schedule.title}" 일정이 삭제되었습니다.`
    });

  } catch (error) {
    console.error('일정 삭제 오류:', error);
    res.status(500).json({
      success: false,
      message: '일정 삭제 중 오류가 발생했습니다.'
    });
  }
});

// 내 참여 상태 제거 (자신의 참여 상태를 완전히 제거)
router.delete('/:scheduleId/participate', [
  authenticateToken
], async (req, res) => {
  try {
    const { scheduleId } = req.params;
    const userId = req.user.id;

    // 일정 존재 확인
    const [schedules] = await pool.execute(
      'SELECT id, title FROM schedules WHERE id = ?',
      [scheduleId]
    );

    if (schedules.length === 0) {
      return res.status(404).json({
        success: false,
        message: '일정을 찾을 수 없습니다.'
      });
    }

    // 참여 정보 존재 확인
    const [existingParticipation] = await pool.execute(
      'SELECT id FROM schedule_participants WHERE schedule_id = ? AND user_id = ?',
      [scheduleId, userId]
    );

    if (existingParticipation.length === 0) {
      return res.status(404).json({
        success: false,
        message: '참여 정보를 찾을 수 없습니다.'
      });
    }

    // 참여 정보 완전 삭제
    await pool.execute(
      'DELETE FROM schedule_participants WHERE schedule_id = ? AND user_id = ?',
      [scheduleId, userId]
    );

    res.json({
      success: true,
      message: '참여 상태가 제거되었습니다.',
      data: {
        scheduleId: parseInt(scheduleId),
        userId
      }
    });

  } catch (error) {
    console.error('참여 상태 제거 오류:', error);
    res.status(500).json({
      success: false,
      message: '참여 상태 제거 중 오류가 발생했습니다.'
    });
  }
});

// 일정 참여 상태 설정/변경
router.post('/:scheduleId/participate', [
  authenticateToken,
  body('status')
    .isIn(['참여', '불참', '미정'])
    .withMessage('참여 상태는 "참여", "불참", "미정" 중 하나여야 합니다.')
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

    const { scheduleId } = req.params;
    const { status } = req.body;
    const userId = req.user.id;

    // 일정 존재 확인
    const [schedules] = await pool.execute(
      'SELECT id, title FROM schedules WHERE id = ?',
      [scheduleId]
    );

    if (schedules.length === 0) {
      return res.status(404).json({
        success: false,
        message: '일정을 찾을 수 없습니다.'
      });
    }

    // 기존 참여 정보 확인
    const [existingParticipation] = await pool.execute(
      'SELECT id, status FROM schedule_participants WHERE schedule_id = ? AND user_id = ?',
      [scheduleId, userId]
    );

    if (existingParticipation.length > 0) {
      // 기존 참여 정보 업데이트
      await pool.execute(
        'UPDATE schedule_participants SET status = ? WHERE schedule_id = ? AND user_id = ?',
        [status, scheduleId, userId]
      );
    } else {
      // 새로운 참여 정보 생성
      await pool.execute(
        'INSERT INTO schedule_participants (schedule_id, user_id, status) VALUES (?, ?, ?)',
        [scheduleId, userId, status]
      );
    }

    res.json({
      success: true,
      message: `참여 상태가 "${status}"으로 설정되었습니다.`,
      data: {
        scheduleId: parseInt(scheduleId),
        userId,
        status
      }
    });

  } catch (error) {
    console.error('참여 상태 설정 오류:', error);
    res.status(500).json({
      success: false,
      message: '참여 상태 설정 중 오류가 발생했습니다.'
    });
  }
});

// 특정 사용자의 참여 상태 설정 (관리자만)
router.post('/:scheduleId/participate/:userId', [
  authenticateToken,
  requireAdmin,
  body('status')
    .isIn(['참여', '불참', '미정'])
    .withMessage('참여 상태는 "참여", "불참", "미정" 중 하나여야 합니다.')
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

    const { scheduleId, userId } = req.params;
    const { status } = req.body;

    // 일정 존재 확인
    const [schedules] = await pool.execute(
      'SELECT id, title FROM schedules WHERE id = ?',
      [scheduleId]
    );

    if (schedules.length === 0) {
      return res.status(404).json({
        success: false,
        message: '일정을 찾을 수 없습니다.'
      });
    }

    // 사용자 존재 확인
    const [users] = await pool.execute(
      'SELECT id, name FROM users WHERE id = ? AND is_approved = TRUE',
      [userId]
    );

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: '승인된 사용자를 찾을 수 없습니다.'
      });
    }

    // 기존 참여 정보 확인
    const [existingParticipation] = await pool.execute(
      'SELECT id, status FROM schedule_participants WHERE schedule_id = ? AND user_id = ?',
      [scheduleId, userId]
    );

    if (existingParticipation.length > 0) {
      // 기존 참여 정보 업데이트
      await pool.execute(
        'UPDATE schedule_participants SET status = ? WHERE schedule_id = ? AND user_id = ?',
        [status, scheduleId, userId]
      );
    } else {
      // 새로운 참여 정보 생성
      await pool.execute(
        'INSERT INTO schedule_participants (schedule_id, user_id, status) VALUES (?, ?, ?)',
        [scheduleId, userId, status]
      );
    }

    res.json({
      success: true,
      message: `${users[0].name} 사용자의 참여 상태가 "${status}"으로 설정되었습니다.`,
      data: {
        scheduleId: parseInt(scheduleId),
        userId: parseInt(userId),
        userName: users[0].name,
        status
      }
    });

  } catch (error) {
    console.error('사용자 참여 상태 설정 오류:', error);
    res.status(500).json({
      success: false,
      message: '사용자 참여 상태 설정 중 오류가 발생했습니다.'
    });
  }
});

// 내 참여 일정 조회
router.get('/my-participations', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const [participations] = await pool.execute(`
      SELECT 
        s.id,
        s.title,
        s.description,
        s.date,
        s.start_time,
        s.end_time,
        s.location,
        sp.status as my_status,
        u.name as created_by_name
      FROM schedule_participants sp
      JOIN schedules s ON sp.schedule_id = s.id
      LEFT JOIN users u ON s.created_by = u.id
      WHERE sp.user_id = ?
      ORDER BY s.date ASC, s.start_time ASC
    `, [userId]);

    res.json({
      success: true,
      data: participations
    });

  } catch (error) {
    console.error('내 참여 일정 조회 오류:', error);
    res.status(500).json({
      success: false,
      message: '내 참여 일정 조회 중 오류가 발생했습니다.'
    });
  }
});

// 참여자 제거 (관리자만)
router.delete('/:scheduleId/participate/:userId', [
  authenticateToken,
  requireAdmin
], async (req, res) => {
  try {
    const { scheduleId, userId } = req.params;

    // 일정 존재 확인
    const [schedules] = await pool.execute(
      'SELECT id, title FROM schedules WHERE id = ?',
      [scheduleId]
    );

    if (schedules.length === 0) {
      return res.status(404).json({
        success: false,
        message: '일정을 찾을 수 없습니다.'
      });
    }

    // 사용자 존재 확인
    const [users] = await pool.execute(
      'SELECT id, name FROM users WHERE id = ? AND is_approved = TRUE',
      [userId]
    );

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: '승인된 사용자를 찾을 수 없습니다.'
      });
    }

    // 참여 정보 존재 확인
    const [existingParticipation] = await pool.execute(
      'SELECT id FROM schedule_participants WHERE schedule_id = ? AND user_id = ?',
      [scheduleId, userId]
    );

    if (existingParticipation.length === 0) {
      return res.status(404).json({
        success: false,
        message: '해당 사용자의 참여 정보를 찾을 수 없습니다.'
      });
    }

    // 참여 정보 완전 삭제
    await pool.execute(
      'DELETE FROM schedule_participants WHERE schedule_id = ? AND user_id = ?',
      [scheduleId, userId]
    );

    res.json({
      success: true,
      message: `${users[0].name} 사용자가 참여자 목록에서 제거되었습니다.`,
      data: {
        scheduleId: parseInt(scheduleId),
        userId: parseInt(userId),
        userName: users[0].name
      }
    });

  } catch (error) {
    console.error('참여자 제거 오류:', error);
    res.status(500).json({
      success: false,
      message: '참여자 제거 중 오류가 발생했습니다.'
    });
  }
});

module.exports = router;