import type {Point} from "./dataConverter";

type PathNode = {
    x: number;
    y: number;
    g: number;
    h: number;
    f: number;
    parent: PathNode | null;
};

export const findPathAStar = (grid: number[][], start: Point, end: Point): Point[] => {
    const openSet: PathNode[] = [];
    const closedSet = new Set<string>();
    const startNode: PathNode = { x: start.x, y: start.y, g: 0, h: 0, f: 0, parent: null };
    startNode.h = Math.abs(startNode.x - end.x) + Math.abs(startNode.y - end.y);
    startNode.f = startNode.g + startNode.h;
    openSet.push(startNode);

    while (openSet.length > 0) {
        openSet.sort((a, b) => a.f - b.f);
        const currentNode = openSet.shift()!;
        const key = `${currentNode.x},${currentNode.y}`;
        if (closedSet.has(key)) continue;
        closedSet.add(key);

        if (currentNode.x === end.x && currentNode.y === end.y) {
            const path: Point[] = [];
            let temp: PathNode | null = currentNode;
            while (temp) { path.push({ x: temp.x, y: temp.y }); temp = temp.parent; }
            return path.reverse();
        }

        const neighbors = [
            { x: currentNode.x + 1, y: currentNode.y }, { x: currentNode.x - 1, y: currentNode.y },
            { x: currentNode.x, y: currentNode.y + 1 }, { x: currentNode.x, y: currentNode.y - 1 },
        ];

        for (const neighborPos of neighbors) {
            if (neighborPos.x < 0 || neighborPos.y < 0 ||
                neighborPos.x >= grid[0].length || neighborPos.y >= grid.length ||
                grid[neighborPos.y][neighborPos.x] === 1) {
                continue;
            }
            const neighborKey = `${neighborPos.x},${neighborPos.y}`;
            if (closedSet.has(neighborKey)) continue;
            const gScore = currentNode.g + 1;
            const hScore = Math.abs(neighborPos.x - end.x) + Math.abs(neighborPos.y - end.y);
            const neighborNode: PathNode = { ...neighborPos, g: gScore, h: hScore, f: gScore + hScore, parent: currentNode };
            openSet.push(neighborNode);
        }
    }
    return [];
};

export const simplifyPath = (path: Point[]): Point[] => {
    if (path.length < 3) return path;
    const simplified: Point[] = [path[0]];
    for (let i = 1; i < path.length - 1; i++) {
        const prev = simplified[simplified.length - 1];
        const curr = path[i];
        const next = path[i + 1];
        const sameX = prev.x === curr.x && curr.x === next.x;
        const sameY = prev.y === curr.y && curr.y === next.y;
        if (!sameX && !sameY) {
            simplified.push(curr);
        }
    }
    simplified.push(path[path.length - 1]);
    return simplified;
};

