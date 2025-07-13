import { mapData, objectData } from './mapData.js';

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const TILE_SIZE = 48;
const MAP_WIDTH = mapData[0].length;
const MAP_HEIGHT = mapData.length;

canvas.width = 768;
canvas.height = 576;

const tileImages = {
    0: new Image(),
    1: new Image(),
    2: new Image(),
};
const objectImages = {
    1: new Image(),
    2: new Image(),
    3: new Image(),
    4: new Image(),
};

tileImages[0].src = 'assets/grass.png';
tileImages[1].src = 'assets/path.png';
tileImages[2].src = 'assets/road.png';

objectImages[1].src = 'assets/tree.png';
objectImages[2].src = 'assets/street_light.png';
objectImages[3].src = 'assets/house.png';             // 2x2 → 96x96
objectImages[4].src = 'assets/wargame_center.png';     // 3x3 → 144x144

const avatarImage = new Image();
avatarImage.src = 'assets/avatar.png';

let avatarX = MAP_WIDTH * TILE_SIZE / 2;
let avatarY = MAP_HEIGHT * TILE_SIZE / 2;
let targetX = avatarX;
let targetY = avatarY;
const movementSpeed = 3;

let cameraX = 0;
let cameraY = 0;

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
        gameLoop();
    }
}

Object.values(tileImages).forEach(img => img.onload = imageLoaded);
Object.values(objectImages).forEach(img => img.onload = imageLoaded);
avatarImage.onload = imageLoaded;

canvas.addEventListener('mousedown', (event) => {
    const rect = canvas.getBoundingClientRect();
    targetX = cameraX + event.clientX - rect.left;
    targetY = cameraY + event.clientY - rect.top;
});

window.addEventListener('keydown', (event) => {
    const speed = 5;
    switch (event.key) {
        case 'ArrowUp':
        case 'w':
            avatarY -= speed;
            targetY = avatarY;
            break;
        case 'ArrowDown':
        case 's':
            avatarY += speed;
            targetY = avatarY;
            break;
        case 'ArrowLeft':
        case 'a':
            avatarX -= speed;
            targetX = avatarX;
            break;
        case 'ArrowRight':
        case 'd':
            avatarX += speed;
            targetX = avatarX;
            break;
    }
});

function gameLoop() {
    const dx = targetX - avatarX;
    const dy = targetY - avatarY;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance > movementSpeed) {
        avatarX += (dx / distance) * movementSpeed;
        avatarY += (dy / distance) * movementSpeed;
    } else {
        avatarX = targetX;
        avatarY = targetY;
    }

    updateCamera();
    draw();
    requestAnimationFrame(gameLoop);
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 타일
    for (let y = 0; y < MAP_HEIGHT; y++) {
        for (let x = 0; x < MAP_WIDTH; x++) {
            const tileType = mapData[y][x];
            const tileImage = tileImages[tileType];
            if (tileImage) {
                ctx.drawImage(tileImage, x * TILE_SIZE - cameraX, y * TILE_SIZE - cameraY, TILE_SIZE, TILE_SIZE);
            }
        }
    }

    // 오브젝트 (멀티타일 + -1 무시)
    for (let y = 0; y < MAP_HEIGHT; y++) {
        for (let x = 0; x < MAP_WIDTH; x++) {
            const objectType = objectData[y][x];
            if (objectType === 0 || objectType === -1) continue;

            const objectImage = objectImages[objectType];
            if (!objectImage) continue;

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

    // 아바타
    const avatarSize = 40;
    ctx.drawImage(avatarImage, avatarX - avatarSize / 2 - cameraX, avatarY - avatarSize / 2 - cameraY, avatarSize, avatarSize);
}
