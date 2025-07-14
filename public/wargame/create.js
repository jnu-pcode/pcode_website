document.getElementById('create-form').addEventListener('submit', async (e) => {
    e.preventDefault();

    const form = e.target;
    const formData = new FormData(form);
    const messageEl = document.getElementById('message');

    try {
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