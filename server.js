/**
 * @file server.js
 * @description p.code의 숲 프로젝트의 메인 서버 파일입니다.
 * * **변경 이력**
 * - 2025-07-14 01:00: 초기 서버 설정 (express, dotenv, pg 모듈 import)
 * - 2025-07-14 01:10: db 연결 테스트 로직 추가
 * - 2025-07-14 01:15: API 라우트 (`/api/auth/register`) 연결
 * - 2025-07-14 01:24: 테이블 생성 로직을 db 모듈에서 가져와 서버 시작 전에 실행하도록 수정
 * - 2025-07-14 01:32: 단계별 변경 기록을 주석으로 추가
 * - 2025-07-14 01:36: public 폴더를 정적 파일 서비스 경로로 추가
 * - 2025-07-14 13:49: 워게임 컨트롤러 추가
 * - 2025-07-14 16:05: 모든 라우트를 통합하고 경로를 재정비
 * - 2025-07-14 20:58: 모든 라우트, 미들웨어, 유틸리티를 통합한 최종본
 */
const express = require('express');
const dotenv = require('dotenv');
const path = require('path');
const jwt = require('jsonwebtoken');
const multer = require('multer');
// 파일 업로드 설정을 함수로 분리하여 재사용 가능하게 함
const getUploader = (destPath) => multer({ dest: destPath });

const db = require('./src/db');
const authController = require('./src/features/authentication/auth.controller');
const wargameController = require('./src/features/wargame/wargame.controller');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET;

app.use(express.json());

// public 폴더를 정적 파일 서비스 경로로 설정
app.use(express.static('public'));

// JWT 인증 미들웨어
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token == null) {
      return res.status(401).json({ message: '인증 토큰이 필요합니다.' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
      if (err) {
          return res.status(403).json({ message: '유효하지 않은 토큰입니다.' });
      }
      req.user = user;
      next();
  });
};

// API 라우트
app.post('/api/auth/register', authController.register);
app.post('/api/auth/login', authController.login);

// 워게임 관련 API에만 인증 미들웨어 적용
app.get('/api/wargames', authenticateToken, wargameController.getProblems);
app.post('/api/wargames/:problem_id/start', authenticateToken, wargameController.startProblem);
app.post('/api/wargames/:problem_id/submit', authenticateToken, wargameController.submitFlag);
app.post('/api/wargames/stop/:containerId', authenticateToken, wargameController.stopProblem);
app.post('/api/wargames/create', getUploader('docker-challenges/').single('dockerfile'), wargameController.createProblem);


//app.post('/api/users/house/upload', getUploader('user-houses/').single('htmlfile'), userHouseController.uploadHtml);

// 페이지 라우트
app.get('/', (req, res) => {
    res.redirect('/login.html');
});

app.get('/wargame.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'public/wargame.html'));
});

app.get('/wargame/create.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/wargame/create.html'));
});

// 서버 시작 전 테이블 생성
db.createTables()
  .then(() => {
    console.log('Database tables are ready.');
    app.listen(PORT, () => {
      console.log(`Server is running on http://localhost:${PORT}`);
    });
  })
  .catch(err => {
    console.error('Failed to create database tables:', err);
    process.exit(1);
  });

// DB 연결 테스트
db.query('SELECT NOW()')
  .then(res => console.log('Successfully connected to the database!'))
  .catch(err => console.error('Error connecting to the database', err.stack));