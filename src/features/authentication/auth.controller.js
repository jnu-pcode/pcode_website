const db = require('../../db');
const bcrypt = require('bcrypt');
const dotenv = require('dotenv'); // dotenv 모듈 불러오기
const jwt = require('jsonwebtoken');

dotenv.config(); // 환경 변수 로드

// .env 파일에서 JWT 비밀 키를 가져옵니다.
const JWT_SECRET = process.env.JWT_SECRET;
// .env 파일에서 동아리 인증 코드를 가져옵니다.
const CLUB_AUTH_CODE = process.env.CLUB_AUTH_CODE;

exports.register = async (req, res) => {
    const { username, password, auth_code } = req.body; // auth_code는 이제 선택 사항

    // 1. 유효성 검사: 아이디, 비밀번호는 필수
    if (!username || !password) {
        return res.status(400).json({ message: '아이디와 비밀번호는 필수입니다.' });
    }

    let isMember = false; // 기본값은 일반 회원
    if (auth_code) { // 인증 코드가 입력되었다면
        if (auth_code === CLUB_AUTH_CODE) { // 인증 코드 일치 확인
            isMember = true; // 동아리 회원으로 설정
        } else {
            return res.status(401).json({ message: '유효하지 않은 인증 코드입니다.' });
        }
    }

    try {
        // 2. 사용자 이름 중복 확인
        const userExists = await db.query('SELECT * FROM users WHERE username = $1', [username]);
        if (userExists.rows.length > 0) {
            return res.status(409).json({ message: '이미 존재하는 사용자 이름입니다.' });
        }

        // 3. 비밀번호 해시
        const hashedPassword = await bcrypt.hash(password, 10);

        // 4. DB에 사용자 정보 저장: is_member는 인증 코드에 따라, is_admin은 항상 false
        await db.query(
            'INSERT INTO users (username, password_hash, is_member, is_admin, created_at) VALUES ($1, $2, $3, $4, NOW())',
            [username, hashedPassword, isMember, false] // isMember 변수 사용
        );

        res.status(201).json({ message: '회원가입이 성공적으로 완료되었습니다.' });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: '서버 오류가 발생했습니다.' });
    }
};

exports.login = async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
      return res.status(400).json({ message: '아이디와 비밀번호를 모두 입력해야 합니다.' });
  }

  try {
      const userResult = await db.query('SELECT * FROM users WHERE username = $1', [username]);
      const user = userResult.rows[0];
      
      if (!user) {
          return res.status(401).json({ message: '존재하지 않는 사용자입니다.' });
      }

      const passwordMatch = await bcrypt.compare(password, user.password_hash);
      
      if (!passwordMatch) {
          return res.status(401).json({ message: '비밀번호가 올바르지 않습니다.' });
      }

      const token = jwt.sign(
          { userId: user.id, username: user.username, is_admin: user.is_admin, is_member: user.is_member },
          JWT_SECRET,
          { expiresIn: '1h' }
      );

      // JWT 토큰을 HttpOnly 쿠키로 설정
      res.cookie('token', token, {
          httpOnly: true, // JavaScript에서 접근 불가 (보안 강화)
          secure: process.env.NODE_ENV === 'production', // HTTPS에서만 전송 (운영 환경)
          maxAge: 3600000 // 1시간 (밀리초)
      });

      res.status(200).json({ 
          message: '로그인이 성공적으로 완료되었습니다.',
          // 클라이언트에는 토큰을 직접 보내지 않습니다. 쿠키로 전송됨.
      });

  } catch (err) {
      console.error(err);
      res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
};