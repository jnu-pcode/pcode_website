# 🚀 Phase 2 구현 로드맵 (4-6단계)

**목표:** 아바타 시스템, 레벨 시스템, 박물관 시스템 구현

---

## 📋 전체 구현 우선순위

### 🥇 1순위: 레벨 시스템 (5단계)
- **이유**: 다른 모든 시스템의 기반이 되는 핵심 시스템
- **의존성**: 아바타 보상, 박물관 기여 포인트 연동 필요

### 🥈 2순위: 아바타 및 개인집 (4단계)  
- **이유**: 레벨 시스템 보상과 연동되어 시너지 효과
- **의존성**: 레벨 시스템의 보상 체계 필요

### 🥉 3순위: 박물관 시스템 (6단계)
- **이유**: 레벨/아바타 시스템과 연동되어 완성도 극대화
- **의존성**: 레벨 시스템, 사용자 기여 보상 시스템

---

## 🏆 5단계: 레벨 시스템 구현

### 📅 예상 소요시간: 2-3주

### 🗂️ 구현 체크리스트

#### Phase 5.1: DB 설계 및 백엔드 기초 (3일)
- [ ] **DB 스키마 확장**
  - [ ] `users` 테이블에 레벨 관련 필드 추가
    ```sql
    ALTER TABLE users ADD COLUMN level INT DEFAULT 1;
    ALTER TABLE users ADD COLUMN experience INT DEFAULT 0;
    ALTER TABLE users ADD COLUMN title VARCHAR(255) DEFAULT '새싹';
    ```
  - [ ] `experience_logs` 테이블 생성 (경험치 획득 히스토리)
    ```sql
    CREATE TABLE experience_logs (
        id SERIAL PRIMARY KEY,
        user_id INT REFERENCES users(id),
        action_type VARCHAR(255) NOT NULL,
        xp_gained INT NOT NULL,
        description TEXT,
        created_at TIMESTAMP DEFAULT NOW()
    );
    ```
  - [ ] `level_rewards` 테이블 생성 (레벨별 보상 정의)
    ```sql
    CREATE TABLE level_rewards (
        id SERIAL PRIMARY KEY,
        level INT NOT NULL,
        title VARCHAR(255),
        avatar_item JSON,
        description TEXT
    );
    ```

#### Phase 5.2: 백엔드 API 개발 (4일)
- [ ] **경험치 시스템 API**
  - [ ] `POST /api/experience/add` - 경험치 추가 (내부 API)
  - [ ] `GET /api/user/level` - 사용자 레벨 정보 조회
  - [ ] `GET /api/experience/history` - 경험치 획득 히스토리
- [ ] **레벨업 로직 구현**
  - [ ] 경험치 계산 함수 (`calculateLevel(experience)`)
  - [ ] 레벨업 체크 및 보상 지급 함수
  - [ ] 칭호 자동 부여 시스템
- [ ] **워게임 연동**
  - [ ] 문제 해결 시 경험치 지급 로직 추가
  - [ ] 난이도별 경험치 차등화 (1~5단계 = 100~500 XP)
- [ ] **어드민 관리 API** ⭐ 추가
  - [ ] `GET /api/admin/users/levels` - 전체 사용자 레벨 현황
  - [ ] `PUT /api/admin/users/:id/level` - 사용자 레벨/경험치 수정
  - [ ] `GET /api/admin/titles` - 칭호 목록 관리
  - [ ] `POST /api/admin/titles` - 새 칭호 생성
  - [ ] `PUT /api/admin/titles/:id` - 칭호 수정
  - [ ] `POST /api/admin/users/:id/special-title` - 특별 칭호 부여

#### Phase 5.3: 프론트엔드 UI 개발 (5일)
- [ ] **레벨 표시 컴포넌트**
  - [ ] 사용자 프로필에 레벨/경험치 바 추가
  - [ ] 경험치 바 애니메이션 구현
  - [ ] 다음 레벨까지 필요 경험치 표시
- [ ] **레벨업 애니메이션**
  - [ ] 레벨업 팝업 모달 제작
  - [ ] 축하 애니메이션 효과
  - [ ] 새로운 칭호/보상 알림
- [ ] **경험치 히스토리 페이지**
  - [ ] 경험치 획득 내역 표시
  - [ ] 액션별 필터링 기능
- [ ] **어드민 레벨 관리 UI** ⭐ 추가
  - [ ] 사용자 레벨 현황 대시보드
  - [ ] 개별 사용자 레벨/경험치 수정 폼
  - [ ] 칭호 관리 인터페이스
  - [ ] 특별 칭호 부여 기능
  - [ ] 경험치 지급 내역 모니터링

#### Phase 5.4: 게임 연동 및 테스트 (3일)
- [ ] **마을 시스템 연동**
  - [ ] 맵에서 사용자 레벨/칭호 표시
  - [ ] 아바타 위에 레벨 뱃지 추가
- [ ] **워게임 시스템 연동**
  - [ ] 문제 해결 시 경험치 지급 자동화
- [ ] **통합 테스트**
  - [ ] 경험치 획득 → 레벨업 → 보상 지급 플로우 테스트
  - [ ] 동시 접속 시 경험치 중복 지급 방지 테스트

---

## 🎭 4단계: 아바타 및 개인집 구현

### 📅 예상 소요시간: 3-4주

### 🗂️ 구현 체크리스트

#### Phase 4.1: DB 설계 및 파일 시스템 (4일)
- [ ] **DB 스키마 설계**
  - [ ] `users` 테이블에 아바타 데이터 추가
    ```sql
    ALTER TABLE users ADD COLUMN avatar_data JSON DEFAULT '{}';
    ```
  - [ ] `user_houses` 테이블 생성
    ```sql
    CREATE TABLE user_houses (
        id SERIAL PRIMARY KEY,
        user_id INT REFERENCES users(id) UNIQUE,
        html_content TEXT DEFAULT '',
        css_content TEXT DEFAULT '',
        is_public BOOLEAN DEFAULT true,
        last_updated TIMESTAMP DEFAULT NOW()
    );
    ```
  - [ ] `avatar_items` 테이블 생성 (아바타 아이템 정의)
    ```sql
    CREATE TABLE avatar_items (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        category VARCHAR(100) NOT NULL, -- 'hair', 'shirt', 'accessory'
        image_url VARCHAR(255),
        unlock_level INT DEFAULT 1,
        is_premium BOOLEAN DEFAULT false
    );
    ```
- [ ] **파일 저장 시스템 설계**
  - [ ] `public/houses/` 디렉토리 생성
  - [ ] 사용자별 HTML 파일 저장 구조 설계
  - [ ] 보안을 위한 파일 검증 시스템

#### Phase 4.2: 아바타 시스템 백엔드 (5일)
- [ ] **아바타 관리 API**
  - [ ] `GET /api/avatar/items` - 사용 가능한 아바타 아이템 조회
  - [ ] `POST /api/avatar/update` - 아바타 커스터마이징 저장
  - [ ] `GET /api/avatar/:userId` - 특정 사용자 아바타 정보 조회
- [ ] **아바타 렌더링 시스템**
  - [ ] 아바타 데이터를 이미지로 합성하는 로직
  - [ ] 레이어별 이미지 합성 (기본 → 머리 → 옷 → 액세서리)
- [ ] **레벨 시스템 연동**
  - [ ] 레벨업 시 새로운 아바타 아이템 해금
  - [ ] 아이템 해금 알림 시스템

#### Phase 4.3: 개인집 시스템 백엔드 (6일)
- [ ] **개인집 관리 API**
  - [ ] `POST /api/house/save` - HTML/CSS 코드 저장
  - [ ] `GET /api/house/:username` - 특정 사용자 집 조회
  - [ ] `GET /api/house/my` - 내 집 정보 조회
- [ ] **HTML/CSS 보안 처리**
  - [ ] XSS 방지를 위한 HTML 새니타이제이션
  - [ ] 허용된 태그/속성만 필터링
  - [ ] CSS injection 방지
- [ ] **파일 관리 시스템**
  - [ ] 사용자별 HTML 파일 자동 생성/업데이트
  - [ ] 백업 및 버전 관리 (선택사항)

#### Phase 4.4: 프론트엔드 UI 개발 (8일)
- [ ] **아바타 커스터마이징 UI**
  - [ ] 아바타 미리보기 캔버스
  - [ ] 카테고리별 아이템 선택 UI
  - [ ] 실시간 아바타 업데이트
  - [ ] 저장/취소 기능
- [ ] **HTML/CSS 에디터**
  - [ ] 코드 에디터 컴포넌트 (Monaco Editor 또는 CodeMirror)
  - [ ] 실시간 미리보기 기능
  - [ ] 템플릿 제공 (기본 포트폴리오 템플릿)
- [ ] **개인집 방문 시스템**
  - [ ] 집 입장 애니메이션
  - [ ] 다른 사용자 집 방문 기능
  - [ ] 집 주인 정보 표시

#### Phase 4.5: 맵 시스템 연동 (5일)
- [ ] **맵에 집 추가**
  - [ ] 사용자별 집 위치 할당 시스템
  - [ ] 집 오브젝트 렌더링
  - [ ] 집 입장 상호작용 구현
- [ ] **아바타 표시 업데이트**
  - [ ] 맵에서 커스터마이징된 아바타 표시
  - [ ] 아바타 애니메이션 적용
  - [ ] 다른 플레이어 아바타 실시간 표시

---

## 🏛️ 6단계: 박물관 시스템 구현

### 📅 예상 소요시간: 3-4주

### 🗂️ 구현 체크리스트

#### Phase 6.1: DB 설계 및 콘텐츠 관리 (5일)
- [ ] **DB 스키마 설계**
  - [ ] `knowledge_entries` 테이블 생성
    ```sql
    CREATE TABLE knowledge_entries (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        category VARCHAR(100) NOT NULL,
        content TEXT NOT NULL,
        author_id INT REFERENCES users(id),
        is_approved BOOLEAN DEFAULT false,
        likes_count INT DEFAULT 0,
        views_count INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
    );
    ```
  - [ ] `