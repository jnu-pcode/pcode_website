const db = require('../../db');

// 사용자 위치를 저장하는 API
exports.savePosition = async (req, res) => {
    console.log('위치 저장 요청 수신 - Content-Type:', req.headers['content-type']);
    console.log('요청 Body:', req.body);
    console.log('사용자 정보:', req.user);
    
    if (!req.user || !req.user.userId) {
        console.log('인증되지 않은 요청입니다.');
        return res.status(401).json({ message: '인증이 필요합니다.' });
    }

    let x_position, y_position;
    
    // FormData로 온 요청인지 JSON으로 온 요청인지 확인
    if (req.headers['content-type'] && req.headers['content-type'].includes('multipart/form-data')) {
        // sendBeacon으로 온 FormData 요청
        x_position = req.body.x_position;
        y_position = req.body.y_position;
    } else {
        // 일반 fetch로 온 JSON 요청
        x_position = req.body.x_position;
        y_position = req.body.y_position;
    }
    
    console.log('파싱된 위치 정보:', { x_position, y_position });
    
    if (x_position === undefined || y_position === undefined) {
        console.log('위치 정보가 누락되었습니다.');
        return res.status(400).json({ message: '위치 정보가 필요합니다.' });
    }

    try {
        await db.query('UPDATE users SET x_position = $1, y_position = $2 WHERE id = $3', [x_position, y_position, req.user.userId]);
        console.log('위치 저장 성공:', { userId: req.user.userId, x_position, y_position });
        res.status(200).json({ message: '위치가 성공적으로 저장되었습니다.' });
    } catch (err) {
        console.error('위치 저장 중 오류 발생:', err);
        res.status(500).json({ message: '위치를 저장하는 동안 오류가 발생했습니다.' });
    }
};

// 사용자 정보를 가져오는 API
exports.getUserInfo = async (req, res) => {
    console.log('사용자 정보 요청 수신:', req.user);
    
    if (!req.user || !req.user.userId) {
        console.log('인증되지 않은 사용자 정보 요청');
        return res.status(401).json({ message: '인증이 필요합니다.' });
    }

    try {
        const userResult = await db.query('SELECT id, username, is_admin, is_member, x_position, y_position FROM users WHERE id = $1', [req.user.userId]);
        const user = userResult.rows[0];
        
        if (!user) {
            console.log('사용자를 찾을 수 없습니다:', req.user.userId);
            return res.status(404).json({ message: '사용자를 찾을 수 없습니다.' });
        }

        console.log('사용자 정보 반환:', user);
        res.status(200).json({ 
            user: {
                userId: user.id,
                username: user.username,
                is_admin: user.is_admin,
                is_member: user.is_member,
                x_position: user.x_position,
                y_position: user.y_position
            }
        });
    } catch (err) {
        console.error('사용자 정보 조회 중 오류 발생:', err);
        res.status(500).json({ message: '사용자 정보를 가져오는 동안 오류가 발생했습니다.' });
    }
};