document.addEventListener('DOMContentLoaded', () => {
    const problemsList = document.getElementById('problems');
    const categoryLinks = document.querySelectorAll('.category-list a');
    const difficultyLinks = document.querySelectorAll('.difficulty-list a'); // 난이도 링크 선택

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
                <span>${problem.title} (난이도: ${problem.difficulty})</span>
                <button class="start-btn" data-id="${problem.id}">문제 시작</button>
            `;
            
            if (problem.isSolved) {
                li.innerHTML += ' <span class="solved-badge">해결 완료</span>';
            }
            
            problemsList.appendChild(li);
        });
    };

    categoryLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const category = e.target.dataset.category;
            fetchProblems({ category: category, difficulty: getActiveDifficulty() });
        });
    });

    difficultyLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const difficulty = e.target.dataset.difficulty;
            fetchProblems({ category: getActiveCategory(), difficulty: difficulty });
        });
    });

    const getActiveCategory = () => {
        const activeLink = document.querySelector('.category-list a[data-category]');
        return activeLink ? activeLink.dataset.category : null;
    };

    const getActiveDifficulty = () => {
        const activeLink = document.querySelector('.difficulty-list a[data-difficulty]');
        return activeLink ? activeLink.dataset.difficulty : null;
    };

    fetchProblems();
});