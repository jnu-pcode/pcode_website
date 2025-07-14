const db = require('../../db');

exports.getProblems = async (req, res) => {
    // API 캐시 방지 헤더
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');

    const { category, difficulty } = req.query; // difficulty 필드 추가
    const queryParams = [];
    let queryText = 'SELECT id, title, difficulty, category, is_solved FROM problems WHERE 1=1';

    if (category && category !== 'all') {
        queryParams.push(category);
        queryText += ` AND category = $${queryParams.length}`;
    }
    
    if (difficulty) {
        queryParams.push(difficulty);
        queryText += ` AND difficulty = $${queryParams.length}`;
    }

    try {
        const problems = await db.query(queryText, queryParams);
        
        // 여기에 유저의 해결 여부 로직 추가 (user_solves 테이블)
        
        res.status(200).json({ problems: problems.rows });
    } catch (err) {
        console.error('Error fetching problems:', err.stack);
        res.status(500).json({ message: '문제 목록을 가져오는 데 실패했습니다.' });
    }
};

const Docker = require('dockerode');
//const docker = new Docker({ socketPath: '/var/run/docker.sock' }); // 리눅스 환경 경로
const docker = new Docker({ socketPath: '//./pipe/docker_engine' }); // 윈도우 환경 경로 예시

exports.startProblem = async (req, res) => {
    const { problem_id } = req.params;

    try {
        const problem = await db.query('SELECT * FROM problems WHERE id = $1', [problem_id]);
        if (problem.rows.length === 0) {
            return res.status(404).json({ message: '문제를 찾을 수 없습니다.' });
        }

        const problemData = problem.rows[0];

        // 랜덤 포트 생성 (1024 ~ 49151)
        const randomPort = Math.floor(Math.random() * (49151 - 1024 + 1)) + 1024;
        const portBinding = {
            '80/tcp': [{ HostPort: String(randomPort) }]
        };

        const container = await docker.createContainer({
            Image: problemData.docker_image,
            Tty: false,
            ExposedPorts: {
                '80/tcp': {}
            },
            HostConfig: {
                PortBindings: portBinding
            }
        });

        await container.start();

        res.status(200).json({
            message: '문제가 시작되었습니다.',
            container_id: container.id,
            host: process.env.PUBLIC_IP || 'localhost',
            port: randomPort
        });

    } catch (err) {
        console.error('Docker start error:', err);
        res.status(500).json({ message: '문제 시작에 실패했습니다. 서버 로그를 확인하세요.' });
    }
};

exports.submitFlag = async (req, res) => {
    const { problem_id } = req.params;
    const { flag } = req.body;
    
    // 이 예제에서는 사용자 ID를 1로 고정합니다.
    const userId = 1;

    try {
        const problem = await db.query('SELECT * FROM problems WHERE id = $1', [problem_id]);
        if (problem.rows.length === 0) {
            return res.status(404).json({ message: '문제를 찾을 수 없습니다.' });
        }

        const problemData = problem.rows[0];

        if (problemData.flag.trim() === flag.trim()) {
            // 정답인 경우
            await db.query(
                'INSERT INTO user_solves (user_id, problem_id, is_solved) VALUES ($1, $2, TRUE) ON CONFLICT DO NOTHING',
                [userId, problem_id]
            );
            return res.status(200).json({ message: '정답입니다! 문제가 해결되었습니다.' });
        } else {
            // 오답인 경우
            return res.status(400).json({ message: '오답입니다. 다시 시도해 보세요.' });
        }

    } catch (err) {
        console.error('Submit flag error:', err);
        res.status(500).json({ message: '서버 오류가 발생했습니다.' });
    }
};