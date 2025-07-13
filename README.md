# 🌳 p.code의 숲 (p.code's Forest)

<p align="center">
  <img src="https://via.placeholder.com/600x300?text=p.code%EC%9D%98+%EC%88%B2" alt="p.code의 숲 로고 이미지">
  <br>
  <strong>보안에 대한 첫걸음, 동물 친구들과 함께 떠나는 학습 여정!</strong>
</p>

## 💡 이 프로젝트를 만든 이유

이 프로젝트는 대학교 보안 동아리인 **p.code**의 초보 동아리원들을 위해 기획되었습니다. 딱딱하고 어려운 보안 지식을 재미있고 자연스럽게 학습할 수 있는 **참여형 플랫폼**을 만드는 것이 목표입니다.

인기 게임 '동물의 숲' 컨셉을 차용하여, 동아리원들은 탑뷰 마을을 탐험하며 보안 워게임을 풀고, 지식을 공유하며, 서로 소통하게 됩니다. 학습에 대한 동기 부여와 커뮤니티 활성화라는 두 마리 토끼를 모두 잡고자 합니다.

## ✨ 주요 기능 (개발 로드맵)

### Phase 1: MVP - 핵심 기능
- **인증 시스템**: 동아리원 전용 회원가입 및 로그인 기능
- **워게임 시스템**: Docker 기반의 실전 보안 문제 풀이
- **기본 마을 구현**: 2D 탑뷰 방식의 마을 지도와 아바타 이동

### Phase 2: 핵심 기능 확장
- **아바타 및 개인 집**: 나만의 아바타 커스터마이징 및 HTML 포트폴리오 집
- **레벨 시스템**: 학습 및 활동에 따른 경험치/레벨/칭호 시스템
- **Vuln-pedia**: 유명 보안 취약점, 악성코드 등을 전시하는 박물관

### Phase 3: 고급 기능 및 상호작용
- **협동 레이드**: 팀을 이루어 해결하는 시나리오 기반의 고난도 레이드
- **실시간 채팅**: 마을 내 아바타 간 실시간 소통

## 🚀 프로젝트 실행 방법

### 1. 필수 설치 요소

- [Node.js](https://nodejs.org/ko) (v18 이상 권장)
- [PostgreSQL](https://www.postgresql.org/download/)

### 2. 프로젝트 설정

1.  이 GitHub 리포지토리를 클론(clone)합니다.
    ```bash
    git clone [https://github.com/jnu-pcode/pcode_website.git](https://github.com/jnu-pcode/pcode_website.git)
    cd pcode_website
    ```
2.  필요한 모듈들을 설치합니다.
    ```bash
    npm install
    ```
3.  `.env` 파일을 생성하고 데이터베이스 정보를 입력합니다.
    ```
    # .env
    
    PORT=5000
    
    DB_USER=postgres
    DB_HOST=localhost
    DB_NAME=postgres
    DB_PASSWORD=당신의_PostgreSQL_비밀번호
    DB_PORT=5432
    ```
    **주의**: 이 파일은 절대 외부에 노출되어서는 안 됩니다.

### 3. 프로젝트 실행

- 터미널에서 다음 명령어를 입력하여 서버를 실행합니다.
    ```bash
    node server.js
    ```
- 서버가 정상적으로 실행되면 터미널에 `Successfully connected to the database!` 메시지가 출력됩니다.

---