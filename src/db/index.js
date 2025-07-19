/**
 * @file src/db/index.js
 * @description 데이터베이스 연결을 관리하고 쿼리 함수를 제공하는 모듈입니다.
 * * **변경 이력**
 * - 2025-07-14 01:00: 초기 Pool 객체와 쿼리 함수 export
 * - 2025-07-14 01:24: createTables 함수 추가 및 export
 * - 2025-07-14 01:24: dotenv 로딩을 이 파일에서 직접 하도록 수정
 * - 2025-07-14 01:32: 단계별 변경 기록을 주석으로 추가
 * - 2025-07-15 12:27: users 테이블 생성 쿼리에 is_admin 필드 추가
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
            is_admin BOOLEAN NOT NULL DEFAULT FALSE,
            x_position INT DEFAULT 0,
            y_position INT DEFAULT 0,
            created_at TIMESTAMP NOT NULL
        );
    `;

    const createProblemsTableQuery = `
        CREATE TABLE IF NOT EXISTS problems (
            id SERIAL PRIMARY KEY,
            title VARCHAR(255) NOT NULL,
            description TEXT,
            docker_image VARCHAR(255) NOT NULL,
            flag VARCHAR(255) NOT NULL,
            difficulty INT,
            category VARCHAR(255)
        );
    `;

    const createUserSolvesTableQuery = `
        CREATE TABLE IF NOT EXISTS user_solves (
            id SERIAL PRIMARY KEY,
            user_id INT,
            problem_id INT,
            is_solved BOOLEAN DEFAULT FALSE,
            solved_at TIMESTAMP NOT NULL DEFAULT NOW(),
            FOREIGN KEY (user_id) REFERENCES users(id),
            FOREIGN KEY (problem_id) REFERENCES problems(id)
        );
    `;

    try {
        console.log('Creating database tables...');
        await pool.query(createUsersTableQuery);
        await pool.query(createProblemsTableQuery);
        await pool.query(createUserSolvesTableQuery);
        console.log('Database tables created successfully or already exist.');

        // ALTER TABLE로 기존 테이블에 필드 추가 (is_admin 필드는 이미 수동으로 추가했으므로 여기서는 category만 확인)
        await pool.query(`
          DO $$ BEGIN
            IF NOT EXISTS (SELECT 1 FROM pg_attribute WHERE attrelid = 'problems'::regclass AND attname = 'category') THEN
              ALTER TABLE problems ADD COLUMN category VARCHAR(255);
            END IF;
          END $$;
        `);
        console.log('Database schema updated successfully.');

    } catch (err) {
        console.error('Error creating tables:', err.stack);
        throw err;
    }
}

module.exports = {
    query: (text, params) => pool.query(text, params),
    createTables,
};