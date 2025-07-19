// 칭호 설정 파일
// 이 파일을 수정하여 칭호를 변경할 수 있습니다.

module.exports = {
    "levelTitles": [
        {
            "minLevel": 1,
            "title": "새싹",
            "description": "보안의 세계에 첫 발을 내딘 초보자"
        },
        {
            "minLevel": 5,
            "title": "디지털 탐정",
            "description": "기본적인 보안 지식을 익힌 탐정"
        },
        {
            "minLevel": 10,
            "title": "보안 연구원",
            "description": "체계적으로 보안을 연구하는 연구원"
        },
        {
            "minLevel": 15,
            "title": "사이버 가디언",
            "description": "사이버 공간을 지키는 수호자"
        },
        {
            "minLevel": 20,
            "title": "사이버 분석가",
            "description": "복잡한 보안 문제를 분석하는 전문가"
        },
        {
            "minLevel": 25,
            "title": "화이트 해커",
            "description": "선량한 목적으로 해킹 기술을 사용하는 전문가"
        },
        {
            "minLevel": 30,
            "title": "해킹 전문가",
            "description": "고급 해킹 기술을 보유한 전문가"
        },
        {
            "minLevel": 40,
            "title": "보안 아키텍트",
            "description": "보안 시스템을 설계하는 건축가"
        },
        {
            "minLevel": 50,
            "title": "보안 마스터",
            "description": "보안 분야의 최고 전문가"
        },
        {
            "minLevel": 70,
            "title": "사이버 센세이",
            "description": "다른 이들을 가르치는 보안 스승"
        },
        {
            "minLevel": 100,
            "title": "레전드",
            "description": "전설이 된 보안 전문가"
        }
    ],
    "specialTitles": [
        {
            "id": "founder",
            "title": "창립자",
            "description": "p.code 동아리 창립자"
        },
        {
            "id": "ctf_master",
            "title": "CTF 마스터",
            "description": "CTF 대회에서 뛰어난 성과를 보인 선수"
        },
        {
            "id": "mentor",
            "title": "멘토",
            "description": "후배들을 적극적으로 도와주는 선배"
        },
        {
            "id": "researcher",
            "title": "연구자",
            "description": "보안 연구에 기여한 연구자"
        },
        {
            "id": "contributor",
            "title": "기여자",
            "description": "동아리 발전에 크게 기여한 멤버"
        },
        {
            "id": "bug_hunter",
            "title": "버그 헌터",
            "description": "취약점 발견의 달인"
        },
        {
            "id": "code_warrior",
            "title": "코드 워리어",
            "description": "뛰어난 코딩 실력을 보유한 전사"
        }
    ],
    "xpActions": {
        "wargame_solve": {
            "name": "워게임 문제 해결",
            "baseXP": 100,
            "difficultyMultiplier": {
                "1": 1,
                "2": 1.5,
                "3": 2,
                "4": 3,
                "5": 5
            }
        },
        "first_solve": {
            "name": "최초 해결 보너스",
            "baseXP": 50,
            "description": "해당 문제를 처음 해결한 경우"
        },
        "daily_login": {
            "name": "일일 접속",
            "baseXP": 10,
            "description": "하루 한 번 로그인"
        },
        "profile_complete": {
            "name": "프로필 완성",
            "baseXP": 50,
            "description": "개인집 HTML 작성 완료"
        },
        "knowledge_contribute": {
            "name": "지식 기여",
            "baseXP": 100,
            "description": "박물관에 지식 콘텐츠 기여"
        },
        "knowledge_like": {
            "name": "지식 추천받음",
            "baseXP": 5,
            "description": "작성한 지식이 추천받음"
        },
        "admin_bonus": {
            "name": "관리자 특별 보상",
            "baseXP": 0,
            "description": "관리자가 직접 부여하는 보상"
        }
    }
};