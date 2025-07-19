# 🌳 p.code의 숲 (p.code's Forest)

<p align="center">
  <img src="https://via.placeholder.com/600x300?text=p.code%EC%9D%98+%EC%88%B2" alt="p.code의 숲 로고 이미지">
  <br>
  <strong>보안에 대한 첫걸음, 동물 친구들과 함께 떠나는 학습 여정!</strong>
</p>

## 💡 이 프로젝트를 만든 이유

이 프로젝트는 대학교 보안 동아리인 **p.code**의 초보 동아리원들을 위해 기획되었습니다. 딱딱하고 어려운 보안 지식을 재미있고 자연스럽게 학습할 수 있는 **참여형 플랫폼**을 만드는 것이 목표입니다.

인기 게임 '동물의 숲' 컨셉을 차용하여, 동아리원들은 탑뷰 마을을 탐험하며 보안 워게임을 풀고, 지식을 공유하며, 서로 소통하게 됩니다. 학습에 대한 동기 부여와 커뮤니티 활성화라는 두 마리 토끼를 모두 잡고자 합니다.

## 🎯 현재 구현 현황 (2025년 7월)

### ✅ 완료된 기능 (Phase 1 - MVP)

#### 🔐 인증 시스템
- ✅ **동아리원 전용 회원가입** (인증코드 검증)
- ✅ **JWT 기반 로그인** (httpOnly 쿠키)
- ✅ **권한 관리** (동아리원/관리자 구분)
- ✅ **보안 강화** (bcrypt 해싱, XSS 방지)

#### 🏴‍☠️ 워게임 시스템
- ✅ **Docker 기반 실습 환경** (개인별 독립 컨테이너)
- ✅ **문제 관리** (생성/조회/삭제)
- ✅ **Flag 검증 시스템** (실시간 정답 확인)
- ✅ **진도 추적** (해결 기록 저장)
- ✅ **파일 업로드** (Dockerfile 첨부)

#### 🏘️ 2D 마을 시스템
- ✅ **Canvas 기반 렌더링** (고품질 그래픽)
- ✅ **반응형 디자인** (브라우저 크기 자동 조정)
- ✅ **아바타 이동** (WASD/마우스 클릭)
- ✅ **A* 경로찾기** 알고리즘
- ✅ **건물 상호작용** (E키 힌트 시스템)
- ✅ **위치 저장/복원** (자동 저장)
- ✅ **성능 최적화** (60-120fps 안정)

### 🎯 추가 구현된 고급 기능
- 🚀 **시간 기반 애니메이션** (프레임레이트 독립)
- 🚀 **뷰포트 컬링** (화면 영역만 렌더링)
- 🚀 **스마트 렌더링** (변경 시에만 다시 그리기)
- 🚀 **레티나 디스플레이** 지원
- 🚀 **FPS 모니터링** 시스템
- 🚀 **타일별 이동속도** 차등화

## ✨ 개발 로드맵

### ✅ Phase 1: MVP - 핵심 기능 (완료)
- ✅ **인증 시스템**: 동아리원 전용 회원가입 및 로그인 기능
- ✅ **워게임 시스템**: Docker 기반의 실전 보안 문제 풀이
- ✅ **기본 마을 구현**: 2D 탑뷰 방식의 마을 지도와 아바타 이동

### 🚧 Phase 2: 핵심 기능 확장 (예정)
- 🔄 **아바타 및 개인 집**: 나만의 아바타 커스터마이징 및 HTML 포트폴리오 집
- 🔄 **레벨 시스템**: 학습 및 활동에 따른 경험치/레벨/칭호 시스템
- 🔄 **Vuln-pedia**: 유명 보안 취약점, 악성코드 등을 전시하는 박물관

### 📋 Phase 3: 고급 기능 및 상호작용 (계획)
- 📅 **협동 레이드**: 팀을 이루어 해결하는 시나리오 기반의 고난도 레이드
- 📅 **실시간 채팅**: 마을 내 아바타 간 실시간 소통
- 📅 **3D 업데이트**: 3D 그래픽 전환

## 🛠️ 기술 스택

### Backend
- **Node.js + Express** - 웹 서버
- **PostgreSQL** - 데이터베이스
- **JWT + bcrypt** - 인증/보안
- **Docker SDK** - 컨테이너 관리
- **Multer** - 파일 업로드

### Frontend
- **Vanilla JavaScript** - 클라이언트 로직
- **HTML5 Canvas** - 2D 렌더링
- **CSS3** - 스타일링
- **Fetch API** - 서버 통신

### DevOps
- **Docker** - 워게임 환경
- **Git** - 버전 관리

## 🚀 프로젝트 시작하기

### 1. 필수 설치 프로그램

- [Node.js](https://nodejs.org/ko/) (버전 18 이상 권장)
- [PostgreSQL](https://www.postgresql.org/)
- [Docker](https://www.docker.com/) (워게임 기능용)

### 2. 프로젝트 설정

1.  GitHub에서 프로젝트를 클론합니다.
    ```bash
    git clone [프로젝트_URL]
    cd pcode-web
    ```

2.  필요한 Node.js 패키지를 설치합니다.
    ```bash
    npm install
    ```

3.  `.env` 파일을 생성하고 환경 변수를 설정합니다.
    ```env
    # .env
    
    PORT=5000
    
    # Database Configuration
    DB_USER=postgres
    DB_HOST=localhost
    DB_NAME=postgres
    DB_PASSWORD=당신의_PostgreSQL_비밀번호
    DB_PORT=5432
    
    # JWT Secret Key
    JWT_SECRET=your_super_secret_jwt_key
    
    # Club Authentication Code
    CLUB_AUTH_CODE=[]
    ```

4.  서버를 실행합니다. 서버가 자동으로 데이터베이스 테이블을 생성합니다.
    ```bash
    node server.js
    ```

5.  브라우저에서 `http://localhost:5000`으로 접속하여 게임을 시작합니다.

## 🎮 사용 방법

### 1. 회원가입 및 로그인
1. `/login` 페이지에서 회원가입 또는 로그인
2. 동아리원은 인증코드 입력 (동아리원 권한 획득)

### 2. 마을 탐험
- **이동**: `WASD` 키 또는 마우스 클릭으로 이동
- **상호작용**: 건물 근처에서 `E` 키로 입장
- **워게임**: 워게임 센터에서 문제 풀이

### 3. 워게임 풀이
1. 워게임 센터 입장
2. 문제 선택 후 "시작" 버튼 클릭
3. Docker 컨테이너가 생성되어 접속 정보 제공
4. 문제 해결 후 Flag 제출

## 💻 API 엔드포인트

### 인증 API
- `POST /api/auth/register` - 회원가입
- `POST /api/auth/login` - 로그인

### 워게임 API
- `GET /api/wargames` - 문제 목록 조회
- `POST /api/wargames/:id/start` - 문제 시작 (컨테이너 생성)
- `POST /api/wargames/:id/submit` - Flag 제출
- `POST /api/wargames/stop/:containerId` - 컨테이너 중지

### 사용자 API
- `GET /api/user/me` - 사용자 정보 조회
- `POST /api/user/position` - 위치 저장

### 관리 API (관리자/동아리원 권한)
- `POST /api/wargames/create` - 문제 생성 (동아리원)
- `DELETE /api/wargames/:id` - 문제 삭제 (관리자)

## 📁 프로젝트 구조

```
pcode-web/
├── 📂 src/
│   ├── 📂 db/                 # 데이터베이스 연결
│   └── 📂 features/
│       ├── 📂 authentication/ # 인증 시스템
│       ├── 📂 wargame/        # 워게임 시스템
│       └── 📂 user/           # 사용자 관리
├── 📂 public/                 # 클라이언트 파일
│   ├── 📂 assets/             # 게임 리소스
│   ├── 📂 css/                # 스타일시트
│   ├── 🎮 map.html            # 메인 게임 화면
│   ├── 🎮 map.js              # 게임 로직
│   ├── 🎮 mapData.js          # 맵 데이터
│   └── 🎮 wargame.html        # 워게임 화면
├── 📂 docker-challenges/      # 워게임 컨테이너
├── 📂 기획/                   # 프로젝트 기획서
└── 🖥️ server.js              # 메인 서버
```

## 🏆 주요 성과

- ✅ **100% 기획 구현 완료** (1-3단계)
- ✅ **18개 추가 기능** 개발
- ✅ **고성능 2D 게임 엔진** 구현
- ✅ **확장 가능한 아키텍처** 구축
- ✅ **실용적인 보안 학습 환경** 제공

## 🤝 기여하기

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

<p align="center">
  <strong>🌳 p.code의 숲에서 보안 전문가로 성장하세요! 🌳</strong>
</p>