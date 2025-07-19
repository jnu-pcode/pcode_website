// mapData.js 파일에서 배열 가져오기
import { mapData, objectData } from './mapData.js';
// pathfinding.js 파일에서 함수 가져오기
import { findPath } from './pathfinding.js';

let moveQueue = [];

// 시간 기반 이동을 위한 변수
let lastTime = 0;
const BASE_SPEED = 120; // 픽셀/초

// 성능 모니터링을 위한 변수
let frameCount = 0;
let lastFpsUpdate = 0;
let currentFps = 60;

// 반응형 캔버스를 위한 변수
let canvasWidth = window.innerWidth;
let canvasHeight = window.innerHeight;

// canvas 설정 및 최적화
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// 고품질 렌더링을 위한 설정
ctx.imageSmoothingEnabled = true;
ctx.imageSmoothingQuality = 'high';

// 레티나 디스플레이 대응
const devicePixelRatio = window.devicePixelRatio || 1;

// 캔버스 크기 설정 함수
function resizeCanvas() {
    canvasWidth = window.innerWidth;
    canvasHeight = window.innerHeight;
    
    canvas.width = canvasWidth * devicePixelRatio;
    canvas.height = canvasHeight * devicePixelRatio;
    canvas.style.width = canvasWidth + 'px';
    canvas.style.height = canvasHeight + 'px';
    
    ctx.scale(devicePixelRatio, devicePixelRatio);
    
    // 고품질 렌더링 설정 재적용 (scale 후에 다시 설정)
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
}

// 초기 캔버스 크기 설정
resizeCanvas();

// 브라우저 크기 변경 시 캔버스 크기 조정
window.addEventListener('resize', resizeCanvas);

const TILE_SIZE = 48;
const MAP_WIDTH = mapData[0].length;
const MAP_HEIGHT = mapData.length;

// 렌더링 최적화를 위한 변수
let lastCameraX = -1;
let lastCameraY = -1;
const RENDER_BUFFER = 2; // 화면 밖 타일도 몇 개 더 그리기

// 이미지 로드
const tileImages = {
    0: new Image(), 1: new Image(), 2: new Image(),
};
const objectImages = {
    1: new Image(), 2: new Image(), 3: new Image(), 4: new Image(),
};

tileImages[0].src = 'assets/grass.png';
tileImages[1].src = 'assets/path.png';
tileImages[2].src = 'assets/road.png';

objectImages[1].src = 'assets/tree.png';
objectImages[2].src = 'assets/street_light.png';
objectImages[3].src = 'assets/house.png';
objectImages[4].src = 'assets/wargame_center.png';

const avatarImage = new Image();
avatarImage.src = 'assets/avatar.png';


let avatarX = 0;
let avatarY = 0;
let targetX = avatarX;
let targetY = avatarY;

let cameraX = 0;
let cameraY = 0;

// 키보드 입력 상태를 추적하는 객체
const keys = {
    ArrowUp: false, w: false,
    ArrowDown: false, s: false,
    ArrowLeft: false, a: false,
    ArrowRight: false, d: false
};

// 이동 가능한 타일인지 확인하는 함수 (A* 알고리즘용)
function isWalkable(x, y) {
    if (x < 0 || y < 0 || x >= MAP_WIDTH || y >= MAP_HEIGHT) return false;

    const obj = objectData[y][x];
    if (obj === -1) {
        // 예외 처리: 집 우하단 타일 (2x2의 [1,1] → objectData[y][x] == -1)
        // → 실제 좌상단이 3이면 이동 허용
        const topLeftX = x - 1;
        const topLeftY = y - 1;
        if (objectData[topLeftY]?.[topLeftX] === 3) return true;

        // 워게임센터 하단 중앙: (3x3의 중앙 아래 → objectData[y][x] == -1)
        const centerX = x;
        const topY = y - 2;
        if (objectData[topY]?.[centerX - 1] === 4) return true;

        return false;
    }

    // object가 있을 경우
    if (obj > 0) return false;

    const tile = mapData[y][x];
    return tile !== undefined;
}


function updateCamera() {
    // 아바타를 화면 중앙에 배치
    cameraX = avatarX - canvasWidth / 2;
    cameraY = avatarY - canvasHeight / 2;

    // 카메라가 맵 경계를 벗어나지 않도록 제한
    const maxCameraX = MAP_WIDTH * TILE_SIZE - canvasWidth;
    const maxCameraY = MAP_HEIGHT * TILE_SIZE - canvasHeight;
    
    cameraX = Math.max(0, Math.min(cameraX, maxCameraX));
    cameraY = Math.max(0, Math.min(cameraY, maxCameraY));
}

// 이미지 로드 처리 함수
function loadImages(images, callback) {
    let loadedImages = 0;
    const totalImages = Object.keys(images).length;
    
    console.log('이미지 로딩 시작, 총 이미지 수:', totalImages);
    
    const checkAllLoaded = () => {
        loadedImages++;
        console.log('이미지 로드됨:', loadedImages, '/', totalImages);
        if (loadedImages === totalImages) {
            console.log('모든 이미지 로딩 완료');
            callback();
        }
    };
    
    Object.values(images).forEach((img, index) => {
        if (img.complete) {
            checkAllLoaded();
        } else {
            img.onload = checkAllLoaded;
            img.onerror = (error) => {
                console.error('이미지 로딩 실패:', img.src, error);
                checkAllLoaded(); // 실패해도 카운트 증가
            };
        }
    });
}

// 아바타의 초기 위치 설정 함수
function setInitialAvatarPosition() {
    const startTileX = Math.floor(MAP_WIDTH / 2);
    const startTileY = Math.floor(MAP_HEIGHT / 2);
    avatarX = startTileX * TILE_SIZE + TILE_SIZE / 2;
    avatarY = startTileY * TILE_SIZE + TILE_SIZE / 2;
    targetX = avatarX;
    targetY = avatarY;
}

// 아바타 이동 처리 함수
function moveAvatar(dx, dy, speed) {
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < speed) {
        avatarX = targetX;
        avatarY = targetY;
        moveQueue.shift();
    } else {
        avatarX += (dx / dist) * speed;
        avatarY += (dy / dist) * speed;
    }
}

// 키보드 입력에 따른 아바타 이동 처리
function handleKeyboardInput() {
    const startX = Math.floor(avatarX / TILE_SIZE);
    const startY = Math.floor(avatarY / TILE_SIZE);
    let endX = startX;
    let endY = startY;

    if (keys.ArrowUp || keys.w) {
        endY = startY - 1;
    } else if (keys.ArrowDown || keys.s) {
        endY = startY + 1;
    } else if (keys.ArrowLeft || keys.a) {
        endX = startX - 1;
    } else if (keys.ArrowRight || keys.d) {
        endX = startX + 1;
    }

    if (endX !== startX || endY !== startY) {
        const path = findPath(startX, startY, endX, endY, isWalkable);
        if (path) {
            moveQueue = path.map(p => {
                const tile = mapData[p.y][p.x];
                let speed = 1; // 기본: 잔디
                if (tile === 1 || tile === 2) speed = 2.5; // 돌길/도로 빠르게
                return {
                    x: p.x * TILE_SIZE + TILE_SIZE / 2,
                    y: p.y * TILE_SIZE + TILE_SIZE / 2,
                    speed: speed
                };
            });
        }
    }
}

// 게임 루프: 시간 기반 애니메이션으로 수정 + 성능 최적화
function gameLoop(currentTime = 0) {
    const deltaTime = currentTime - lastTime;
    lastTime = currentTime;
    
    // FPS 계산 (1초마다 업데이트)
    frameCount++;
    if (currentTime - lastFpsUpdate >= 1000) {
        currentFps = frameCount;
        frameCount = 0;
        lastFpsUpdate = currentTime;
        console.log('FPS:', currentFps); // 필요시 주석 해제
    }
    
    // 첫 프레임이나 너무 큰 델타타임은 무시
    if (deltaTime > 100 || deltaTime < 0) {
        requestAnimationFrame(gameLoop);
        return;
    }

    // 이동 처리 (60fps 이상에서는 부드럽게)
    const targetFps = Math.min(currentFps, 120); // 120fps로 제한
    const frameTimeTarget = 1000 / targetFps;
    
    if (moveQueue.length > 0) {
        const next = moveQueue[0];
        const dx = next.x - avatarX;
        const dy = next.y - avatarY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const actualSpeed = (next.speed ?? 1) * BASE_SPEED * (deltaTime / 1000);

        if (dist < actualSpeed) {
            avatarX = next.x;
            avatarY = next.y;
            moveQueue.shift();
        } else {
            avatarX += (dx / dist) * actualSpeed;
            avatarY += (dy / dist) * actualSpeed;
        }
    } else {
        // 이동 큐가 비어있을 때만 키보드 입력 처리
        handleKeyboardInput();
    }
    
    // 카메라와 렌더링 (필요할 때만 업데이트)
    updateCamera();
    
    // 렌더링 최적화: 카메라가 움직였거나 아바타가 움직였을 때만 다시 그리기
    const cameraChanged = Math.abs(cameraX - lastCameraX) > 0.1 || Math.abs(cameraY - lastCameraY) > 0.1;
    if (cameraChanged || moveQueue.length > 0) {
        draw();
        lastCameraX = cameraX;
        lastCameraY = cameraY;
    }
    
    updateHintBar();
    
    // 다음 프레임 요청
    requestAnimationFrame(gameLoop);
}

// 화면을 그리는 함수 (최적화된 버전)
function draw() {
    // 부분 렌더링을 위한 영역 계산
    const startX = Math.max(0, Math.floor(cameraX / TILE_SIZE) - RENDER_BUFFER);
    const endX = Math.min(MAP_WIDTH, Math.ceil((cameraX + canvasWidth) / TILE_SIZE) + RENDER_BUFFER);
    const startY = Math.max(0, Math.floor(cameraY / TILE_SIZE) - RENDER_BUFFER);
    const endY = Math.min(MAP_HEIGHT, Math.ceil((cameraY + canvasHeight) / TILE_SIZE) + RENDER_BUFFER);

    // 배경 클리어 (필요한 영역만)
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);

    // 타일 그리기 (화면에 보이는 부분만)
    for (let y = startY; y < endY; y++) {
        for (let x = startX; x < endX; x++) {
            const tileType = mapData[y][x];
            const tileImage = tileImages[tileType];
            if (tileImage && tileImage.complete) {
                const drawX = x * TILE_SIZE - cameraX;
                const drawY = y * TILE_SIZE - cameraY;
                
                // 화면 밖 타일은 건너뛰기
                if (drawX > canvasWidth || drawY > canvasHeight || drawX < -TILE_SIZE || drawY < -TILE_SIZE) {
                    continue;
                }
                
                ctx.drawImage(tileImage, drawX, drawY, TILE_SIZE, TILE_SIZE);
            }
        }
    }

    // 오브젝트 그리기 (화면에 보이는 부분만)
    for (let y = startY; y < endY; y++) {
        for (let x = startX; x < endX; x++) {
            const objectType = objectData[y][x];
            if (objectType > 0) {
                const objectImage = objectImages[objectType];
                if (objectImage && objectImage.complete) {
                    let width = TILE_SIZE;
                    let height = TILE_SIZE;
                    if (objectType === 3) {
                        width = TILE_SIZE * 2;
                        height = TILE_SIZE * 2;
                    } else if (objectType === 4) {
                        width = TILE_SIZE * 3;
                        height = TILE_SIZE * 3;
                    }
                    
                    const drawX = x * TILE_SIZE - cameraX;
                    const drawY = y * TILE_SIZE - cameraY;
                    
                    // 화면 밖 오브젝트는 건너뛰기
                    if (drawX > canvasWidth || drawY > canvasHeight || drawX < -width || drawY < -height) {
                        continue;
                    }
                    
                    ctx.drawImage(objectImage, drawX, drawY, width, height);
                }
            }
        }
    }
    
    // 아바타 그리기 (anti-aliasing 적용)
    const avatarSize = 80;
    const avatarDrawX = avatarX - avatarSize / 2 - cameraX;
    const avatarDrawY = avatarY - avatarSize / 2 - cameraY;
    
    // 부드러운 렌더링을 위한 설정
    ctx.save();
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(avatarImage, avatarDrawX, avatarDrawY, avatarSize, avatarSize);
    ctx.restore();
}

function updateHintBar() {
    const hintBar = document.getElementById("hintBar");
    const nearby = getNearbyInteractableTile();

    if (nearby) {
        let objCenterX, objTopY, objWidth;
        
        if (nearby.type === 3) { // 집 (2x2)
            objWidth = TILE_SIZE * 2;
            objCenterX = (nearby.x * TILE_SIZE) + (objWidth / 2) - cameraX;
            objTopY = (nearby.y * TILE_SIZE) - cameraY;
        } else if (nearby.type === 4) { // 워게임센터 (3x3)
            objWidth = TILE_SIZE * 3;
            objCenterX = (nearby.x * TILE_SIZE) + (objWidth / 2) - cameraX;
            objTopY = (nearby.y * TILE_SIZE) - cameraY;
        } else {
            // 기본 1x1 오브젝트
            objWidth = TILE_SIZE;
            objCenterX = (nearby.x * TILE_SIZE) + (objWidth / 2) - cameraX;
            objTopY = (nearby.y * TILE_SIZE) - cameraY;
        }

        // 힌트 박스를 오브젝트 중앙 상단에 배치
        hintBar.style.left = `${objCenterX}px`;
        hintBar.style.top = `${objTopY - 30}px`; // 오브젝트 위쪽 30px
        hintBar.style.transform = 'translateX(-50%)'; // 중앙 정렬
        hintBar.innerText = "E 키를 눌러 입장하세요";
        hintBar.style.display = "block";
    } else {
        hintBar.style.display = "none";
    }
}

// 주변 상호작용 가능한 타일 찾기
function getNearbyInteractableTile() {
    const tileX = Math.floor(avatarX / TILE_SIZE);
    const tileY = Math.floor(avatarY / TILE_SIZE);

    const offsets = [
        [0, 0], [1, 0], [-1, 0], [0, 1], [0, -1]
    ];

    for (const [dx, dy] of offsets) {
        const nx = tileX + dx;
        const ny = tileY + dy;

        if (nx < 0 || ny < 0 || nx >= MAP_WIDTH || ny >= MAP_HEIGHT) continue;

        const obj = objectData[ny][nx];

        // 집의 우하단 (2x2 기준), 원래 좌상단이 3
        if (obj === -1 && objectData[ny - 1]?.[nx - 1] === 3) {
            return { type: 3, x: nx - 1, y: ny - 1 };
        }

        // 워게임센터의 하단 중앙 (3x3 기준), 원래 좌상단이 4
        if (obj === -1 && objectData[ny - 2]?.[nx - 1] === 4) {
            return { type: 4, x: nx - 1, y: ny - 2 };
        }
    }

    return null;
}


// 서버에서 사용자 정보를 가져오는 함수
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

let userInfo = null; // 전역 변수로 사용자 정보 저장

// JWT 토큰을 쿠키에서 가져오는 함수 (httpOnly 쿠키로는 접근 불가능하므로 사용하지 않음)
// function getTokenFromCookies() {
//     const token = document.cookie.split('; ').find(row => row.startsWith('token='));
//     return token ? token.split('=')[1] : null;
// }

// 아바타 위치를 서버에 저장하는 함수
const saveAvatarPosition = async () => {
    if (!userInfo || !userInfo.userId) {
        // 사용자 정보가 없어 위치를 저장하지 않습니다.
        return;
    }

    try {
        // 위치 저장 요청 전송 (httpOnly 쿠키 자동 포함)
        const response = await fetch('/api/user/position', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include', // httpOnly 쿠키 자동 포함
            body: JSON.stringify({
                x_position: Math.round(avatarX), // 정수로 저장
                y_position: Math.round(avatarY)  // 정수로 저장
            })
        });

        // 위치 저장 응답 상태
        if (!response.ok) {
            const errorData = await response.json();
            console.error('위치 저장 실패:', errorData.message);
        } else {
            console.log('위치 저장 성공');
        }
    } catch (error) {
        console.error('위치 저장 중 오류 발생:', error);
    }
};

// 브라우저 닫기 또는 페이지 이동 시 위치 저장
window.addEventListener('beforeunload', (event) => {
    if (userInfo && userInfo.userId) {
        const data = new FormData();
        data.append('x_position', Math.round(avatarX));
        data.append('y_position', Math.round(avatarY));
        // sendBeacon은 자동으로 쿠키를 포함합니다
        navigator.sendBeacon('/api/user/position', data);
    }
});

// E 키 상호작용 시 위치 저장 후 페이지 이동
window.addEventListener('keydown', async (event) => {
    if (event.key === 'e' || event.key === 'E') {
        const nearby = getNearbyInteractableTile();
        if (nearby) {
            if (!userInfo) { // 로그인하지 않은 경우
                window.location.href = '/login?message=' + encodeURIComponent('이 기능은 로그인이 필요합니다.');
                return;
            }
            if (nearby.type === 4) { // 워게임센터
                await saveAvatarPosition(); // 페이지 이동 전 위치 저장
                window.location.href = '/wargame';
            } else if (nearby.type === 3) { // 집
                if (!userInfo.is_member) {
                    window.location.href = '/login?message=' + encodeURIComponent('이곳은 동아리원만 입장할 수 있습니다.');
                    return;
                }
                await saveAvatarPosition(); // 페이지 이동 전 위치 저장
                // 추후 개인 집 페이지로 이동 로직 추가
            }
        }
    }
});

// 이벤트 리스너 설정 함수
function setupEventListeners() {
    // 마우스 클릭 이벤트 처리
    canvas.addEventListener('mousedown', (event) => {
        const rect = canvas.getBoundingClientRect();
        const worldX = cameraX + event.clientX - rect.left;
        const worldY = cameraY + event.clientY - rect.top;
        const tileX = Math.floor(worldX / TILE_SIZE);
        const tileY = Math.floor(worldY / TILE_SIZE);

        const startX = Math.floor(avatarX / TILE_SIZE);
        const startY = Math.floor(avatarY / TILE_SIZE);

        if (isWalkable(tileX, tileY)) {
            const path = findPath(startX, startY, tileX, tileY, isWalkable);
            if (path) {
                moveQueue = path.map(p => {
                    const tile = mapData[p.y][p.x];
                    let speed = 1; // 기본: 잔디
                    if (tile === 1 || tile === 2) speed = 2.5; // 돌길/도로 빠르게
                    return {
                        x: p.x * TILE_SIZE + TILE_SIZE / 2,
                        y: p.y * TILE_SIZE + TILE_SIZE / 2,
                        speed: speed
                    };
                });
            }
        }
    });

    // 키보드 이벤트 리스너
    window.addEventListener('keydown', (event) => {
        if (keys[event.key] !== undefined) {
            keys[event.key] = true;
        }
    });

    window.addEventListener('keyup', (event) => {
        if (keys[event.key] !== undefined) {
            keys[event.key] = false;
        }
    });
}

// 초기화 함수
async function initializeGame() {
    console.log('게임 초기화 시작');
    
    try {
        userInfo = await getUserInfoFromServer(); // 서버에서 사용자 정보 가져오기
        console.log('사용자 정보:', userInfo);

        if (userInfo && userInfo.x_position !== undefined && userInfo.y_position !== undefined) {
            // 저장된 위치가 있으면 해당 위치로 아바타 설정
            avatarX = userInfo.x_position;
            avatarY = userInfo.y_position;
            targetX = userInfo.x_position;
            targetY = userInfo.y_position;
            console.log('저장된 위치로 설정:', avatarX, avatarY);
        } else {
            // 저장된 위치가 없거나 로그인하지 않은 경우 기본 위치 (맵 중앙 근처)
            setInitialAvatarPosition();
            console.log('기본 위치로 설정:', avatarX, avatarY);
        }

        setupEventListeners();
        console.log('이벤트 리스너 설정 완료');

        // 이미지 로딩 후 게임 시작
        loadImages({...tileImages, ...objectImages, avatarImage}, () => {
            console.log('게임 루프 시작');
            gameLoop();
        });
    } catch (error) {
        console.error('게임 초기화 중 오류:', error);
    }
}

// 게임 시작 (DOMContentLoaded 이벤트에서 호출)
document.addEventListener('DOMContentLoaded', async () => {
    console.log('DOM 로드 완료, 게임 초기화 시작');
    await initializeGame();
});