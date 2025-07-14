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
 */

const express = require('express');
const dotenv = require('dotenv');
const db = require('./src/db');
const authController = require('./src/features/authentication/auth.controller');
const wargameController = require('./src/features/wargame/wargame.controller');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static('public')); // public 폴더를 정적 파일 서비스 경로로 설정

// API 라우트
app.post('/api/auth/register', authController.register); // 회원가입
app.post('/api/auth/login', authController.login); // 로그인
// 워게임 API 라우트
app.get('/api/wargames', wargameController.getProblems);
app.post('/api/wargames/:problem_id/start', wargameController.startProblem);
app.post('/api/wargames/:problem_id/submit', wargameController.submitFlag); // Flag 제출 라우트 추가


// 루트 URL로 접속하면 login.html로 리다이렉트
app.get('/', (req, res) => {
  res.redirect('/login.html');
});

// 새로운 워게임 페이지 라우트
app.get('/wargame.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/wargame.html'));
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
    process.exit(1); // 테이블 생성 실패 시 서버 종료
  });

// DB 연결 테스트
db.query('SELECT NOW()')
  .then(res => console.log('Successfully connected to the database!'))
  .catch(err => console.error('Error connecting to the database', err.stack));