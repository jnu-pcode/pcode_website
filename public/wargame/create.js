// public/wargame/create.js (최종)
// 최종 수정일: 2025년 7월 15일 13시 40분

document.addEventListener('DOMContentLoaded', async () => { // async 추가
    const form = document.getElementById('create-form');
    const messageEl = document.getElementById('message');

    // 서버에서 사용자 정보를 가져오는 함수 (httpOnly 쿠키 사용)
    const getUserInfoFromServer = async () => {
        try {
            const response = await fetch('/api/user/me', {
                method: 'GET',
                credentials: 'include' // 쿠키 포함
            });
            
            if (response.ok) {
                const userData = await response.json();
                return userData.user;
            } else {
                console.log('사용자 정보를 가져올 수 없습니다:', response.status);
                return null;
            }
        } catch (error) {
            console.log('사용자 정보 요청 중 오류:', error);
            return null;
        }
    };

    // 페이지 로드 시 권한 확인 (동아리원만 접근 가능)
    const userInfo = await getUserInfoFromServer();
    if (!userInfo) {
        alert('로그인이 필요합니다.');
        window.location.href = '/login';
        return; // 코드 실행 중단
    }
    
    if (!userInfo.is_member) { // is_member 권한 확인
        alert('동아리원 권한이 필요합니다. 인증코드를 입력하여 동아리원 권한을 획득해주세요.');
        window.location.href = '/login';
        return; // 코드 실행 중단
    }

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const formData = new FormData(form);
        const submitButton = form.querySelector('button[type="submit"]');
        const originalButtonText = submitButton.textContent;

        // 프로그레스 관련 요소
        const progressContainer = document.getElementById('progress-container');
        const progressFill = document.getElementById('progress-fill');
        const step1 = document.getElementById('step-1');
        const step2 = document.getElementById('step-2');
        const step3 = document.getElementById('step-3');

        // 버튼 상태 업데이트 함수
        const updateButtonStatus = (text, disabled = true) => {
            submitButton.textContent = text;
            submitButton.disabled = disabled;
            submitButton.style.background = disabled ? '#95a5a6' : '';
        };

        // 메시지 업데이트 함수
        const updateMessage = (text, color = 'blue') => {
            messageEl.textContent = text;
            messageEl.style.color = color;
        };

        // 프로그레스 업데이트 함수
        const updateProgress = (step) => {
            // 프로그레스 컨테이너 표시
            progressContainer.style.display = 'block';
            
            // 모든 스텝 초기화
            [step1, step2, step3].forEach(s => {
                s.classList.remove('active', 'completed');
            });
            
            switch(step) {
                case 1:
                    progressFill.style.width = '33%';
                    step1.classList.add('active');
                    break;
                case 2:
                    progressFill.style.width = '66%';
                    step1.classList.add('completed');
                    step2.classList.add('active');
                    break;
                case 3:
                    progressFill.style.width = '100%';
                    step1.classList.add('completed');
                    step2.classList.add('completed');
                    step3.classList.add('active');
                    break;
                default:
                    progressContainer.style.display = 'none';
                    progressFill.style.width = '0%';
            }
        };

        try {
            // 1단계: 압축 해제 중
            updateProgress(1);
            updateButtonStatus('📦 압축 해제 중...');
            updateMessage('ZIP 파일을 업로드하고 압축을 해제하고 있습니다...', 'blue');

            // 2단계로 진행하는 타이머 설정
            const stage2Timer = setTimeout(() => {
                updateProgress(2);
                updateButtonStatus('🐳 도커 이미지 생성 중...');
                updateMessage('Dockerfile을 빌드하고 도커 이미지를 생성하고 있습니다...', 'orange');
            }, 2000);

            // HttpOnly 쿠키 포함하여 API 호출
            const response = await fetch('/api/wargames/create', {
                method: 'POST',
                credentials: 'include', // 쿠키 포함
                body: formData
            });

            // 응답이 빠르게 오면 타이머 취소하고 즉시 다음 단계
            clearTimeout(stage2Timer);
            updateProgress(2);
            updateButtonStatus('🐳 도커 이미지 생성 중...');
            updateMessage('Dockerfile을 빌드하고 도커 이미지를 생성하고 있습니다...', 'orange');

            const data = await response.json();

            if (response.ok) {
                // 3단계: 완료
                updateProgress(3);
                updateButtonStatus('✅ 완료!', false);
                updateMessage(`🎉 ${data.message}`, 'green');
                
                // 성공 알림창 표시
                setTimeout(() => {
                    alert(`✅ 문제가 성공적으로 등록되었습니다!\n\n📝 제목: ${formData.get('title')}\n🏷️ 카테고리: ${formData.get('category')}\n⭐ 난이도: ${formData.get('difficulty')}/5\n\n이제 다른 사용자들이 이 문제를 풀 수 있습니다!`);
                    
                    // 폼 리셋 및 UI 원래 상태로 복원
                form.reset();
                    updateButtonStatus(originalButtonText, false);
                    updateProgress(0); // 프로그레스 바 숨기기
                    messageEl.textContent = '';
                }, 2000); // 완료 상태를 좀 더 오래 보여주기
                
            } else {
                // 오류 발생
                updateProgress(0); // 프로그레스 바 숨기기
                updateButtonStatus('❌ 등록 실패', false);
                updateMessage(`⚠️ ${data.message}`, 'red');
                
                // 3초 후 버튼 원래 상태로 복원
                setTimeout(() => {
                    updateButtonStatus(originalButtonText, false);
                }, 3000);
            }
        } catch (err) {
            // 네트워크 오류 등
            updateProgress(0); // 프로그레스 바 숨기기
            updateButtonStatus('❌ 연결 오류', false);
            updateMessage('⚠️ 서버 연결 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.', 'red');
            console.error('문제 등록 오류:', err);
            
            // 3초 후 버튼 원래 상태로 복원
            setTimeout(() => {
                updateButtonStatus(originalButtonText, false);
            }, 3000);
        }
    });
});