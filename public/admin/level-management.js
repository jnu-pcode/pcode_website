// 어드민 레벨 관리 페이지 JavaScript

class AdminLevelManager {
    constructor() {
        this.users = [];
        this.titleSettings = null;
        this.currentUser = null;
        this.init();
    }

    async init() {
        
        // 권한 확인
        if (!await this.checkAdminPermission()) {
            alert('관리자 권한이 필요합니다.');
            window.location.href = '/login';
            return;
        }

        // 이벤트 리스너 설정
        this.setupEventListeners();
        
        // 초기 데이터 로드
        await this.loadAllData();
    }

    async checkAdminPermission() {
        try {
            const response = await fetch('/api/user/me', {
                credentials: 'include'
            });
            
            if (response.ok) {
                const data = await response.json();
                return data.user && data.user.is_admin;
            }
            return false;
        } catch (error) {
            console.error('권한 확인 오류:', error);
            return false;
        }
    }

    setupEventListeners() {
        // 새로고침 버튼
        document.getElementById('refreshBtn').addEventListener('click', () => {
            this.loadAllData();
        });

        // 사용자 검색
        document.getElementById('userSearch').addEventListener('input', (e) => {
            this.filterUsers();
        });

        // 레벨 필터
        document.getElementById('levelFilter').addEventListener('change', (e) => {
            this.filterUsers();
        });

        // 칭호 설정 저장
        document.getElementById('saveTitlesBtn').addEventListener('click', () => {
            this.saveTitleSettings();
        });

        // 모달 관련
        document.getElementById('closeModal').addEventListener('click', () => {
            this.closeModal();
        });

        document.getElementById('userModal').addEventListener('click', (e) => {
            if (e.target.id === 'userModal') {
                this.closeModal();
            }
        });

        // 모달 내 버튼들
        document.getElementById('applyXPBtn').addEventListener('click', () => {
            this.adjustUserXP();
        });

        document.getElementById('grantTitleBtn').addEventListener('click', () => {
            this.grantSpecialTitle();
        });

        document.getElementById('removeTitleBtn').addEventListener('click', () => {
            this.removeSpecialTitle();
        });
    }

    async loadAllData() {
        const refreshBtn = document.getElementById('refreshBtn');
        refreshBtn.innerHTML = '<div class="loading"></div> 로딩 중...';
        refreshBtn.disabled = true;

        try {
            await Promise.all([
                this.loadDashboardStats(),
                this.loadUsers(),
                this.loadTitleSettings()
            ]);
        } catch (error) {
            console.error('데이터 로드 오류:', error);
            alert('데이터를 불러오는 중 오류가 발생했습니다.');
        } finally {
            refreshBtn.innerHTML = '🔄 새로고침';
            refreshBtn.disabled = false;
        }
    }

    async loadDashboardStats() {
        try {
            const response = await fetch('/api/admin/dashboard/stats', {
                credentials: 'include'
            });

            if (response.ok) {
                const data = await response.json();
                this.updateDashboard(data.stats);
            } else {
                throw new Error('통계 데이터 로드 실패');
            }
        } catch (error) {
            console.error('대시보드 통계 로드 오류:', error);
        }
    }

    updateDashboard(stats) {
        document.getElementById('totalUsers').textContent = stats.totalUsers.toLocaleString();
        document.getElementById('avgLevel').textContent = stats.avgLevel;
        document.getElementById('totalXP').textContent = stats.totalXP.toLocaleString();
        document.getElementById('activeToday').textContent = stats.activeToday;
    }

    async loadUsers() {
        try {
            const response = await fetch('/api/admin/users', {
                credentials: 'include'
            });

            if (response.ok) {
                const data = await response.json();
                this.users = data.users;
                this.displayUsers(this.users);
            } else {
                throw new Error('사용자 데이터 로드 실패');
            }
        } catch (error) {
            console.error('사용자 목록 로드 오류:', error);
        }
    }

    displayUsers(users) {
        const tbody = document.getElementById('userTableBody');
        tbody.innerHTML = '';

        users.forEach(user => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>
                    <strong>${user.username}</strong>
                    ${user.is_admin ? '<span style="color: #e74c3c;">👑</span>' : ''}
                    ${user.is_member ? '<span style="color: #f39c12;">⭐</span>' : ''}
                </td>
                <td><strong>Lv.${user.level}</strong></td>
                <td>${user.experience.toLocaleString()} XP</td>
                <td>
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${user.levelInfo.progressPercent}%"></div>
                    </div>
                    <small>${user.levelInfo.progressPercent}%</small>
                </td>
                <td><span class="title-badge">${user.title}</span></td>
                <td>
                    ${user.special_title ? 
                        `<span class="special-title-badge">${user.special_title}</span>` : 
                        '<span style="color: #999;">없음</span>'
                    }
                </td>
                <td>
                    <button class="btn-primary" onclick="adminManager.openUserModal(${user.id})">
                        관리
                    </button>
                </td>
            `;
            tbody.appendChild(row);
        });
    }

    filterUsers() {
        const searchTerm = document.getElementById('userSearch').value.toLowerCase();
        const levelFilter = document.getElementById('levelFilter').value;

        let filteredUsers = this.users.filter(user => {
            const matchesSearch = user.username.toLowerCase().includes(searchTerm);
            
            let matchesLevel = true;
            if (levelFilter) {
                if (levelFilter === '5+') {
                    matchesLevel = user.level >= 5;
                } else {
                    matchesLevel = user.level == parseInt(levelFilter);
                }
            }

            return matchesSearch && matchesLevel;
        });

        this.displayUsers(filteredUsers);
    }

    async loadTitleSettings() {
        try {
            const response = await fetch('/api/admin/titles/settings', {
                credentials: 'include'
            });

            if (response.ok) {
                const data = await response.json();
                this.titleSettings = data.titleSettings;
                this.displayTitleSettings();
            } else {
                throw new Error('칭호 설정 로드 실패');
            }
        } catch (error) {
            console.error('칭호 설정 로드 오류:', error);
        }
    }

    displayTitleSettings() {
        // 기본 칭호 설정 표시
        const basicTitlesGrid = document.getElementById('basicTitlesGrid');
        basicTitlesGrid.innerHTML = '';

        this.titleSettings.levelTitles.forEach((titleInfo, index) => {
            const titleItem = document.createElement('div');
            titleItem.className = 'title-item';
            titleItem.innerHTML = `
                <label>레벨 ${titleInfo.minLevel}+ 칭호:</label>
                <input type="text" data-index="${index}" value="${titleInfo.title}" 
                       placeholder="칭호 입력">
                <small>${titleInfo.description}</small>
            `;
            basicTitlesGrid.appendChild(titleItem);
        });

        // 특별 칭호 표시
        const specialTitlesGrid = document.getElementById('specialTitlesGrid');
        specialTitlesGrid.innerHTML = '';

        this.titleSettings.specialTitles.forEach(titleInfo => {
            const titleItem = document.createElement('div');
            titleItem.className = 'title-item';
            titleItem.innerHTML = `
                <span class="special-title-badge">${titleInfo.title}</span>
                <p>${titleInfo.description}</p>
            `;
            specialTitlesGrid.appendChild(titleItem);
        });

        // 특별 칭호 선택 옵션 업데이트
        this.updateSpecialTitleSelect();
    }

    updateSpecialTitleSelect() {
        const select = document.getElementById('specialTitleSelect');
        select.innerHTML = '<option value="">칭호 선택</option>';

        this.titleSettings.specialTitles.forEach(titleInfo => {
            const option = document.createElement('option');
            option.value = titleInfo.title;
            option.textContent = `${titleInfo.title} - ${titleInfo.description}`;
            select.appendChild(option);
        });
    }

    async saveTitleSettings() {
        const inputs = document.querySelectorAll('#basicTitlesGrid input');
        const updatedLevelTitles = [...this.titleSettings.levelTitles];

        inputs.forEach(input => {
            const index = parseInt(input.dataset.index);
            updatedLevelTitles[index].title = input.value;
        });

        try {
            const response = await fetch('/api/admin/titles/settings', {
                method: 'PUT',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    levelTitles: updatedLevelTitles
                })
            });

            if (response.ok) {
                const data = await response.json();
                this.titleSettings = data.titleSettings;
                alert('칭호 설정이 저장되었습니다!');
                
                // 사용자 목록 새로고침 (새 칭호 반영)
                await this.loadUsers();
            } else {
                throw new Error('칭호 설정 저장 실패');
            }
        } catch (error) {
            console.error('칭호 설정 저장 오류:', error);
            alert('칭호 설정 저장 중 오류가 발생했습니다.');
        }
    }

    async openUserModal(userId) {
        this.currentUser = this.users.find(user => user.id === userId);
        if (!this.currentUser) return;

        // 모달 제목 설정
        document.getElementById('modalUserName').textContent = 
            `${this.currentUser.username} 사용자 관리`;

        // 현재 경험치 설정
        document.getElementById('currentXP').value = this.currentUser.experience;

        // 입력 필드 초기화
        document.getElementById('xpAdjustment').value = '';
        document.getElementById('adjustmentReason').value = '';

        // 경험치 히스토리 로드
        await this.loadUserHistory(userId);

        // 모달 표시
        document.getElementById('userModal').style.display = 'flex';
    }

    closeModal() {
        document.getElementById('userModal').style.display = 'none';
        this.currentUser = null;
    }

    async adjustUserXP() {
        if (!this.currentUser) return;

        const xpChange = parseInt(document.getElementById('xpAdjustment').value);
        const reason = document.getElementById('adjustmentReason').value;

        if (!xpChange || !reason) {
            alert('경험치 변화량과 사유를 모두 입력해주세요.');
            return;
        }

        try {
            const response = await fetch('/api/admin/users/adjust-xp', {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    userId: this.currentUser.id,
                    xpChange: xpChange,
                    reason: reason
                })
            });

            if (response.ok) {
                const data = await response.json();
                alert(`경험치 조정 완료!\n${data.oldXP} → ${data.newXP} XP${data.leveledUp ? `\n레벨업! ${data.oldLevel} → ${data.newLevel}` : ''}`);
                
                // 데이터 새로고침
                await this.loadUsers();
                await this.loadUserHistory(this.currentUser.id);
                
                // 현재 경험치 업데이트
                document.getElementById('currentXP').value = data.newXP;
                document.getElementById('xpAdjustment').value = '';
                document.getElementById('adjustmentReason').value = '';
            } else {
                throw new Error('경험치 조정 실패');
            }
        } catch (error) {
            console.error('경험치 조정 오류:', error);
            alert('경험치 조정 중 오류가 발생했습니다.');
        }
    }

    async grantSpecialTitle() {
        if (!this.currentUser) return;

        const specialTitle = document.getElementById('specialTitleSelect').value;
        if (!specialTitle) {
            alert('부여할 특별 칭호를 선택해주세요.');
            return;
        }

        await this.manageSpecialTitle('grant', specialTitle);
    }

    async removeSpecialTitle() {
        if (!this.currentUser) return;

        if (!this.currentUser.special_title) {
            alert('제거할 특별 칭호가 없습니다.');
            return;
        }

        await this.manageSpecialTitle('remove');
    }

    async manageSpecialTitle(action, specialTitle = null) {
        try {
            const response = await fetch('/api/admin/users/special-title', {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    userId: this.currentUser.id,
                    action: action,
                    specialTitle: specialTitle
                })
            });

            if (response.ok) {
                const data = await response.json();
                alert(data.message);
                
                // 데이터 새로고침
                await this.loadUsers();
                await this.loadUserHistory(this.currentUser.id);
            } else {
                throw new Error('특별 칭호 관리 실패');
            }
        } catch (error) {
            console.error('특별 칭호 관리 오류:', error);
            alert('특별 칭호 관리 중 오류가 발생했습니다.');
        }
    }

    async loadUserHistory(userId) {
        try {
            const response = await fetch(`/api/admin/users/${userId}/history?limit=10`, {
                credentials: 'include'
            });

            if (response.ok) {
                const data = await response.json();
                this.displayUserHistory(data.history);
            } else {
                throw new Error('히스토리 로드 실패');
            }
        } catch (error) {
            console.error('사용자 히스토리 로드 오류:', error);
        }
    }

    displayUserHistory(history) {
        const historyContainer = document.getElementById('xpHistory');
        historyContainer.innerHTML = '';

        if (history.length === 0) {
            historyContainer.innerHTML = '<p style="color: #999;">히스토리가 없습니다.</p>';
            return;
        }

        history.forEach(item => {
            const historyItem = document.createElement('div');
            historyItem.className = 'history-item';
            
            const date = new Date(item.created_at).toLocaleString();
            const xpText = item.xp_gained > 0 ? `+${item.xp_gained}` : item.xp_gained;
            
            historyItem.innerHTML = `
                <div class="history-date">${date}</div>
                <div class="history-action">${xpText} XP - ${this.getActionTypeName(item.action_type)}</div>
                <div class="history-description">${item.description}</div>
            `;
            
            historyContainer.appendChild(historyItem);
        });
    }

    getActionTypeName(actionType) {
        const actionNames = {
            'wargame_solve': '워게임 해결',
            'admin_adjustment': '관리자 조정',
            'admin_title': '특별 칭호',
            'daily_login': '일일 로그인',
            'first_solve': '최초 해결',
            'knowledge_contribute': '지식 기여'
        };
        
        return actionNames[actionType] || actionType;
    }
}

// 전역 변수로 인스턴스 생성
let adminManager;

// DOM 로드 완료 시 초기화
document.addEventListener('DOMContentLoaded', () => {
    adminManager = new AdminLevelManager();
}); 