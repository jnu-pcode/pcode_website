// public/login.js (최종)
// 최종 수정일: 2025년 7월 19일 09시 22분

document.addEventListener('DOMContentLoaded', () => {
    const messageEl = document.getElementById('message');
    const statusMessageEl = document.getElementById('statusMessage'); // URL 파라미터 메시지 표시용

    // 페이지 로드 시 URL 파라미터 메시지 확인
    const urlParams = new URLSearchParams(window.location.search);
    const messageFromUrl = urlParams.get('message');
    if (messageFromUrl) {
        statusMessageEl.textContent = decodeURIComponent(messageFromUrl);
        statusMessageEl.style.color = 'red';
        // 메시지 표시 후 URL에서 파라미터 제거 (선택 사항)
        // history.replaceState(null, '', window.location.pathname);
    }

    document.getElementById('loginForm').addEventListener('submit', async (event) => {
        event.preventDefault();

        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        
        // 로그인 폼 제출 시에는 URL 파라미터 메시지를 지움
        statusMessageEl.textContent = ''; 

        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    username: username,
                    password: password
                })
            });
            
            // 응답이 OK가 아니면 (예: 401, 400 등) 서버에서 JSON 메시지를 받음
            // 응답의 상태 코드를 먼저 확인하여 JSON 파싱 오류 방지
            if (!response.ok) {
                const errorData = await response.json(); // 오류 메시지 파싱
                messageEl.textContent = errorData.message || '로그인 실패';
                messageEl.style.color = 'red';
                return; // 함수 종료
            }

            // 응답이 OK일 경우 성공 메시지 파싱 및 리다이렉트
            const data = await response.json(); 
            messageEl.textContent = data.message;
            messageEl.style.color = 'green';
            
            // 로그인 성공 시 마을 페이지로 이동 (서버에서 쿠키로 토큰 설정됨)
            window.location.href = '/map'; 
            
        } catch (error) {
            console.error('Error:', error);
            messageEl.textContent = '서버 오류가 발생했습니다.';
            messageEl.style.color = 'red';
        }
    });
});