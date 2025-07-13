// src/features/authentication/auth.controller.js

const db = require('../../db');
const bcrypt = require('bcrypt');

// 기획 문서에서 정한 동아리 인증 코드입니다.
const CLUB_AUTH_CODE = 'pcode1234'; 

exports.register = async (req, res) => {
  const { username, password, auth_code } = req.body;

  // 1. 유효성 검사 (아주 기본적인 수준)
  if (!username || !password || !auth_code) {
    return res.status(400).json({ message: '모든 필드를 입력해야 합니다.' });
  }

  // 2. 인증 코드 확인
  if (auth_code !== CLUB_AUTH_CODE) {
    return res.status(401).json({ message: '유효하지 않은 인증 코드입니다.' });
  }

  try {
    // 3. 사용자 이름 중복 확인
    const userExists = await db.query('SELECT * FROM users WHERE username = $1', [username]);
    if (userExists.rows.length > 0) {
      return res.status(409).json({ message: '이미 존재하는 사용자 이름입니다.' });
    }

    // 4. 비밀번호 해시
    const hashedPassword = await bcrypt.hash(password, 10);

    // 5. DB에 사용자 정보 저장
    await db.query(
      'INSERT INTO users (username, password_hash, is_member, created_at) VALUES ($1, $2, $3, NOW())',
      [username, hashedPassword, true]
    );

    res.status(201).json({ message: '회원가입이 성공적으로 완료되었습니다.' });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
};

const jwt = require('jsonwebtoken');

// .env 파일에서 JWT 비밀 키를 가져옵니다.
const JWT_SECRET = process.env.JWT_SECRET;

exports.login = async (req, res) => {
  const { username, password } = req.body;

  // 1. 유효성 검사
  if (!username || !password) {
    return res.status(400).json({ message: '아이디와 비밀번호를 모두 입력해야 합니다.' });
  }

  try {
    // 2. DB에서 사용자 찾기
    const userResult = await db.query('SELECT * FROM users WHERE username = $1', [username]);
    const user = userResult.rows[0];
    
    if (!user) {
      return res.status(401).json({ message: '존재하지 않는 사용자입니다.' });
    }

    // 3. 비밀번호 일치 여부 확인
    const passwordMatch = await bcrypt.compare(password, user.password_hash);
    
    if (!passwordMatch) {
      return res.status(401).json({ message: '비밀번호가 올바르지 않습니다.' });
    }

    // 4. 로그인 성공 시 JWT 토큰 생성
    const token = jwt.sign(
      { userId: user.id, username: user.username },
      JWT_SECRET,
      { expiresIn: '1h' } // 토큰 유효기간 1시간
    );

    res.status(200).json({ 
      message: '로그인이 성공적으로 완료되었습니다.',
      token: token,
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
};