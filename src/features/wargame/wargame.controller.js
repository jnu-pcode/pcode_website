const db = require('../../db');
const Docker = require('dockerode');
const fs = require('fs');
const path = require('path');
const unzipper = require('unzipper');
//const docker = new Docker({ socketPath: '/var/run/docker.sock' }); // 리눅스 환경 경로
const docker = new Docker({ socketPath: '//./pipe/docker_engine' }); // 윈도우 환경 경로 예시

exports.getProblems = async (req, res) => {
    const { category, difficulty } = req.query;
    const userId = req.user.id;
    const queryParams = [];

    let queryText = `
        SELECT
            p.id,
            p.title,
            p.difficulty,
            p.category,
            us.is_solved IS NOT NULL AS is_solved
        FROM problems p
        LEFT JOIN user_solves us
        ON us.user_id = $1 AND us.problem_id = p.id
        WHERE 1=1
    `;
    
    let paramIndex = 1;
    queryParams.push(userId);
    
    if (category && category !== 'all') {
        paramIndex++;
        queryParams.push(category);
        queryText += ` AND p.category = $${paramIndex}`;
    }
    
    if (difficulty) {
        paramIndex++;
        queryParams.push(difficulty);
        queryText += ` AND p.difficulty = $${paramIndex}`;
    }
    
    queryText += ' ORDER BY p.difficulty';

    try {
        const problems = await db.query(queryText, queryParams);
        
        res.status(200).json({ problems: problems.rows });
    } catch (err) {
        console.error('Error fetching problems:', err.stack);
        res.status(500).json({ message: '문제 목록을 가져오는 데 실패했습니다.' });
    }
};

// 특정 문제를 시작하는 API
exports.startProblem = async (req, res) => {
    const { problem_id } = req.params;

    try {
        const problem = await db.query('SELECT * FROM problems WHERE id = $1', [problem_id]);
        if (problem.rows.length === 0) {
            return res.status(404).json({ message: '문제를 찾을 수 없습니다.' });
        }

        const problemData = problem.rows[0];

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
            containerId: container.id,
            host: process.env.PUBLIC_IP || 'localhost',
            port: randomPort
        });

    } catch (err) {
        console.error('Docker start error:', err);
        res.status(500).json({ message: '문제 시작에 실패했습니다. 서버 로그를 확인하세요.' });
    }
};

// Flag를 제출하는 API
exports.submitFlag = async (req, res) => {
    const { problem_id } = req.params;
    const { flag } = req.body;
    const userId = req.user.id;

    try {
        const problem = await db.query('SELECT * FROM problems WHERE id = $1', [problem_id]);
        if (problem.rows.length === 0) {
            return res.status(404).json({ message: '문제를 찾을 수 없습니다.' });
        }

        const problemData = problem.rows[0];

        if (problemData.flag.trim() === flag.trim()) {
            await db.query(
                'INSERT INTO user_solves (user_id, problem_id, is_solved) VALUES ($1, $2, TRUE) ON CONFLICT DO NOTHING',
                [userId, problem_id]
            );
            return res.status(200).json({ message: '정답입니다! 문제가 해결되었습니다.' });
        } else {
            return res.status(400).json({ message: '오답입니다. 다시 시도해 보세요.' });
        }
    } catch (err) {
        console.error('Submit flag error:', err);
        res.status(500).json({ message: '서버 오류가 발생했습니다.' });
    }
};

// 컨테이너를 중지하고 삭제하는 API
exports.stopProblem = async (req, res) => {
    const { containerId } = req.params;

    try {
        const container = docker.getContainer(containerId);
        await container.stop();
        await container.remove();
        res.status(200).json({ message: '컨테이너가 성공적으로 삭제되었습니다.' });
    } catch (err) {
        console.error('Docker stop error:', err);
        res.status(500).json({ message: '컨테이너 삭제에 실패했습니다.' });
    }
};

// 새로운 문제 생성 API
exports.createProblem = async (req, res) => {
    const { title, description, category, difficulty, flag } = req.body;

    // 파일이 업로드되었는지 확인
    if (!req.file) {
        return res.status(400).json({ message: '파일이 업로드되지 않았습니다.' });
    }

    const { filename, path: zipFilePath } = req.file;

    try {
        const tempDir = path.join(__dirname, '../../docker-challenges', filename);
        
        // ZIP 파일 압축 해제
        await fs.createReadStream(zipFilePath)
            .pipe(unzipper.Extract({ path: tempDir }))
            .promise();

        // Docker 이미지 빌드
        const imageTag = `custom-problem-${filename}:${Date.now()}`;
        const buildStream = await docker.buildImage(tempDir, { t: imageTag });

        // 빌드 진행 상황을 로그로 출력
        await new Promise((resolve, reject) => {
            docker.modem.followProgress(buildStream, (err, res) => err ? reject(err) : resolve(res));
        });

        // 데이터베이스에 문제 정보 삽입
        const result = await db.query(
            'INSERT INTO problems (title, description, docker_image, flag, difficulty, category) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
            [title, description, imageTag, flag, difficulty, category]
        );

        // 임시 파일 및 폴더 삭제
        fs.unlinkSync(zipFilePath);
        fs.rmdirSync(tempDir, { recursive: true });

        res.status(201).json({
            message: '문제가 성공적으로 등록되었습니다.',
            problem: result.rows[0]
        });
    } catch (err) {
        console.error('Error creating problem:', err.stack);
        res.status(500).json({ message: '문제 등록에 실패했습니다. 서버 로그를 확인하세요.' });
    }
};