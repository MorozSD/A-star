import {findPathAStar, simplifyPath} from "./PathFinding.js";
import {areRectsOverlapping} from "./ValidChecker.js";

export type Point = {
    x: number;
    y: number;
};
export type Size = {
    width: number;
    height: number;
};
export type Rect = {
    position: Point;
    size: Size;
};
export type ConnectionPoint = {
    point: Point;
    angle?: number;
};


export type Edge = 'top' | 'bottom' | 'left' | 'right' | null;

export type NonNullEdge = Exclude<Edge, null>;

export const getClosestPointOnRectPerimeter = (p: Point, rect: Rect): { point: Point, edge: NonNullEdge } => {
    const rectLeft = rect.position.x - rect.size.width / 2;
    const rectRight = rect.position.x + rect.size.width / 2;
    const rectTop = rect.position.y - rect.size.height / 2;
    const rectBottom = rect.position.y + rect.size.height / 2;

    let clampedX = Math.max(rectLeft, Math.min(p.x, rectRight));
    let clampedY = Math.max(rectTop, Math.min(p.y, rectBottom));

    const distToLeft = Math.abs(clampedX - rectLeft);
    const distToRight = Math.abs(clampedX - rectRight);
    const distToTop = Math.abs(clampedY - rectTop);
    const distToBottom = Math.abs(clampedY - rectBottom);

    const minD = Math.min(distToLeft, distToRight, distToTop, distToBottom);

    let edge: NonNullEdge;
    if (minD === distToTop) {
        clampedY = rectTop;
        edge = 'top';
    } else if (minD === distToBottom) {
        clampedY = rectBottom;
        edge = 'bottom';
    } else if (minD === distToLeft) {
        clampedX = rectLeft;
        edge = 'left';
    } else {
        clampedX = rectRight;
        edge = 'right';
    }
    return { point: { x: clampedX, y: clampedY }, edge: edge };
};

export const dataConverter = (
  rect1: Rect,
  rect2: Rect,
  cPoint1: ConnectionPoint,
  cPoint2: ConnectionPoint
): Point[] => {

  const CELL_SIZE = 5;
  const PADDING = 20;
  const OBSTACLE_PADDING = 1;

  const adjustedStart = getClosestPointOnRectPerimeter(cPoint1.point, rect1).point;
  const adjustedEnd = getClosestPointOnRectPerimeter(cPoint2.point, rect2).point;

  const startPointAStarCandidate = adjustedStart;
  const endPointAStarCandidate = adjustedEnd;

  const allXCoordinates = [
    rect1.position.x - rect1.size.width / 2,
    rect1.position.x + rect1.size.width / 2,
    rect2.position.x - rect2.size.width / 2,
    rect2.position.x + rect2.size.width / 2,
    startPointAStarCandidate.x,
    endPointAStarCandidate.x,
  ];
  const allYCoordinates = [
    rect1.position.y - rect1.size.height / 2,
    rect1.position.y + rect1.size.height / 2,
    rect2.position.y - rect2.size.height / 2,
    rect2.position.y + rect2.size.height / 2,
    startPointAStarCandidate.y,
    endPointAStarCandidate.y,
  ];

  const minXWorld = Math.min(...allXCoordinates);
  const maxXWorld = Math.max(...allXCoordinates);
  const minYWorld = Math.min(...allYCoordinates);
  const maxYWorld = Math.max(...allYCoordinates);

  const gridMinX = Math.floor(minXWorld / CELL_SIZE) - PADDING;
  const gridMaxX = Math.ceil(maxXWorld / CELL_SIZE) + PADDING;
  const gridMinY = Math.floor(minYWorld / CELL_SIZE) - PADDING;
  const gridMaxY = Math.ceil(maxYWorld / CELL_SIZE) + PADDING;
  const gridWidth = gridMaxX - gridMinX;
  const gridHeight = gridMaxY - gridMinY;

  

  if (gridWidth <= 0 || gridHeight <= 0) {
    console.warn("❌ Invalid grid dimensions. Returning empty path.");
    return [];
  }
 const grid: number[][] = Array.from({ length: gridHeight }, () => Array(gridWidth).fill(0));
  

  const worldToGrid = (p: Point): Point => ({
    x: Math.round(p.x / CELL_SIZE) - gridMinX,
    y: Math.round(p.y / CELL_SIZE) - gridMinY,
  });

  const gridToWorld = (p: Point): Point => ({
    x: (p.x + gridMinX) * CELL_SIZE,
    y: (p.y + gridMinY) * CELL_SIZE,
  });

 for (const rect of [rect1, rect2]) {
  const topLeft = worldToGrid({
    x: rect.position.x - rect.size.width / 2 - OBSTACLE_PADDING * CELL_SIZE,
    y: rect.position.y - rect.size.height / 2 - OBSTACLE_PADDING * CELL_SIZE,
  });

  const bottomRight = worldToGrid({
    x: rect.position.x + rect.size.width / 2 + OBSTACLE_PADDING * CELL_SIZE,
    y: rect.position.y + rect.size.height / 2 + OBSTACLE_PADDING * CELL_SIZE,
  });

  for (let y = topLeft.y; y <= bottomRight.y; y++) {
    for (let x = topLeft.x; x <= bottomRight.x; x++) {
      if (x >= 0 && x < gridWidth && y >= 0 && y < gridHeight) {
        grid[y][x] = 1;
      }
    }
  }
}


  const findValidStartEnd = (point: Point, gridRef: number[][], gridW: number, gridH: number): Point | null => {
    const gridPoint = worldToGrid(point);

    if (gridPoint.x >= 0 && gridPoint.x < gridW && gridPoint.y >= 0 && gridPoint.y < gridH && gridRef[gridPoint.y][gridPoint.x] === 0) {
      return gridPoint;
    }

    const queue: { p: Point, dist: number }[] = [{ p: gridPoint, dist: 0 }];
    const visited = new Set<string>();
    visited.add(`${gridPoint.x},${gridPoint.y}`);

    let head = 0;
    while (head < queue.length) {
      const { p: currentP } = queue[head++];
      if (currentP.x >= 0 && currentP.x < gridW && currentP.y >= 0 && currentP.y < gridH && gridRef[currentP.y][currentP.x] === 0) {
        return currentP;
      }

      const neighbors = [
        { x: currentP.x + 1, y: currentP.y }, { x: currentP.x - 1, y: currentP.y },
        { x: currentP.x, y: currentP.y + 1 }, { x: currentP.x, y: currentP.y - 1 },
        { x: currentP.x + 1, y: currentP.y + 1 }, { x: currentP.x - 1, y: currentP.y + 1 },
        { x: currentP.x + 1, y: currentP.y - 1 }, { x: currentP.x - 1, y: currentP.y - 1 },
      ];

      for (const neighbor of neighbors) {
        const neighborKey = `${neighbor.x},${neighbor.y}`;
        if (!visited.has(neighborKey) && neighbor.x >= -PADDING && neighbor.x < gridW + PADDING && neighbor.y >= -PADDING && neighbor.y < gridH + PADDING) {
          visited.add(neighborKey);
          queue.push({ p: neighbor, dist: 1 });
        }
      }
    }
    return null;
  };

  const finalStartGrid = findValidStartEnd(startPointAStarCandidate, grid, gridWidth, gridHeight);
  const finalEndGrid = findValidStartEnd(endPointAStarCandidate, grid, gridWidth, gridHeight);

  if (!finalStartGrid) {
    console.warn("❌ Failed to find a valid start point for A*. Returning empty path.");
    return [];
  }
  if (!finalEndGrid) {
    console.warn("❌ Failed to find a valid end point for A*. Returning empty path.");
    return [];
  }

  const gridPath = findPathAStar(grid, finalStartGrid, finalEndGrid);
  console.log("Final path:");
console.table(gridPath);
console.log("Grid value at each step:");
gridPath.forEach(p => console.log(`(${p.x}, ${p.y}): ${grid[p.y]?.[p.x]}`));

  if (gridPath.length === 0) {
    console.warn("❌ A* path not found.");
    return [];
  }

  const worldPath = gridPath.map(gridToWorld);

  if (worldPath.length > 0) {
    const firstAStarPoint = worldPath[0];
    const lastAStarPoint = worldPath[worldPath.length - 1];

    let startElbow: Point;
    if (cPoint1.angle === 0 || cPoint1.angle === 180) {
      startElbow = { x: firstAStarPoint.x, y: cPoint1.point.y };
    } else {
      startElbow = { x: cPoint1.point.x, y: firstAStarPoint.y };
    }

    let endElbow: Point;
    if (cPoint2.angle === 0 || cPoint2.angle === 180) {
      endElbow = { x: lastAStarPoint.x, y: cPoint2.point.y };
    } else {
      endElbow = { x: cPoint2.point.x, y: lastAStarPoint.y };
    }

    const finalPath = [cPoint1.point, startElbow, ...worldPath, endElbow, cPoint2.point];
    return simplifyPath(finalPath);
  }

  console.warn("⚠️ worldPath is empty after A*. Returning empty array.");
  return [];
};
