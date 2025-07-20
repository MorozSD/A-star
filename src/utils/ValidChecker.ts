import type {ConnectionPoint, Rect} from "./dataConverter";

export const areRectsOverlapping = (rect1: Rect, rect2: Rect): boolean => {
    const r1Left = rect1.position.x - rect1.size.width / 2;
    const r1Right = rect1.position.x + rect1.size.width / 2;
    const r1Top = rect1.position.y - rect1.size.height / 2;
    const r1Bottom = rect1.position.y + rect1.size.height / 2;

    const r2Left = rect2.position.x - rect2.size.width / 2;
    const r2Right = rect2.position.x + rect2.size.width / 2;
    const r2Top = rect2.position.y - rect2.size.height / 2;
    const r2Bottom = rect2.position.y + rect2.size.height / 2;

    if (r1Right < r2Left || r1Left > r2Right || r1Bottom < r2Top || r1Top > r2Bottom) {
        return false;
    }

    return true;
};

export type Side = 'left' | 'right' | 'top' | 'bottom';

export const getConnectionSide = (rect: Rect, conn: ConnectionPoint): Side | null => {
  const { x, y } = conn.point;
  const { position, size } = rect;

  const left = position.x - size.width / 2;
  const right = position.x + size.width / 2;
  const top = position.y - size.height / 2;
  const bottom = position.y + size.height / 2;

  const tolerance = 6;

  if (Math.abs(x - right) < tolerance && y >= top && y <= bottom) {
    return 'right';
  }

  if (Math.abs(x - left) < tolerance && y >= top && y <= bottom) {
    return 'left';
  }

  if (Math.abs(y - top) < tolerance && x >= left && x <= right) {
    return 'top';
  }

  if (Math.abs(y - bottom) < tolerance && x >= left && x <= right) {
    return 'bottom';
  }

  return null;
};


export const getAngle = (edge: Side): number => {
    switch (edge) {
        case 'top': return 90;
        case 'bottom': return 270;
        case 'right': return 0;
        case 'left': return 180;
        default: return 0;
    }
};
