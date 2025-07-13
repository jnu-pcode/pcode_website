document.getElementById('loginForm').addEventListener('submit', async (event) => {
    event.preventDefault();

    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const messageEl = document.getElementById('message');

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

        const data = await response.json();
        messageEl.textContent = data.message;
        messageEl.style.color = response.ok ? 'green' : 'red';
        
        if (response.ok) {
            // 로그인 성공 시 토큰을 로컬 스토리지에 저장
            localStorage.setItem('token', data.token);
            // 마을 페이지로 이동
            window.location.href = '/map.html';
        }
        
    } catch (error) {
        console.error('Error:', error);
        messageEl.textContent = '서버 오류가 발생했습니다.';
        messageEl.style.color = 'red';
    }
});