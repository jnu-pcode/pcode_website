const db = require('../../db');

// 공개 랭킹 조회 (관리자 권한 불필요)
exports.getPublicRanking = async (req, res) => {
    try {
        const { limit = 10 } = req.query;
        const maxLimit = Math.min(parseInt(limit), 50); // 최대 50명까지

        // 공개적으로 보여줄 사용자 정보만 조회 (민감한 정보 제외)
        const usersResult = await db.query(`
            SELECT 
                username, level, experience, title, special_title, created_at
            FROM users 
            WHERE level > 0  -- 레벨이 0보다 큰 사용자만
            ORDER BY level DESC, experience DESC
            LIMIT $1
        `, [maxLimit]);

        // 각 사용자의 레벨 정보 계산
        const rankedUsers = usersResult.rows.map((user, index) => {
            const levelInfo = calculateLevel(user.experience);
            return {
                rank: index + 1,
                username: user.username,
                level: user.level,
                experience: user.experience,
                title: user.title,
                special_title: user.special_title,
                levelInfo: levelInfo,
                // 가입일을 상대적 시간으로 표시
                joinedDaysAgo: Math.floor((new Date() - new Date(user.created_at)) / (1000 * 60 * 60 * 24))
            };
        });

        res.status(200).json({
            success: true,
            ranking: rankedUsers,
            totalCount: rankedUsers.length,
            timestamp: new Date().toISOString()
        });

    } catch (err) {
        res.status(500).json({ 
            success: false,
            message: '랭킹 정보를 가져오는 중 오류가 발생했습니다.' 
        });
    }
};

// 랭킹 통계 조회 (공개)
exports.getRankingStats = async (req, res) => {
    try {
        // 기본 통계
        const statsResult = await db.query(`
            SELECT 
                COUNT(*) as total_users,
                AVG(level) as avg_level,
                MAX(level) as max_level,
                SUM(experience) as total_experience
            FROM users 
            WHERE level > 0
        `);

        const stats = statsResult.rows[0];

        // 레벨별 분포
        const levelDistResult = await db.query(`
            SELECT 
                level,
                COUNT(*) as user_count
            FROM users 
            WHERE level > 0
            GROUP BY level 
            ORDER BY level ASC
        `);

        res.status(200).json({
            success: true,
            stats: {
                totalUsers: parseInt(stats.total_users),
                averageLevel: Math.round(parseFloat(stats.avg_level) || 0),
                maxLevel: parseInt(stats.max_level) || 1,
                totalExperience: parseInt(stats.total_experience) || 0,
                levelDistribution: levelDistResult.rows
            }
        });

    } catch (err) {
        res.status(500).json({ 
            success: false,
            message: '통계 정보를 가져오는 중 오류가 발생했습니다.' 
        });
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