// public/wargame/create.js (최종)
// 최종 수정일: 2025년 7월 15일 13시 40분

document.addEventListener('DOMContentLoaded', async () => { // async 추가
    const form = document.getElementById('create-form');
    const messageEl = document.getElementById('message');

    // JWT 토큰을 해독하여 사용자 정보 (권한 포함)를 가져오는 함수
    const getUserInfoFromToken = () => {
        const token = localStorage.getItem('token');
        if (!token) return null;
        try {
            const base64Url = token.split('.')[1];
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
                return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
            }).join(''));
            return JSON.parse(jsonPayload);
        } catch (e) {
            console.error("토큰 디코딩 오류:", e);
            return null;
        }
    };

    // 페이지 로드 시 권한 확인 (동아리원만 접근 가능)
    const userInfo = getUserInfoFromToken();
    if (!userInfo || !userInfo.is_member) { // is_member 권한 확인
        alert('동아리원 권한이 필요합니다.');
        window.location.href = '/login';
        return; // 코드 실행 중단
    }

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const formData = new FormData(form);

        try {
            // HttpOnly 쿠키는 자동으로 전송되므로 별도 헤더 설정 없이 fetch 호출
            const response = await fetch('/api/wargames/create', {
                method: 'POST',
                body: formData
            });

            const data = await response.json();

            if (response.ok) {
                messageEl.textContent = data.message;
                messageEl.style.color = 'green';
                form.reset();
            } else {
                messageEl.textContent = data.message;
                messageEl.style.color = 'red';
            }
        } catch (err) {
            messageEl.textContent = '문제 등록 중 오류가 발생했습니다.';
            messageEl.style.color = 'red';
            console.error(err);
        }
    });
});