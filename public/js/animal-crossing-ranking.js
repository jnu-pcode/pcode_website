// 동물의 숲 스타일 랭킹보드 JavaScript

class AnimalCrossingRanking {
    constructor() {
        this.container = null;
        this.isVisible = false;
        this.rankingData = [];
        this.stats = null;
    }

    // 랭킹보드 HTML 구조 생성
    createRankingBoardHTML() {
        return `
            <div class="wooden-board">
                <!-- 닫기 버튼 -->
                <div class="close-button" onclick="window.animalRanking.hide()">×</div>
                
                <!-- 헤더 -->
                <div class="board-header">
                    <div class="leaf-decoration left"></div>
                    <div class="leaf-decoration right"></div>
                    <h2 class="board-title">🌟 마을 명예의 전당 🌟</h2>
                    <div class="board-subtitle">가장 열심히 활동하는 주민들을 만나보세요!</div>
                </div>
                
                <!-- 랭킹 리스트 -->
                <div class="ranking-list-container">
                    <div id="rankingList"></div>
                </div>
                
                <!-- 푸터 -->
                <div class="board-footer">
                    <div id="statsInfo">🏘️ 총 주민 수: <span id="totalUsers">-</span>명 | 
                    🌱 평균 레벨: <span id="avgLevel">-</span> | 
                    ⭐ 최고 레벨: <span id="maxLevel">-</span></div>
                    <div style="margin-top: 5px; font-size: 10px; opacity: 0.8;">
                        💡 팁: 워게임을 해결하여 경험치를 획득하세요!
                    </div>
                </div>
            </div>
        `;
    }

    // 랭킹보드 표시
    async show() {
        if (this.isVisible) return;

        // 랭킹 데이터 로드
        await this.loadRankingData();

        // 컨테이너 생성
        this.container = document.createElement('div');
        this.container.className = 'ranking-board-container';
        this.container.innerHTML = this.createRankingBoardHTML();

        // 랭킹 데이터 표시
        this.displayRankingData();
        this.displayStats();

        // 문서에 추가
        document.body.appendChild(this.container);

        this.isVisible = true;
    }

    // 랭킹보드 숨김
    hide() {
        if (!this.isVisible || !this.container) return;

        // 즉시 제거
        if (this.container && this.container.parentNode) {
            this.container.parentNode.removeChild(this.container);
        }
        this.container = null;
        this.isVisible = false;
    }

    // 랭킹 데이터 로드
    async loadRankingData() {
        try {
            // 랭킹과 통계를 병렬로 로드
            const [rankingResponse, statsResponse] = await Promise.all([
                fetch('/api/ranking/public?limit=20', {
                    credentials: 'include'
                }),
                fetch('/api/ranking/stats', {
                    credentials: 'include'
                })
            ]);

            if (rankingResponse.ok) {
                const rankingData = await rankingResponse.json();
                this.rankingData = rankingData.ranking || [];
            } else {
                throw new Error(`랭킹 API 오류: ${rankingResponse.status}`);
            }

            if (statsResponse.ok) {
                const statsData = await statsResponse.json();
                this.stats = statsData.stats || {};
            } else {
                this.stats = {};
            }

        } catch (error) {
            console.error('❌ 랭킹 데이터 로드 오류:', error);
            // 오류 시 기본 메시지 표시
            this.rankingData = [];
            this.stats = {};
        }
    }

    // 랭킹 데이터 표시
    displayRankingData() {
        const rankingList = this.container.querySelector('#rankingList');
        if (!rankingList) return;

        if (this.rankingData.length === 0) {
            rankingList.innerHTML = `
                <div style="text-align: center; padding: 40px; color: #8B4513;">
                    <div style="font-size: 48px; margin-bottom: 10px;">🌿</div>
                    <div style="font-size: 16px; font-weight: bold;">아직 활동하는 주민이 없어요!</div>
                    <div style="font-size: 12px; margin-top: 5px; opacity: 0.8;">첫 번째 모험가가 되어보세요!</div>
                </div>
            `;
            return;
        }

        const rankingHTML = this.rankingData.map((user, index) => {
            const rank = user.rank || (index + 1);
            const badgeClass = this.getRankBadgeClass(rank);
            const rankIcon = this.getRankIcon(rank);
            
            return `
                <div class="ranking-item">
                    <div class="acorn-decoration left"></div>
                    <div class="acorn-decoration right"></div>
                    
                    <div class="rank-badge ${badgeClass}">
                        ${rank}${rankIcon}
                    </div>
                    
                    <div class="user-info">
                        <div class="username-row">
                            <span class="username">${this.escapeHtml(user.username)}</span>
                            ${user.special_title ? `<span class="special-title">${this.escapeHtml(user.special_title)}</span>` : ''}
                        </div>
                        <div class="user-title">${this.escapeHtml(user.title || '새싹')}</div>
                    </div>
                    
                    <div class="level-info">
                        <div class="level-display">Lv.${user.level}</div>
                        <div class="experience-display">${user.experience.toLocaleString()} XP</div>
                    </div>
                </div>
            `;
        }).join('');

        rankingList.innerHTML = rankingHTML;
    }

    // 통계 정보 표시
    displayStats() {
        if (!this.stats) return;

        const totalUsersEl = this.container.querySelector('#totalUsers');
        const avgLevelEl = this.container.querySelector('#avgLevel');
        const maxLevelEl = this.container.querySelector('#maxLevel');

        if (totalUsersEl) totalUsersEl.textContent = this.stats.totalUsers || 0;
        if (avgLevelEl) avgLevelEl.textContent = this.stats.averageLevel || 1;
        if (maxLevelEl) maxLevelEl.textContent = this.stats.maxLevel || 1;
    }

    // 순위에 따른 배지 클래스 반환
    getRankBadgeClass(rank) {
        switch (rank) {
            case 1: return 'gold';
            case 2: return 'silver';
            case 3: return 'bronze';
            default: return 'normal';
        }
    }

    // 순위별 아이콘 반환
    getRankIcon(rank) {
        switch (rank) {
            case 1: return '👑';
            case 2: return '🥈';
            case 3: return '🥉';
            default: return '';
        }
    }

    // HTML 이스케이프 처리
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // 새로고침
    async refresh() {
        if (!this.isVisible) return;
        await this.loadRankingData();
        this.displayRankingData();
        this.displayStats();
    }
}

// 전역 인스턴스 생성
const animalRanking = new AnimalCrossingRanking();
window.animalRanking = animalRanking;

// 전역 함수로 노출
window.showAnimalRanking = function() {
    animalRanking.show();
};

window.hideAnimalRanking = function() {
    animalRanking.hide();
};

// ESC 키로 랭킹보드 닫기
document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && animalRanking.isVisible) {
        animalRanking.hide();
    }
});

// 클릭으로 랭킹보드 닫기 (배경 클릭 시)
document.addEventListener('click', (event) => {
    if (animalRanking.isVisible && 
        animalRanking.container && 
        !animalRanking.container.querySelector('.wooden-board').contains(event.target)) {
        animalRanking.hide();
    }
});

// 3분마다 자동 새로고침 (표시 중일 때만)
setInterval(() => {
    if (animalRanking.isVisible) {
        animalRanking.refresh();
    }
}, 180000); // 3분

// 전역 객체로 노출됨 - export 불필요 