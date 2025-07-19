const db = require('../../db');
const Docker = require('dockerode');
const fs = require('fs');
const path = require('path');
const unzipper = require('unzipper');
const tar = require('tar-fs');
//const docker = new Docker({ socketPath: '/var/run/docker.sock' }); // 리눅스 환경 경로
const docker = new Docker({ socketPath: '//./pipe/docker_engine' }); // 윈도우 환경 경로 예시

exports.getProblems = async (req, res) => {
    const { category, difficulty } = req.query;
    const userId = req.user.userId || req.user.id; // userId와 id 둘 다 체크
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
        res.status(500).json({ message: '문제 시작에 실패했습니다. 서버 로그를 확인하세요.' });
    }
};

// Flag를 제출하는 API
exports.submitFlag = async (req, res) => {
    const { problem_id } = req.params;
    const { flag } = req.body;
    const userId = req.user.userId || req.user.id; // userId와 id 둘 다 체크

    try {
        // 트랜잭션 시작 (해결 기록과 경험치 추가를 원자적으로 처리)
        await db.query('BEGIN');
        
        const problem = await db.query('SELECT * FROM problems WHERE id = $1', [problem_id]);
        if (problem.rows.length === 0) {
            await db.query('ROLLBACK');
            return res.status(404).json({ message: '문제를 찾을 수 없습니다.' });
        }

        const problemData = problem.rows[0];

        if (problemData.flag.trim() === flag.trim()) {
            // 1. 이미 해결한 문제인지 확인 (중복 해결 방지)
            const existingSolve = await db.query(
                'SELECT * FROM user_solves WHERE user_id = $1 AND problem_id = $2',
                [userId, problem_id]
            );
            
            const isFirstSolve = existingSolve.rows.length === 0;
            
            // 2. 해결 기록 저장
            await db.query(
                'INSERT INTO user_solves (user_id, problem_id, is_solved) VALUES ($1, $2, TRUE) ON CONFLICT DO NOTHING',
                [userId, problem_id]
            );
            
            // 3. 경험치 지급 (처음 해결하는 경우에만)
            if (isFirstSolve) {
                
                // 레벨 시스템 API 호출 (내부 API)
                const levelResponse = await fetch('http://localhost:5000/api/level/experience', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        userId: userId,
                        actionType: 'wargame_solve',
                        xpGained: null, // titles.config에서 자동 계산
                        difficulty: problemData.difficulty,
                        description: `워게임 문제 해결: ${problemData.title} (난이도 ${problemData.difficulty})`,
                        internalKey: process.env.INTERNAL_API_KEY
                    })
                });
                
                if (levelResponse.ok) {
                    const levelData = await levelResponse.json();
                    
                    // 트랜잭션 커밋
                    await db.query('COMMIT');
                    
                    // 레벨업이 발생한 경우 특별 메시지 전송
                    if (levelData.leveledUp) {
                        return res.status(200).json({ 
                            message: '정답입니다! 문제가 해결되었습니다.',
                            levelUp: true,
                            newLevel: levelData.newLevel,
                            newTitle: levelData.newTitle,
                            experience: levelData.totalExperience
                        });
                    } else {
                        return res.status(200).json({ 
                            message: '정답입니다! 문제가 해결되었습니다.',
                            levelUp: false,
                            experience: levelData.totalExperience
                        });
                    }
                } else {
                    // 경험치 지급이 실패해도 문제 해결은 인정
                    await db.query('COMMIT');
            return res.status(200).json({ message: '정답입니다! 문제가 해결되었습니다.' });
                }
            } else {
                // 이미 해결한 문제인 경우
                await db.query('COMMIT');
                return res.status(200).json({ message: '이미 해결한 문제입니다.' });
            }
        } else {
            await db.query('ROLLBACK');
            return res.status(400).json({ message: '오답입니다. 다시 시도해 보세요.' });
        }
    } catch (err) {
        await db.query('ROLLBACK');
        res.status(500).json({ message: '서버 오류가 발생했습니다.' });
    }
};

// 컨테이너를 중지하고 삭제하는 API
exports.stopProblem = async (req, res) => {
    const { containerId } = req.params;

    // containerId 유효성 검사
    if (!containerId || containerId === 'undefined' || containerId.trim() === '') {
        return res.status(400).json({ 
            message: '유효하지 않은 컨테이너 ID입니다.',
            containerId: containerId 
        });
    }

    try {
        const container = docker.getContainer(containerId);
        
        // 컨테이너 존재 여부 확인
        const containerInfo = await container.inspect().catch(() => null);
        if (!containerInfo) {
            return res.status(404).json({ 
                message: '해당 컨테이너를 찾을 수 없습니다. 이미 종료되었을 수 있습니다.',
                containerId: containerId 
            });
        }

        // 컨테이너가 실행 중인 경우에만 중지
        if (containerInfo.State.Running) {
        await container.stop();
        }
        
        // 컨테이너 삭제
        await container.remove();
        
        res.status(200).json({ 
            message: '컨테이너가 성공적으로 삭제되었습니다.',
            containerId: containerId 
        });
    } catch (err) {
        
        // 404 오류 (컨테이너 없음)는 이미 삭제된 것으로 간주
        if (err.statusCode === 404) {
            return res.status(200).json({ 
                message: '컨테이너가 이미 삭제되었거나 존재하지 않습니다.',
                containerId: containerId 
            });
        }
        
        res.status(500).json({ 
            message: '컨테이너 삭제에 실패했습니다.',
            error: err.message,
            containerId: containerId 
        });
    }
};

// 새로운 문제 생성 API
exports.createProblem = async (req, res) => {
    const { title, description, category, difficulty, flag } = req.body;

    if (!req.file) {
        return res.status(400).json({ message: '문제 파일(ZIP)이 업로드되지 않았습니다.' });
    }

    const { filename, path: zipFilePath } = req.file;
    const extractedDir = path.join(__dirname, '../../docker-challenges', path.parse(filename).name + '_extracted');

    try {
        // 1. ZIP 파일 압축 해제
        await fs.createReadStream(zipFilePath)
            .pipe(unzipper.Extract({ path: extractedDir }))
            .promise();

        // 2. 압축 해제된 폴더를 타르볼(tarball)로 스트리밍하여 Docker에 전달
        // 문제 제목을 기반으로 태그 생성 (공백 및 특수문자 제거, 소문자 변환)
        const sanitizedTitle = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
        const imageTag = `pcode-wargame-${sanitizedTitle}:${Date.now()}`; // <-- 이 부분을 수정했습니다.
        
        // tar-fs를 사용하여 디렉토리 내용을 스트림으로 만듭니다.
        const buildStream = await docker.buildImage(tar.pack(extractedDir), { t: imageTag });

        // 빌드 진행 상황을 로그로 출력 (선택 사항)
        await new Promise((resolve, reject) => {
            docker.modem.followProgress(buildStream, (err, res) => {
                if (err) {
                    return reject(err);
                }
                // Docker 빌드 로그를 콘솔에 출력
                res.forEach(item => {
                    if (item.stream) process.stdout.write(item.stream);
                });
                resolve(res);
            });
        });

        // 3. 데이터베이스에 문제 정보 삽입
        const result = await db.query(
            'INSERT INTO problems (title, description, docker_image, flag, difficulty, category) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
            [title, description, imageTag, flag, difficulty, category]
        );

        // 4. 임시 파일 및 폴더 삭제
        fs.unlinkSync(zipFilePath); // 원본 ZIP 파일 삭제
        fs.rmdirSync(extractedDir, { recursive: true }); // 압축 해제된 폴더 삭제

        res.status(201).json({
            message: '문제가 성공적으로 등록되고 이미지가 빌드되었습니다.',
            problem: result.rows[0]
        });
    } catch (err) {
        res.status(500).json({ message: '문제 등록에 실패했습니다. 서버 로그를 확인하세요.' });
    }
};

exports.deleteProblem = async (req, res) => {
    const { problem_id } = req.params;

    try {
        // user_solves 테이블에서 해당 문제 해결 기록 먼저 삭제
        await db.query('DELETE FROM user_solves WHERE problem_id = $1', [problem_id]);

        // problems 테이블에서 문제 삭제
        const result = await db.query('DELETE FROM problems WHERE id = $1 RETURNING docker_image', [problem_id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ message: '삭제할 문제를 찾을 수 없습니다.' });
        }

        const dockerImageName = result.rows[0].docker_image;
        
        // 연결된 Docker 이미지 삭제 (선택 사항)
        if (dockerImageName) {
            try {
                const image = docker.getImage(dockerImageName);
                await image.remove({ force: true }); // 강제 삭제
            } catch (dockerErr) {
                // 이미지가 존재하지 않거나 사용 중일 수 있으므로 오류를 발생시키지 않음
            }
        }

        res.status(200).json({ message: '문제가 성공적으로 삭제되었습니다.' });
    } catch (err) {
        res.status(500).json({ message: '문제 삭제에 실패했습니다.' });
    }
};