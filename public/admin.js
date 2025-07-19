document.addEventListener('DOMContentLoaded', () => {
    const problemListElement = document.getElementById('problem-list');

    // 쿠키에서 토큰을 가져오는 함수
    function getTokenFromCookies() {
        const token = document.cookie.split('; ').find(row => row.startsWith('token='));
        return token ? token.split('=')[1] : null;
    }

    // 모든 fetch 요청에 JWT 토큰을 자동으로 추가하는 함수
    const authorizedFetch = async (url, options = {}) => {
        const token = getTokenFromCookies();
        console.log('authorizedFetch: 토큰 가져옴 ->', token ? '존재함' : '없음'); // <-- 이 줄 추가

        const headers = {
            'Content-Type': 'application/json',
            // 'Authorization' 헤더는 토큰이 존재할 때만 추가
            ...(token && { 'Authorization': `Bearer ${token}` }), // <-- 토큰이 있을 때만 헤더 추가
            ...options.headers
        };
        console.log('authorizedFetch: 요청 헤더 ->', headers); // <-- 이 줄 추가

        try {
            const response = await fetch(url, { ...options, headers });
            
            if (response.status === 401 || response.status === 403) {
                alert('인증이 만료되었거나 권한이 없습니다. 다시 로그인해 주세요.');
                window.location.href = '/login';
                return;
            }

            return response;
        } catch (error) {
            console.error('authorizedFetch: fetch 오류 발생 ->', error); // <-- 이 줄 추가
            throw error; // 에러를 다시 던져서 상위 catch 블록에서 처리하도록
        }
    };

    const fetchProblems = async () => {
        try {
            const response = await authorizedFetch('/api/wargames');
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || '문제 목록을 불러오는 데 실패했습니다.');
            }

            displayProblems(data.problems);

        } catch (error) {
            console.error('문제 목록 불러오기 오류:', error);
            problemListElement.innerHTML = '<li>문제 목록을 불러오는 데 실패했습니다. 관리자 권한이 없거나 토큰이 만료되었을 수 있습니다.</li>';
        }
    };

    const displayProblems = (problems) => {
        problemListElement.innerHTML = '';
        if (problems.length === 0) {
            problemListElement.innerHTML = '<li>등록된 문제가 없습니다.</li>';
            return;
        }

        problems.forEach(problem => {
            const li = document.createElement('li');
            li.innerHTML = `
                <span>${problem.title} (ID: ${problem.id})</span>
                <span>Docker: ${problem.docker_image}</span>
                <span>Flag: ${problem.flag}</span>
                <span>Category: ${problem.category}</span>
                <span>Difficulty: ${problem.difficulty}</span>
                <button class="delete-btn" data-id="${problem.id}">삭제</button>
            `;
            problemListElement.appendChild(li);
        });
    };

    problemListElement.addEventListener('click', async (e) => {
        if (e.target.classList.contains('delete-btn')) {
            const problemId = e.target.dataset.id;
            if (confirm(`정말 ID ${problemId}번 문제를 삭제하시겠습니까?`)) {
                try {
                    const response = await authorizedFetch(`/api/wargames/${problemId}`, {
                        method: 'DELETE',
                    });
                    const data = await response.json();

                    if (response.ok) {
                        alert(data.message);
                        fetchProblems(); // 삭제 후 목록 새로고침
                    } else {
                        alert(`삭제 실패: ${data.message}`);
                    }
                } catch (error) {
                    console.error('문제 삭제 오류:', error);
                    alert('문제 삭제 중 오류가 발생했습니다.');
                }
            }
        }
    });

    fetchProblems();
});