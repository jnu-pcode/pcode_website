// mapData.js 파일에서 배열 가져오기
import { mapData, objectData } from './mapData.js';
// pathfinding.js 파일에서 함수 가져오기
import { findPath } from './pathfinding.js';

let moveQueue = [];

// canvas 설정
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const TILE_SIZE = 48;
const MAP_WIDTH = mapData[0].length;
const MAP_HEIGHT = mapData.length;

canvas.width = 800;
canvas.height = 600;

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
    if (obj > 0 && obj !== 3 && obj !== 4) return false;

    const tile = mapData[y][x];
    return tile !== undefined;
}


function updateCamera() {
    cameraX = avatarX - canvas.width / 2;
    cameraY = avatarY - canvas.height / 2;

    cameraX = Math.max(0, Math.min(cameraX, MAP_WIDTH * TILE_SIZE - canvas.width));
    cameraY = Math.max(0, Math.min(cameraY, MAP_HEIGHT * TILE_SIZE - canvas.height));
}

let imagesLoaded = 0;
const totalImages = Object.keys(tileImages).length + Object.keys(objectImages).length + 1;

function imageLoaded() {
    imagesLoaded++;
    if (imagesLoaded === totalImages) {
        const startTileX = Math.floor(MAP_WIDTH / 2);
        const startTileY = Math.floor(MAP_HEIGHT / 2);
        avatarX = startTileX * TILE_SIZE + TILE_SIZE / 2;
        avatarY = startTileY * TILE_SIZE + TILE_SIZE / 2;
        targetX = avatarX;
        targetY = avatarY;
        gameLoop();
    }
}

Object.values(tileImages).forEach(img => img.onload = imageLoaded);
Object.values(objectImages).forEach(img => img.onload = imageLoaded);
avatarImage.onload = imageLoaded;

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

// 키보드 이벤트: 키를 누르면 상태를 true로 설정
window.addEventListener('keydown', (event) => {
    if (keys[event.key] !== undefined) {
        keys[event.key] = true;
    }
    if (event.key === 'e' || event.key === 'E') {
        const nearby = getNearbyInteractableTile();
        if (nearby && nearby.type === 4) { // 4는 워게임센터
            window.location.href = '/wargame.html';
        }
    }
});

// 키보드 이벤트: 키를 떼면 상태를 false로 설정
window.addEventListener('keyup', (event) => {
    if (keys[event.key] !== undefined) {
        keys[event.key] = false;
    }
});

// 게임 루프: 부드러운 애니메이션을 위한 핵심
function gameLoop() {
    if (moveQueue.length > 0) {
        const next = moveQueue[0];
        const dx = next.x - avatarX;
        const dy = next.y - avatarY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const speed = next.speed ?? 1; // fallback

        if (dist < speed) {
            avatarX = next.x;
            avatarY = next.y;
            moveQueue.shift();
        } else {
            avatarX += (dx / dist) * speed;
            avatarY += (dy / dist) * speed;
        }
    } else {
        // 이동 큐가 비어있을 때만 키보드 입력 처리
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
    
    updateCamera();
    draw();
    updateHintBar();
    requestAnimationFrame(gameLoop);
}

// 화면을 그리는 함수
function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 타일 그리기
    for (let y = 0; y < MAP_HEIGHT; y++) {
        for (let x = 0; x < MAP_WIDTH; x++) {
            const tileType = mapData[y][x];
            const tileImage = tileImages[tileType];
            if (tileImage) {
                ctx.drawImage(tileImage, x * TILE_SIZE - cameraX, y * TILE_SIZE - cameraY, TILE_SIZE, TILE_SIZE);
            }
        }
    }

    // 오브젝트 그리기
    for (let y = 0; y < MAP_HEIGHT; y++) {
        for (let x = 0; x < MAP_WIDTH; x++) {
            const objectType = objectData[y][x];
            if (objectType !== 0) {
                const objectImage = objectImages[objectType];
                if (objectImage) {
                    let width = TILE_SIZE;
                    let height = TILE_SIZE;
                    if (objectType === 3) {
                        width = TILE_SIZE * 2;
                        height = TILE_SIZE * 2;
                    } else if (objectType === 4) {
                        width = TILE_SIZE * 3;
                        height = TILE_SIZE * 3;
                    }
                    ctx.drawImage(objectImage, x * TILE_SIZE - cameraX, y * TILE_SIZE - cameraY, width, height);
                }
            }
        }
    }
    // 아바타
    const avatarSize = 80;
    ctx.drawImage(avatarImage, avatarX - avatarSize / 2 - cameraX, avatarY - avatarSize / 2 - cameraY, avatarSize, avatarSize);
}

function updateHintBar() {
    const hintBar = document.getElementById("hintBar");
    const nearby = getNearbyInteractableTile();

    if (nearby) {
        let widthInTiles = 1;
        let heightInTiles = 1;
        if (nearby.type === 3) { widthInTiles = 2; heightInTiles = 2; }
        if (nearby.type === 4) { widthInTiles = 3; heightInTiles = 3; }

        const worldX = (nearby.x + widthInTiles / 2) * TILE_SIZE;
        const worldY = (nearby.y - 0.5) * TILE_SIZE; // 살짝 위에 띄우기

        const screenX = worldX - cameraX;
        const screenY = worldY - cameraY;

        hintBar.style.left = `${screenX}px`;
        hintBar.style.top = `${screenY}px`;
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


// 모든 이미지 로드 후 게임 시작
Object.values(tileImages).forEach(img => img.onload = imageLoaded);
Object.values(objectImages).forEach(img => img.onload = imageLoaded);
avatarImage.onload = imageLoaded;


