// server.js

// 필요한 모듈들을 불러옵니다.
const express = require('express');
const { Pool } = require('pg');
const dotenv = require('dotenv');

// .env 파일의 환경 변수를 로드합니다.
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// JSON 요청 본문을 파싱하기 위한 미들웨어
app.use(express.json());

// PostgreSQL DB 연결을 위한 설정
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

// DB 연결 테스트
pool.connect((err, client, release) => {
  if (err) {
    return console.error('Error acquiring client', err.stack);
  }
  console.log('Successfully connected to the database!');
  release();
});

// 기본 라우트: 서버가 잘 작동하는지 확인하기 위함입니다.
app.get('/', (req, res) => {
  res.send('Welcome to the p.code Village Server!');
});

// 서버 시작
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});