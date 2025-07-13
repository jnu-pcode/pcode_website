/**
 * @file src/db/index.js
 * @description 데이터베이스 연결을 관리하고 쿼리 함수를 제공하는 모듈입니다.
 * * **변경 이력**
 * - 2025-07-14 01:00: 초기 Pool 객체와 쿼리 함수 export
 * - 2025-07-14 01:24: createTables 함수 추가 및 export
 * - 2025-07-14 01:24: dotenv 로딩을 이 파일에서 직접 하도록 수정
 * - 2025-07-14 01:32: 단계별 변경 기록을 주석으로 추가
 */

const { Pool } = require('pg');
const dotenv = require('dotenv');

dotenv.config();

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: String(process.env.DB_PASSWORD).trim(), 
  port: process.env.DB_PORT,
});

async function createTables() {
  const createUsersTableQuery = `
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      username VARCHAR(255) UNIQUE NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      is_member BOOLEAN NOT NULL DEFAULT FALSE,
      created_at TIMESTAMP NOT NULL
    );
  `;

  try {
    console.log('Creating "users" table...');
    await pool.query(createUsersTableQuery);
    console.log('Table "users" created successfully or already exists.');
  } catch (err) {
    console.error('Error creating table:', err.stack);
  }
}

module.exports = {
  query: (text, params) => pool.query(text, params),
  createTables,
};