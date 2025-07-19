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
 * - 2025-07-15 00:35: 관리자 인증 미들웨어 (authorizeAdmin) 추가 및 적용
 * - 2025-07-15 01:45: map.html을 비로그인 사용자도 접근 가능하도록 authenticateToken 미들웨어 제거
 * - 2025-07-19 09:30: URL에서 .html 확장자 제거를 위한 라우트 수정
 * - 2025-07-19 09:45: 사용자 위치 저장 API 라우트 추가
 */
const express = require('express');
const dotenv = require('dotenv');
const path = require('path');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const cookieParser = require('cookie-parser');

const db = require('./src/db');
const authController = require('./src/features/authentication/auth.controller');
const wargameController = require('./src/features/wargame/wargame.controller');
const userController = require('./src/features/user/user.controller');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET;

app.use(express.json());
app.use(cookieParser());

// 파일 업로드 설정을 함수로 분리하여 재사용 가능하게 함
const getUploader = (destPath) => multer({ dest: destPath });

// JWT 인증 미들웨어 (이제 Authorization 헤더 대신 쿠키 확인)
const authenticateToken = (req, res, next) => {
  const token = req.cookies.token;

  if (token == null) {
      console.log('authenticateToken: 토큰 없음. 401 반환');
      if (req.accepts('html')) {
          return res.redirect('/login.html?message=' + encodeURIComponent('로그인이 필요합니다.'));
      }
      return res.status(401).json({ message: '인증 토큰이 필요합니다.' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
      if (err) {
          console.log('authenticateToken: 토큰 유효하지 않음. 403 반환', err.message);
          if (req.accepts('html')) {
              res.clearCookie('token');
              return res.redirect('/login.html?message=' + encodeURIComponent('인증이 만료되었거나 유효하지 않습니다.'));
          }
          return res.status(403).json({ message: '유효하지 않은 토큰입니다.' });
      }
      req.user = user;
      console.log('authenticateToken: 사용자 인증됨. req.user:', req.user);
      next();
  });
};

// 관리자 권한 확인 미들웨어
const authorizeAdmin = (req, res, next) => {
  console.log('authorizeAdmin: req.user:', req.user);
  if (!req.user || !req.user.is_admin) {
      console.log('authorizeAdmin: 관리자 권한 없음. 403 반환');
      if (req.accepts('html')) {
          return res.redirect('/login.html?message=' + encodeURIComponent('관리자 권한이 필요합니다.'));
      }
      return res.status(403).json({ message: '관리자 권한이 필요합니다.' });
  }
  console.log('authorizeAdmin: 관리자 권한 확인됨.');
  next();
};

// 동아리원 권한 확인 미들웨어
const authorizeMember = (req, res, next) => {
  console.log('authorizeMember: req.user:', req.user);
  if (!req.user || !req.user.is_member) {
      console.log('authorizeMember: 동아리원 권한 없음. 403 반환');
      if (req.accepts('html')) {
          return res.redirect('/login.html?message=' + encodeURIComponent('동아리원 권한이 필요합니다.'));
      }
      return res.status(403).json({ message: '동아리원 권한이 필요합니다.' });
  }
  console.log('authorizeMember: 동아리원 권한 확인됨.');
  next();
};

// --- 모든 라우트 정의 시작 ---

// 페이지 라우트 (이제 모두 인증/권한 미들웨어 적용)
app.get('/', (req, res) => { res.redirect('/login'); }); // 여전히 리다이렉트

app.get('/login', (req, res) => { // 로그인 페이지는 모든 접근 허용
    res.sendFile(path.join(__dirname, 'public/login.html'));
});

// 이제 모든 페이지는 인증된 사용자만 접근 가능
app.get('/wargame', authenticateToken, (req, res) => {
    res.sendFile(path.join(__dirname, 'public/wargame.html'));
});

app.get('/wargame/create', authenticateToken, authorizeMember, (req, res) => {
    res.sendFile(path.join(__dirname, 'public/wargame/create.html'));
});

app.get('/admin', authenticateToken, authorizeAdmin, (req, res) => {
    res.sendFile(path.join(__dirname, 'public/admin.html'));
});

// map.html은 인증 없이도 접근 가능
app.get('/map', (req, res) => { // <-- authenticateToken 제거
  res.sendFile(path.join(__dirname, 'public/map.html'));
});

// API 라우트
app.post('/api/auth/register', authController.register); // 회원가입 (인증 필요 없음)
app.post('/api/auth/login', authController.login); // 로그인 (인증 필요 없음)

// 워게임 관련 API (인증 미들웨어 적용)
app.get('/api/wargames', authenticateToken, wargameController.getProblems); // 문제 목록 조회 (로그인된 사용자면 누구나)
app.post('/api/wargames/:problem_id/start', authenticateToken, wargameController.startProblem); // 문제 시작 (로그인된 사용자면 누구나)
app.post('/api/wargames/:problem_id/submit', authenticateToken, wargameController.submitFlag); // Flag 제출 (로그인된 사용자면 누구나)
app.post('/api/wargames/stop/:containerId', authenticateToken, wargameController.stopProblem); // 컨테이너 중지/삭제 (로그인된 사용자면 누구나)

// 동아리원 권한이 필요한 API (문제 생성)
app.post('/api/wargames/create', authenticateToken, authorizeMember, getUploader('docker-challenges/').single('dockerfile'), wargameController.createProblem);

// 관리자 권한이 필요한 API (문제 삭제)
app.delete('/api/wargames/:problem_id', authenticateToken, authorizeAdmin, wargameController.deleteProblem);

// 사용자 위치 저장 API (FormData와 JSON 모두 처리)
app.post('/api/user/position', authenticateToken, getUploader('uploads/').none(), userController.savePosition);
app.get('/api/user/me', authenticateToken, userController.getUserInfo); // <-- 새 라우트 추가

// --- 모든 라우트 정의 끝 ---

// 정적 파일 미들웨어 (가장 마지막에 위치)
// 위에서 정의된 라우트들에서 처리되지 않은 요청들만 public 폴더의 정적 파일로 제공됩니다.
app.use(express.static('public'));

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