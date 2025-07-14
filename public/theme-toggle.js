document.addEventListener('DOMContentLoaded', () => {
    const toggleBtn = document.getElementById('theme-toggle');
    
    // 로컬 스토리지에서 저장된 테마를 불러옴
    const currentTheme = localStorage.getItem('theme');
    
    if (currentTheme === 'dark') {
        document.body.classList.add('dark-mode');
        toggleBtn.textContent = '라이트 모드';
    } else {
        document.body.classList.add('light-mode');
        toggleBtn.textContent = '다크 모드';
    }

    toggleBtn.addEventListener('click', () => {
        if (document.body.classList.contains('dark-mode')) {
            document.body.classList.remove('dark-mode');
            document.body.classList.add('light-mode');
            localStorage.setItem('theme', 'light');
            toggleBtn.textContent = '다크 모드';
        } else {
            document.body.classList.remove('light-mode');
            document.body.classList.add('dark-mode');
            localStorage.setItem('theme', 'dark');
            toggleBtn.textContent = '라이트 모드';
        }
    });
});