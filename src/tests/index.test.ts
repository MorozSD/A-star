import { describe, it, expect } from 'vitest';
import type { Rect} from '../utils/dataConverter';
import { dataConverter} from '../utils/dataConverter';
import {areRectsOverlapping, getAngle, getConnectionSide } from "../utils/ValidChecker";

const testRect: Rect = { position: { x: 100, y: 100 }, size: { width: 100, height: 50 } };


const rect = {
  position: { x: 100, y: 100 },
  size: { width: 40, height: 20 },
};

describe('getConnectionSide', () => {
  it('должен вернуть "right", если точка на правой грани', () => {
    const conn = { point: { x: 120, y: 100 } }; // right edge ± tolerance
    expect(getConnectionSide(rect, conn)).toBe('right');
  });

  it('должен вернуть "left", если точка на левой грани', () => {
    const conn = { point: { x: 80, y: 110 } }; // left edge ± tolerance
    expect(getConnectionSide(rect, conn)).toBe('left');
  });

  it('должен вернуть "top", если точка на верхней грани', () => {
    const conn = { point: { x: 100, y: 90 } };
    expect(getConnectionSide(rect, conn)).toBe('top');
  });

  it('должен вернуть "bottom", если точка на нижней грани', () => {
    const conn = { point: { x: 95, y: 110 } };
    expect(getConnectionSide(rect, conn)).toBe('bottom');
  });

  it('должен вернуть null, если точка далеко от граней', () => {
    const conn = { point: { x: 50, y: 50 } };
    expect(getConnectionSide(rect, conn)).toBe(null);
  });

  it('должен вернуть null, если точка близка к краю по X, но вне по Y', () => {
    const conn = { point: { x: 120, y: 130 } }; // по X right edge, но Y ниже нижней грани
    expect(getConnectionSide(rect, conn)).toBe(null);
  });
});

describe('areRectsOverlapping', () => {
  const rect1 = { position: { x: 100, y: 100 }, size: { width: 50, height: 50 } };

  it('должен вернуть true для пересекающихся прямоугольников', () => {
    const rect2 = { position: { x: 110, y: 110 }, size: { width: 50, height: 50 } };
    expect(areRectsOverlapping(rect1, rect2)).toBe(true);
  });

  it('должен вернуть true для касающихся прямоугольников (по краю)', () => {
    const rect2 = { position: { x: 125, y: 100 }, size: { width: 50, height: 50 } };
    expect(areRectsOverlapping(rect1, rect2)).toBe(true);
  });

  it('должен вернуть false для непересекающихся прямоугольников', () => {
    const rect2 = { position: { x: 200, y: 200 }, size: { width: 50, height: 50 } };
    expect(areRectsOverlapping(rect1, rect2)).toBe(false);
  });
});

describe('getAngle', () => {
  it('должен возвращать 90 для "top"', () => {
    expect(getAngle('top')).toBe(90);
  });

  it('должен возвращать 270 для "bottom"', () => {
    expect(getAngle('bottom')).toBe(270);
  });

  it('должен возвращать 0 для "right"', () => {
    expect(getAngle('right')).toBe(0);
  });

  it('должен возвращать 180 для "left"', () => {
    expect(getAngle('left')).toBe(180);
  });

  it('должен возвращать 0 для неизвестной стороны', () => {
    // @ts-expect-error тест fallback
    expect(getAngle('unknown')).toBe(0);
  });
});

describe('dataConverter', () => {
  const rect1 = { position: { x: 100, y: 100 }, size: { width: 50, height: 50 } };
  const rect2 = { position: { x: 200, y: 200 }, size: { width: 50, height: 50 } };

  const cPoint1 = { point: { x: 125, y: 100 }, angle: 0 };
  const cPoint2 = { point: { x: 175, y: 200 }, angle: 180 };

  it('должен вернуть массив точек (путь)', () => {
    const path = dataConverter(rect1, rect2, cPoint1, cPoint2);
    expect(Array.isArray(path)).toBe(true);
    expect(path.length).toBeGreaterThanOrEqual(2);
    expect(path[0]).toEqual(cPoint1.point);
    expect(path[path.length - 1]).toEqual(cPoint2.point);
  });

  it('должен вернуть прямую линию, если прямоугольники пересекаются', () => {
    const overlappingRect1 = { position: { x: 100, y: 100 }, size: { width: 100, height: 100 } };
    const overlappingRect2 = { position: { x: 120, y: 120 }, size: { width: 100, height: 100 } };
    const path = dataConverter(overlappingRect1, overlappingRect2, cPoint1, cPoint2);
    expect(path).toEqual([cPoint1.point, cPoint2.point]);
  });

  });
