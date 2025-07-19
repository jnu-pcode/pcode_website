document.addEventListener('DOMContentLoaded', () => {
    const problemsList = document.getElementById('problems');
    const categoryLinks = document.querySelectorAll('.category-list a');
    const difficultyLinks = document.querySelectorAll('.difficulty-list a');

    let allProblems = [];

    const fetchProblems = async (filters = {}) => {
        try {
            const params = new URLSearchParams();
            if (filters.category && filters.category !== 'all') {
                params.append('category', filters.category);
            }
            if (filters.difficulty && filters.difficulty !== 'all') {
                params.append('difficulty', filters.difficulty);
            }

            const url = `/api/wargames?${params.toString()}`;
            
            const response = await fetch(url); 
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error('API 응답 오류');
            }

            allProblems = data.problems;
            displayProblems(allProblems);

        } catch (error) {
            console.error('Error:', error);
            problemsList.innerHTML = '<li>문제 목록을 불러오는 데 실패했습니다.</li>';
        }
    };

    const displayProblems = (problems) => {
        problemsList.innerHTML = '';
        if (!problems || problems.length === 0) {
            problemsList.innerHTML = '<li>해당 카테고리에 문제가 없습니다.</li>';
            return;
        }

        problems.forEach(problem => {
            const li = document.createElement('li');
            li.innerHTML = `
                <span class="problem-info">
                    <span>${problem.title} (난이도: ${problem.difficulty})</span>
                    ${problem.is_solved ? ' <span class="solved-badge">해결 완료</span>' : ''}
                </span>
                <div class="button-group">
                    <button class="start-btn" data-id="${problem.id}">문제 시작</button>
                </div>
            `;
            
            problemsList.appendChild(li);
        });
    };

    const startProblem = async (problemId, button) => {
        try {
            button.disabled = true;
            button.textContent = '실행 중...';

            const response = await fetch(`/api/wargames/${problemId}/start`, {
                method: 'POST'
            });

            if (!response.ok) {
                throw new Error('문제 시작 실패');
            }

            const data = await response.json();
            
            window.open(`http://${data.host}:${data.port}`, '_blank');

            button.textContent = '문제 종료';
            button.classList.remove('start-btn');
            button.classList.add('stop-btn');
            button.dataset.containerId = data.container_id;
            button.disabled = false;

            const listItem = button.closest('li');
            listItem.innerHTML += `
                <div class="flag-submit-form">
                    <input type="text" placeholder="여기에 Flag를 입력하세요" data-problem-id="${problemId}">
                    <button class="submit-btn">제출</button>
                </div>
            `;
            
        } catch (error) {
            alert('문제 시작에 실패했습니다. 서버 로그를 확인하세요.');
            console.error('Error:', error);
            button.textContent = '문제 시작';
            button.disabled = false;
        }
    };
    
    const stopProblem = async (containerId, button) => {
        try {
            button.disabled = true;
            button.textContent = '종료 중...';

            const response = await fetch(`/api/wargames/stop/${containerId}`, {
                method: 'POST'
            });

            if (!response.ok) {
                throw new Error('문제 종료 실패');
            }

            alert('문제가 성공적으로 종료되었습니다.');
            
            button.textContent = '문제 시작';
            button.disabled = false;
            button.classList.add('start-btn');
            button.classList.remove('stop-btn');

            const listItem = button.closest('li');
            const form = listItem.querySelector('.flag-submit-form');
            if (form) {
                form.remove();
            }

        } catch (error) {
            alert('문제 종료에 실패했습니다. 서버 로그를 확인하세요.');
            console.error('Error:', error);
            button.textContent = '문제 종료';
            button.disabled = false;
        }
    };
    
    const submitFlag = async (problemId, flag, button) => {
        try {
            button.disabled = true;
            button.textContent = '제출 중...';

            const response = await fetch(`/api/wargames/${problemId}/submit`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ flag: flag })
            });
            
            const data = await response.json();
            alert(data.message);
            
            button.disabled = false;
            button.textContent = '제출';

            if (response.ok) {
                const startButton = button.closest('li').querySelector('.stop-btn');
                if (startButton) {
                    stopProblem(startButton.dataset.containerId, startButton);
                }
                window.location.reload();
            }

        } catch (error) {
            alert('Flag 제출에 실패했습니다.');
            console.error('Error:', error);
            button.disabled = false;
            button.textContent = '제출';
        }
    };
    

    problemsList.addEventListener('click', (e) => {
        if (e.target.classList.contains('start-btn')) {
            const problemId = e.target.dataset.id;
            startProblem(problemId, e.target);
        } else if (e.target.classList.contains('stop-btn')) {
            const containerId = e.target.dataset.containerId;
            stopProblem(containerId, e.target);
        } else if (e.target.classList.contains('submit-btn')) {
            const input = e.target.closest('div').querySelector('input');
            const problemId = input.dataset.problemId;
            submitFlag(problemId, input.value, e.target);
        }
    });

    categoryLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const category = e.target.dataset.category;
            fetchProblems({ category: category });
        });
    });

    difficultyLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const difficulty = e.target.dataset.difficulty;
            fetchProblems({ difficulty: difficulty });
        });
    });

    fetchProblems();
});