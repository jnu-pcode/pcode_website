document.getElementById('registerForm').addEventListener('submit', async (event) => {
    event.preventDefault();

    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const authCode = document.getElementById('authCode').value;
    const messageEl = document.getElementById('message');

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
        messageEl.textContent = data.message;
        messageEl.style.color = response.ok ? 'green' : 'red';
    } catch (error) {
        console.error('Error:', error);
        messageEl.textContent = '서버 오류가 발생했습니다.';
        messageEl.style.color = 'red';
    }
});