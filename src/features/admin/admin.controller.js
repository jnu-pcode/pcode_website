const db = require('../../db');
const titlesConfig = require('../level/titles.config');
const fs = require('fs').promises;
const path = require('path');

// 대시보드 통계 조회
exports.getDashboardStats = async (req, res) => {
    try {
        // 총 사용자 수
        const totalUsersResult = await db.query('SELECT COUNT(*) as count FROM users');
        const totalUsers = parseInt(totalUsersResult.rows[0].count);

        // 평균 레벨
        const avgLevelResult = await db.query('SELECT AVG(level) as avg_level FROM users');
        const avgLevel = Math.round(parseFloat(avgLevelResult.rows[0].avg_level) || 0);

        // 총 경험치
        const totalXPResult = await db.query('SELECT SUM(experience) as total_xp FROM users');
        const totalXP = parseInt(totalXPResult.rows[0].total_xp) || 0;

        // 오늘 활동한 사용자 (경험치 로그 기준)
        const activeTodayResult = await db.query(`
            SELECT COUNT(DISTINCT user_id) as count 
            FROM experience_logs 
            WHERE DATE(created_at) = CURRENT_DATE
        `);
        const activeToday = parseInt(activeTodayResult.rows[0].count) || 0;

        res.status(200).json({
            success: true,
            stats: {
                totalUsers,
                avgLevel,
                totalXP,
                activeToday
            }
        });

    } catch (err) {
        console.error('대시보드 통계 조회 오류:', err);
        res.status(500).json({ message: '대시보드 통계를 가져오는 중 오류가 발생했습니다.' });
    }
};

// 모든 사용자 목록 조회 (레벨 정보 포함)
exports.getAllUsers = async (req, res) => {
    try {
        const usersResult = await db.query(`
            SELECT 
                id, username, level, experience, title, special_title,
                is_admin, is_member, created_at
            FROM users 
            ORDER BY level DESC, experience DESC
        `);

        // 각 사용자의 레벨 정보 계산
        const usersWithLevelInfo = usersResult.rows.map(user => {
            const levelInfo = calculateLevel(user.experience);
            return {
                ...user,
                levelInfo
            };
        });

        res.status(200).json({
            success: true,
            users: usersWithLevelInfo
        });

    } catch (err) {
        console.error('사용자 목록 조회 오류:', err);
        res.status(500).json({ message: '사용자 목록을 가져오는 중 오류가 발생했습니다.' });
    }
};

// 경험치 조정 (관리자용)
exports.adjustUserXP = async (req, res) => {
    const { userId, xpChange, reason } = req.body;
    const adminId = req.user.userId || req.user.id;

    if (!userId || xpChange === undefined || !reason) {
        return res.status(400).json({ message: '사용자 ID, 경험치 변화량, 사유는 필수입니다.' });
    }

    try {
        await db.query('BEGIN');

        // 1. 현재 사용자 정보 조회
        const userResult = await db.query('SELECT * FROM users WHERE id = $1', [userId]);
        if (userResult.rows.length === 0) {
            await db.query('ROLLBACK');
            return res.status(404).json({ message: '사용자를 찾을 수 없습니다.' });
        }

        const user = userResult.rows[0];
        const oldLevel = user.level;
        const oldXP = user.experience;
        const newXP = Math.max(0, oldXP + xpChange); // 경험치는 0 이하로 내려가지 않음

        // 2. 새로운 레벨 계산
        const levelInfo = calculateLevel(newXP);
        const newLevel = levelInfo.level;
        const leveledUp = newLevel > oldLevel;
        
        // 3. 칭호 업데이트 (레벨업 시에만)
        let newTitle = user.title;
        if (leveledUp) {
            newTitle = getDefaultTitle(newLevel);
        }

        // 4. 사용자 정보 업데이트
        await db.query(
            'UPDATE users SET experience = $1, level = $2, title = $3 WHERE id = $4',
            [newXP, newLevel, newTitle, userId]
        );

        // 5. 경험치 조정 로그 기록
        await db.query(
            'INSERT INTO experience_logs (user_id, action_type, xp_gained, description) VALUES ($1, $2, $3, $4)',
            [userId, 'admin_adjustment', xpChange, `관리자 조정: ${reason} (by admin ${adminId})`]
        );

        await db.query('COMMIT');

        res.status(200).json({
            success: true,
            message: '경험치가 성공적으로 조정되었습니다.',
            leveledUp,
            oldLevel,
            newLevel,
            oldXP,
            newXP,
            newTitle
        });

    } catch (err) {
        await db.query('ROLLBACK');
        console.error('경험치 조정 오류:', err);
        res.status(500).json({ message: '경험치 조정 중 오류가 발생했습니다.' });
    }
};

// 특별 칭호 부여/제거
exports.manageSpecialTitle = async (req, res) => {
    const { userId, specialTitle, action } = req.body; // action: 'grant' or 'remove'
    const adminId = req.user.userId || req.user.id;

    if (!userId || !action) {
        return res.status(400).json({ message: '사용자 ID와 액션은 필수입니다.' });
    }

    if (action === 'grant' && !specialTitle) {
        return res.status(400).json({ message: '특별 칭호가 필요합니다.' });
    }

    try {
        // 1. 사용자 존재 확인
        const userResult = await db.query('SELECT username FROM users WHERE id = $1', [userId]);
        if (userResult.rows.length === 0) {
            return res.status(404).json({ message: '사용자를 찾을 수 없습니다.' });
        }

        const username = userResult.rows[0].username;

        // 2. 특별 칭호 업데이트
        let newSpecialTitle = null;
        let message = '';

        if (action === 'grant') {
            newSpecialTitle = specialTitle;
            message = `특별 칭호 "${specialTitle}"이 부여되었습니다.`;
        } else if (action === 'remove') {
            newSpecialTitle = null;
            message = '특별 칭호가 제거되었습니다.';
        }

        await db.query(
            'UPDATE users SET special_title = $1 WHERE id = $2',
            [newSpecialTitle, userId]
        );

        // 3. 로그 기록
        await db.query(
            'INSERT INTO experience_logs (user_id, action_type, xp_gained, description) VALUES ($1, $2, $3, $4)',
            [userId, 'admin_title', 0, `관리자가 특별 칭호 ${action}: ${specialTitle || '제거'} (by admin ${adminId})`]
        );
        res.status(200).json({
            success: true,
            message,
            specialTitle: newSpecialTitle
        });

    } catch (err) {
        console.error('특별 칭호 관리 오류:', err);
        res.status(500).json({ message: '특별 칭호 관리 중 오류가 발생했습니다.' });
    }
};

// 사용자별 경험치 히스토리 조회
exports.getUserXPHistory = async (req, res) => {
    const { userId } = req.params;
    const { page = 1, limit = 20 } = req.query;
    
    const offset = (page - 1) * limit;

    try {
        // 총 기록 수 조회
        const countResult = await db.query(
            'SELECT COUNT(*) as count FROM experience_logs WHERE user_id = $1',
            [userId]
        );
        const totalCount = parseInt(countResult.rows[0].count);

        // 경험치 히스토리 조회
        const historyResult = await db.query(`
            SELECT 
                action_type, xp_gained, description, created_at
            FROM experience_logs 
            WHERE user_id = $1 
            ORDER BY created_at DESC 
            LIMIT $2 OFFSET $3
        `, [userId, limit, offset]);

        const totalPages = Math.ceil(totalCount / limit);

        res.status(200).json({
            success: true,
            history: historyResult.rows,
            pagination: {
                currentPage: parseInt(page),
                totalPages,
                totalCount,
                hasNext: page < totalPages,
                hasPrev: page > 1
            }
        });

    } catch (err) {
        console.error('경험치 히스토리 조회 오류:', err);
        res.status(500).json({ message: '경험치 히스토리를 가져오는 중 오류가 발생했습니다.' });
    }
};

// 칭호 설정 조회
exports.getTitleSettings = async (req, res) => {
    try {
        // titles.config.js 파일에서 설정 조회
        res.status(200).json({
            success: true,
            titleSettings: {
                levelTitles: titlesConfig.levelTitles,
                specialTitles: titlesConfig.specialTitles,
                xpActions: titlesConfig.xpActions
            }
        });

    } catch (err) {
        console.error('칭호 설정 조회 오류:', err);
        res.status(500).json({ message: '칭호 설정을 가져오는 중 오류가 발생했습니다.' });
    }
};

// 칭호 설정 업데이트
exports.updateTitleSettings = async (req, res) => {
    const { levelTitles, specialTitles, xpActions } = req.body;
    const adminId = req.user.userId || req.user.id;

    try {
        // titles.config.js 파일 업데이트
        const configPath = path.join(__dirname, '../level/titles.config.js');
        
        const newConfig = {
            levelTitles: levelTitles || titlesConfig.levelTitles,
            specialTitles: specialTitles || titlesConfig.specialTitles,
            xpActions: xpActions || titlesConfig.xpActions
        };

        const configContent = `// 칭호 설정 파일
// 이 파일을 수정하여 칭호를 변경할 수 있습니다.

module.exports = ${JSON.stringify(newConfig, null, 4)};`;

        await fs.writeFile(configPath, configContent, 'utf8');

        res.status(200).json({
            success: true,
            message: '칭호 설정이 성공적으로 업데이트되었습니다.',
            titleSettings: newConfig
        });

    } catch (err) {
        console.error('칭호 설정 업데이트 오류:', err);
        res.status(500).json({ message: '칭호 설정 업데이트 중 오류가 발생했습니다.' });
    }
};

// 레벨 계산 함수 (level.controller.js와 동일)
function calculateLevel(totalExperience) {
    let level = 1;
    let usedXP = 0;
    
    while (true) {
        const requiredForNextLevel = calculateRequiredXP(level);
        if (totalExperience < usedXP + requiredForNextLevel) {
            break;
        }
        usedXP += requiredForNextLevel;
        level++;
    }
    
    const currentLevelXP = totalExperience - usedXP;
    const requiredForNext = calculateRequiredXP(level);
    const remainingXP = requiredForNext - currentLevelXP;
    
    return {
        level: level,
        currentLevelXP: currentLevelXP,
        requiredForNext: requiredForNext,
        remainingXP: remainingXP,
        progressPercent: Math.round((currentLevelXP / requiredForNext) * 100)
    };
}

function calculateRequiredXP(level) {
    const baseXP = 1000;
    const multiplier = 1.5;
    const maxXP = 10000;
    
    return Math.min(Math.floor(baseXP * Math.pow(multiplier, level - 1)), maxXP);
}

function getDefaultTitle(level) {
    let selectedTitle = titlesConfig.levelTitles[0];
    
    for (const titleInfo of titlesConfig.levelTitles) {
        if (level >= titleInfo.minLevel) {
            selectedTitle = titleInfo;
        } else {
            break;
        }
    }
    
    return selectedTitle.title;
} 