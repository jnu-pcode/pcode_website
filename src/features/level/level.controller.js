const db = require('../../db');
const titlesConfig = require('./titles.config');

// 레벨별 필요 경험치 계산 함수 (지수적 증가)
function calculateRequiredXP(level) {
    // 레벨 1->2: 1000XP
    // 레벨 2->3: 1500XP  
    // 레벨 3->4: 2250XP
    // 레벨 4->5: 3375XP (이전 레벨 * 1.5)
    // 최대 10000XP로 제한
    const baseXP = 1000;
    const multiplier = 1.5;
    const maxXP = 10000;
    
    return Math.min(Math.floor(baseXP * Math.pow(multiplier, level - 1)), maxXP);
}

// 총 경험치로부터 현재 레벨 계산
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
        currentLevelXP: currentLevelXP, // 현재 레벨에서의 경험치
        requiredForNext: requiredForNext, // 다음 레벨까지 필요한 총 경험치
        remainingXP: remainingXP, // 다음 레벨까지 남은 경험치
        progressPercent: Math.round((currentLevelXP / requiredForNext) * 100) // 진행률
    };
}

// 레벨별 기본 칭호 반환 (설정 파일 사용)
function getDefaultTitle(level) {
    // 레벨에 맞는 가장 높은 칭호 찾기
    let selectedTitle = titlesConfig.levelTitles[0]; // 기본값: 새싹
    
    for (const titleInfo of titlesConfig.levelTitles) {
        if (level >= titleInfo.minLevel) {
            selectedTitle = titleInfo;
        } else {
            break;
        }
    }
    
    return selectedTitle.title;
}

// 경험치 계산 헬퍼 함수
function calculateXP(actionType, difficulty = 1, customAmount = null) {
    if (customAmount !== null) {
        return customAmount; // 관리자 직접 지정
    }
    
    const actionConfig = titlesConfig.xpActions[actionType];
    if (!actionConfig) {
        console.warn(`알 수 없는 액션 타입: ${actionType}`);
        return 0;
    }
    
    let xp = actionConfig.baseXP;
    
    // 난이도별 배수 적용 (워게임의 경우)
    if (actionConfig.difficultyMultiplier && difficulty) {
        const multiplier = actionConfig.difficultyMultiplier[difficulty] || 1.0;
        xp = Math.floor(xp * multiplier);
    }
    
    return xp;
}

// 경험치 추가 및 레벨업 처리 (내부 API - 서버 간 호출용)
exports.addExperience = async (req, res) => {
    const { userId, actionType, xpGained, difficulty, description, internalKey } = req.body;
    
    // 내부 API 키 검증 (서버 간 호출 시에만 허용)
    const expectedKey = process.env.INTERNAL_API_KEY;
    if (internalKey !== expectedKey) {
        console.log('경험치 추가 API: 유효하지 않은 내부 키 시도');
        return res.status(403).json({ message: '접근이 거부되었습니다.' });
    }
    
    // 요청 IP가 로컬호스트인지 확인 (추가 보안)
    const clientIP = req.ip || req.connection.remoteAddress;
    const isLocalhost = clientIP === '127.0.0.1' || clientIP === '::1' || clientIP.includes('127.0.0.1');
    
    if (!isLocalhost) {
        console.log('경험치 추가 API: 외부 IP에서 접근 시도:', clientIP);
        return res.status(403).json({ message: '로컬 서버에서만 접근 가능합니다.' });
    }
    
    console.log('경험치 추가 요청:', { userId, actionType, xpGained, description });
    
    try {
        // 트랜잭션 시작
        await db.query('BEGIN');
        
        // 1. 현재 사용자 정보 조회
        const userResult = await db.query('SELECT * FROM users WHERE id = $1', [userId]);
        if (userResult.rows.length === 0) {
            await db.query('ROLLBACK');
            return res.status(404).json({ message: '사용자를 찾을 수 없습니다.' });
        }
        
        const user = userResult.rows[0];
        const oldLevel = user.level;
        
        // 실제 지급할 경험치 계산 (xpGained가 null이면 자동 계산)
        const actualXP = xpGained !== null ? xpGained : calculateXP(actionType, difficulty);
        const newTotalXP = user.experience + actualXP;
        
        // 2. 새로운 레벨 계산
        const levelInfo = calculateLevel(newTotalXP);
        const newLevel = levelInfo.level;
        
        // 3. 레벨업이 발생했는지 확인
        const leveledUp = newLevel > oldLevel;
        let newTitle = user.title;
        
        if (leveledUp) {
            newTitle = getDefaultTitle(newLevel);
            console.log(`레벨업 발생! ${oldLevel} -> ${newLevel}, 새 칭호: ${newTitle}`);
        }
        
        // 4. 사용자 정보 업데이트
        await db.query(
            'UPDATE users SET experience = $1, level = $2, title = $3 WHERE id = $4',
            [newTotalXP, newLevel, newTitle, userId]
        );
        
        // 5. 경험치 로그 기록
        await db.query(
            'INSERT INTO experience_logs (user_id, action_type, xp_gained, description) VALUES ($1, $2, $3, $4)',
            [userId, actionType, actualXP, description]
        );
        
        // 트랜잭션 커밋
        await db.query('COMMIT');
        
        console.log('경험치 추가 성공:', { 
            actualXP,
            oldLevel, 
            newLevel, 
            newTotalXP, 
            leveledUp,
            newTitle 
        });
        
        res.status(200).json({
            success: true,
            leveledUp: leveledUp,
            oldLevel: oldLevel,
            newLevel: newLevel,
            newTitle: newTitle,
            totalExperience: newTotalXP,
            levelInfo: levelInfo
        });
        
    } catch (err) {
        await db.query('ROLLBACK');
        console.error('경험치 추가 중 오류:', err);
        res.status(500).json({ message: '경험치 추가 중 오류가 발생했습니다.' });
    }
};

// 사용자 레벨 정보 조회
exports.getUserLevel = async (req, res) => {
    const userId = req.user.userId;
    
    try {
        const userResult = await db.query(
            'SELECT id, username, level, experience, title, special_title FROM users WHERE id = $1',
            [userId]
        );
        
        if (userResult.rows.length === 0) {
            return res.status(404).json({ message: '사용자를 찾을 수 없습니다.' });
        }
        
        const user = userResult.rows[0];
        const levelInfo = calculateLevel(user.experience);
        
        res.status(200).json({
            user: {
                id: user.id,
                username: user.username,
                level: user.level,
                experience: user.experience,
                title: user.title,
                specialTitle: user.special_title
            },
            levelInfo: levelInfo
        });
        
    } catch (err) {
        console.error('사용자 레벨 정보 조회 오류:', err);
        res.status(500).json({ message: '레벨 정보를 가져오는 중 오류가 발생했습니다.' });
    }
};

// 경험치 획득 히스토리 조회
exports.getExperienceHistory = async (req, res) => {
    const userId = req.user.userId;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;
    
    try {
        const historyResult = await db.query(
            `SELECT action_type, xp_gained, description, created_at 
             FROM experience_logs 
             WHERE user_id = $1 
             ORDER BY created_at DESC 
             LIMIT $2 OFFSET $3`,
            [userId, limit, offset]
        );
        
        const countResult = await db.query(
            'SELECT COUNT(*) FROM experience_logs WHERE user_id = $1',
            [userId]
        );
        
        const totalCount = parseInt(countResult.rows[0].count);
        const totalPages = Math.ceil(totalCount / limit);
        
        res.status(200).json({
            history: historyResult.rows,
            pagination: {
                currentPage: page,
                totalPages: totalPages,
                totalCount: totalCount,
                hasNext: page < totalPages,
                hasPrev: page > 1
            }
        });
        
    } catch (err) {
        console.error('경험치 히스토리 조회 오류:', err);
        res.status(500).json({ message: '경험치 히스토리를 가져오는 중 오류가 발생했습니다.' });
    }
};

// 사용자 레벨 정보 조회
exports.getUserLevel = async (req, res) => {
    const { userId } = req.params;
    const requestUserId = req.user.userId || req.user.id;
    
    // 본인의 레벨 정보만 조회 가능 (또는 관리자)
    if (parseInt(userId) !== requestUserId && !req.user.is_admin) {
        return res.status(403).json({ message: '다른 사용자의 레벨 정보는 조회할 수 없습니다.' });
    }
    
    try {
        // 1. 사용자 정보 조회
        const userResult = await db.query('SELECT * FROM users WHERE id = $1', [userId]);
        if (userResult.rows.length === 0) {
            return res.status(404).json({ message: '사용자를 찾을 수 없습니다.' });
        }
        
        const user = userResult.rows[0];
        
        // 2. 레벨 정보 계산
        const levelInfo = calculateLevel(user.experience);
        
        // 3. 응답 데이터 구성
        const responseData = {
            userId: user.id,
            username: user.username,
            level: user.level,
            title: user.title,
            special_title: user.special_title, // 특별 칭호 추가
            totalExperience: user.experience,
            ...levelInfo
        };
        
        res.status(200).json({
            success: true,
            levelInfo: responseData
        });
        
    } catch (err) {
        res.status(500).json({ message: '레벨 정보 조회 중 오류가 발생했습니다.' });
    }
}; 