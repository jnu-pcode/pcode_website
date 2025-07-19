document.getElementById('registerForm').addEventListener('submit', async (event) => {
    event.preventDefault();

    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const authCode = document.getElementById('authCode').value;
    const statusMessageEl = document.getElementById('statusMessage');

    try {
        const response = await fetch('/api/auth/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                username: username,
                password: password,
                auth_code: authCode
            })
        });

        const data = await response.json();
        statusMessageEl.textContent = data.message;
        statusMessageEl.style.color = response.ok ? 'green' : 'red';
        
        if (response.ok) { // 회원가입 성공 시
            alert('회원가입이 완료되었습니다. 로그인 페이지로 이동합니다.'); // 사용자에게 알림
            window.location.href = '/login'; // 로그인 페이지로 리다이렉트
        }

    } catch (error) {
        console.error('Error:', error);
        statusMessageEl.textContent = '서버 오류가 발생했습니다.';
        statusMessageEl.style.color = 'red';
    }
});