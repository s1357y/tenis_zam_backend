const express = require('express');
const { pool } = require('../config/database');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// 모든 사용자 목록 조회 (관리자만)
router.get('/', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const [users] = await pool.execute(`
      SELECT 
        id, 
        name, 
        phone, 
        is_approved, 
        is_admin, 
        created_at 
      FROM users 
      ORDER BY created_at DESC
    `);

    res.json({
      success: true,
      data: users
    });

  } catch (error) {
    console.error('사용자 목록 조회 오류:', error);
    res.status(500).json({
      success: false,
      message: '사용자 목록 조회 중 오류가 발생했습니다.'
    });
  }
});

// 승인 대기 중인 사용자 목록 (관리자만)
router.get('/pending', authenticateToken, requireAdmin, async (req, res) => {  try {
    const [users] = await pool.execute(`
      SELECT 
        id, 
        name, 
        phone, 
        created_at 
      FROM users 
      WHERE is_approved = FALSE 
      ORDER BY created_at ASC
    `);

    res.json({
      success: true,
      data: users
    });

  } catch (error) {
    console.error('승인 대기 사용자 조회 오류:', error);
    res.status(500).json({
      success: false,
      message: '승인 대기 사용자 조회 중 오류가 발생했습니다.'
    });
  }
});

// 사용자 승인 (관리자만)
router.patch('/:userId/approve', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { userId } = req.params;

    // 사용자 존재 확인
    const [users] = await pool.execute(
      'SELECT id, name, is_approved FROM users WHERE id = ?',
      [userId]
    );

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: '사용자를 찾을 수 없습니다.'
      });
    }

    const user = users[0];

    if (user.is_approved) {
      return res.status(400).json({
        success: false,
        message: '이미 승인된 사용자입니다.'
      });
    }

    // 사용자 승인
    await pool.execute(
      'UPDATE users SET is_approved = TRUE WHERE id = ?',
      [userId]
    );

    res.json({
      success: true,
      message: `${user.name} 사용자가 승인되었습니다.`
    });

  } catch (error) {
    console.error('사용자 승인 오류:', error);
    res.status(500).json({
      success: false,
      message: '사용자 승인 처리 중 오류가 발생했습니다.'
    });
  }
});

// 사용자 승인 취소 (관리자만)
router.patch('/:userId/revoke', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { userId } = req.params;

    // 자기 자신은 승인 취소할 수 없음
    if (parseInt(userId) === req.user.id) {
      return res.status(400).json({
        success: false,
        message: '자기 자신의 승인을 취소할 수 없습니다.'
      });
    }

    // 사용자 존재 확인
    const [users] = await pool.execute(
      'SELECT id, name, is_approved, is_admin FROM users WHERE id = ?',
      [userId]
    );

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: '사용자를 찾을 수 없습니다.'
      });
    }

    const user = users[0];

    if (user.is_admin) {
      return res.status(400).json({
        success: false,
        message: '관리자의 승인을 취소할 수 없습니다.'
      });
    }

    // 승인 취소
    await pool.execute(
      'UPDATE users SET is_approved = FALSE WHERE id = ?',
      [userId]
    );

    res.json({
      success: true,
      message: `${user.name} 사용자의 승인이 취소되었습니다.`
    });

  } catch (error) {
    console.error('사용자 승인 취소 오류:', error);
    res.status(500).json({
      success: false,
      message: '사용자 승인 취소 처리 중 오류가 발생했습니다.'
    });
  }
});

// 사용자 정보 수정 (관리자만)
router.put('/:userId', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    const { name, phone, is_approved, is_admin } = req.body;

    // 자기 자신의 관리자 권한은 변경할 수 없음
    if (parseInt(userId) === req.user.id && is_admin !== undefined) {
      return res.status(400).json({
        success: false,
        message: '자기 자신의 관리자 권한은 변경할 수 없습니다.'
      });
    }

    // 사용자 존재 확인
    const [users] = await pool.execute(
      'SELECT id, name, phone, is_approved, is_admin FROM users WHERE id = ?',
      [userId]
    );

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: '사용자를 찾을 수 없습니다.'
      });
    }

    const currentUser = users[0];

    // 전화번호 중복 확인 (자신의 전화번호가 아닌 경우)
    if (phone && phone !== currentUser.phone) {
      const [existingUsers] = await pool.execute(
        'SELECT id FROM users WHERE phone = ? AND id != ?',
        [phone, userId]
      );

      if (existingUsers.length > 0) {
        return res.status(400).json({
          success: false,
          message: '이미 사용 중인 전화번호입니다.'
        });
      }
    }

    // 업데이트할 필드들 준비
    const updateFields = [];
    const updateValues = [];

    if (name !== undefined) {
      updateFields.push('name = ?');
      updateValues.push(name);
    }

    if (phone !== undefined) {
      updateFields.push('phone = ?');
      updateValues.push(phone);
    }

    if (is_approved !== undefined) {
      updateFields.push('is_approved = ?');
      updateValues.push(is_approved);
    }

    if (is_admin !== undefined) {
      updateFields.push('is_admin = ?');
      updateValues.push(is_admin);
    }

    if (updateFields.length === 0) {
      return res.status(400).json({
        success: false,
        message: '수정할 정보가 없습니다.'
      });
    }

    // updated_at 필드 추가
    updateFields.push('updated_at = CURRENT_TIMESTAMP');
    updateValues.push(userId);

    // 사용자 정보 업데이트
    await pool.execute(
      `UPDATE users SET ${updateFields.join(', ')} WHERE id = ?`,
      updateValues
    );

    // 업데이트된 사용자 정보 조회
    const [updatedUsers] = await pool.execute(
      'SELECT id, name, phone, is_approved, is_admin, created_at, updated_at FROM users WHERE id = ?',
      [userId]
    );

    res.json({
      success: true,
      message: '사용자 정보가 성공적으로 수정되었습니다.',
      data: updatedUsers[0]
    });

  } catch (error) {
    console.error('사용자 정보 수정 오류:', error);
    res.status(500).json({
      success: false,
      message: '사용자 정보 수정 처리 중 오류가 발생했습니다.'
    });
  }
});

// 사용자 삭제 (관리자만)
router.delete('/:userId', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { userId } = req.params;

    // 자기 자신은 삭제할 수 없음
    if (parseInt(userId) === req.user.id) {
      return res.status(400).json({
        success: false,
        message: '자기 자신을 삭제할 수 없습니다.'
      });
    }

    // 사용자 존재 확인
    const [users] = await pool.execute(
      'SELECT id, name FROM users WHERE id = ?',
      [userId]
    );

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: '사용자를 찾을 수 없습니다.'
      });
    }

    const user = users[0];

    // 사용자 삭제 (관련된 참여 정보도 CASCADE로 삭제됨)
    await pool.execute('DELETE FROM users WHERE id = ?', [userId]);

    res.json({
      success: true,
      message: `${user.name} 사용자가 삭제되었습니다.`
    });

  } catch (error) {
    console.error('사용자 삭제 오류:', error);
    res.status(500).json({
      success: false,
      message: '사용자 삭제 처리 중 오류가 발생했습니다.'
    });
  }
});

module.exports = router;