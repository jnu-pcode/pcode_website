function heuristic(x1, y1, x2, y2) {
    return Math.abs(x1 - x2) + Math.abs(y1 - y2);
}

export function findPath(startX, startY, endX, endY, isWalkable) {
    if (!isWalkable(startX, startY) || !isWalkable(endX, endY)) {
        console.warn("❗ 시작 또는 도착 타일이 이동 불가");
        return null;
    }

    const openSet = [{ x: startX, y: startY }];
    const cameFrom = {};
    const gScore = { [`${startX},${startY}`]: 0 };
    const fScore = { [`${startX},${startY}`]: heuristic(startX, startY, endX, endY) };

    const visited = new Set();

    let iterationCount = 0;
    const MAX_ITER = 5000;

    while (openSet.length > 0) {
        iterationCount++;
        if (iterationCount > MAX_ITER) {
            console.warn("❗ A* 반복 초과로 종료");
            return null;
        }

        let lowestIndex = 0;
        for (let i = 1; i < openSet.length; i++) {
            const a = fScore[`${openSet[i].x},${openSet[i].y}`] || Infinity;
            const b = fScore[`${openSet[lowestIndex].x},${openSet[lowestIndex].y}`] || Infinity;
            if (a < b) lowestIndex = i;
        }

        const current = openSet.splice(lowestIndex, 1)[0];
        const key = `${current.x},${current.y}`;
        visited.add(key);

        if (current.x === endX && current.y === endY) {
            const path = [];
            let node = current;
            while (node) {
                path.unshift(node);
                node = cameFrom[`${node.x},${node.y}`];
            }
            return path;
        }

        for (const [dx, dy] of [[0, 1], [1, 0], [0, -1], [-1, 0], [1, 1], [-1, -1], [1, -1], [-1, 1]]) {
            const nx = current.x + dx;
            const ny = current.y + dy;
            const nKey = `${nx},${ny}`;

            if (!isWalkable(nx, ny) || visited.has(nKey)) continue;

            const tentativeG = gScore[key] + 1;
            if (tentativeG < (gScore[nKey] || Infinity)) {
                cameFrom[nKey] = current;
                gScore[nKey] = tentativeG;
                fScore[nKey] = tentativeG + heuristic(nx, ny, endX, endY);
                if (!openSet.find(n => n.x === nx && n.y === ny)) {
                    openSet.push({ x: nx, y: ny });
                }
            }
        }
    }

    console.warn("❗ 목적지에 도달하지 못함");
    return null;
}
