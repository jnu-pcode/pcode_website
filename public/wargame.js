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
                method: 'POST',
                credentials: 'include'
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
        // containerId 유효성 검사
        if (!containerId || containerId === 'undefined' || containerId === '') {
            console.error('유효하지 않은 container ID:', containerId);
            console.warn('컨테이너 ID가 유효하지 않습니다. 자동으로 페이지를 새로고침합니다.');
            return;
        }

        try {
            button.disabled = true;
            button.textContent = '종료 중...';

            const response = await fetch(`/api/wargames/stop/${containerId}`, {
                method: 'POST',
                credentials: 'include'
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ message: '알 수 없는 오류' }));
                throw new Error(`문제 종료 실패: ${errorData.message}`);
            }
            button.textContent = '문제 시작';
            button.disabled = false;
            button.classList.add('start-btn');
            button.classList.remove('stop-btn');
            delete button.dataset.containerId; // 완전히 제거

            const listItem = button.closest('li');
            const form = listItem.querySelector('.flag-submit-form');
            if (form) {
                form.remove();
            }

        } catch (error) {
            console.error('컨테이너 종료 오류:', error);
            console.warn('문제 종료에 실패했습니다. 서버 로그를 확인하세요.');
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
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ flag: flag })
            });
            
            const data = await response.json();
            
            // 레벨업이 발생한 경우 특별 알림 표시
            if (data.levelUp) {
                alert(`🎉 ${data.message}\n\n🆙 레벨업! ${data.newLevel}레벨이 되었습니다!\n🏆 새로운 칭호: ${data.newTitle}`);
            } else {
            alert(data.message);
            }
            
            button.disabled = false;
            button.textContent = '제출';

            if (response.ok) {
                const listItem = button.closest('li');
                
                // 여러 방법으로 stop 버튼 찾기
                let stopButton = listItem.querySelector('.stop-btn');
                if (!stopButton) {
                    // class가 변경되었을 수도 있으니 data-container-id로도 찾아보기
                    stopButton = listItem.querySelector('[data-container-id]:not([data-container-id=""])');
                }
                
                if (stopButton && stopButton.dataset.containerId && stopButton.dataset.containerId !== 'undefined') {
                    stopProblem(stopButton.dataset.containerId, stopButton);
                } else {
                    console.warn('Stop button을 찾을 수 없거나 container ID가 유효하지 않습니다.');
                }
                
                // 즉시 페이지 새로고침
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