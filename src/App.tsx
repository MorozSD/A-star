import React, { useRef, useState, useEffect } from 'react';
import { Button, Slider, Stack, Typography, Box } from '@mui/material';
import { getConnectionSide, getAngle, areRectsOverlapping } from './utils/ValidChecker.js'; // укажи путь к функции
import {dataConverter} from "./utils/dataConverter.js"
import {Point, Rect, ConnectionPoint, getClosestPointOnRectPerimeter } from "./utils/dataConverter.js"


const GRID_SIZE = 50;
const MAX_RECTS = 2;
const MAX_POINTS = 2;
const POINT_RADIUS = 6;


export type Side = 'left' | 'right' | 'top' | 'bottom';


export default function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [rects, setRects] = useState<Rect[]>([]);
  const [points, setPoints] = useState<ConnectionPoint[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [mode, setMode] = useState<'none' | 'add-rect' | 'delete-rect' | 'add-point' | 'delete-point' | 'move-rect' | 'move-point'>('none');
  const [selectedRectIndex, setSelectedRectIndex] = useState<number | null>(null);
  const [draggingIndex, setDraggingIndex] = useState<{ type: 'rect' | 'point'; index: number } | null>(null);
  const [mouseDown, setMouseDown] = useState(false);
  const [pointStatuses, setPointStatuses] = useState<(Side | false)[]>([]);
  const [path, setPath] = useState<Point[]>([]);

 useEffect(() => {
  const canvas = canvasRef.current;
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawGrid(ctx);

  rects.forEach((rect) => {
    ctx.fillStyle = 'skyblue';
    ctx.fillRect(
      rect.position.x - rect.size.width / 2,
      rect.position.y - rect.size.height / 2,
      rect.size.width,
      rect.size.height
    );
  });

  points.forEach((p, i) => {
    ctx.beginPath();
    ctx.fillStyle = 'red';
    ctx.arc(p.point.x, p.point.y, POINT_RADIUS, 0, Math.PI * 2);
    ctx.fill();

    const status = pointStatuses[i];
    if (status === false) {
      ctx.fillStyle = 'red';
      ctx.fillRect(p.point.x + 8, p.point.y + 8, 6, 6);
    } else if (status) {
      ctx.fillStyle = 'green';
      ctx.beginPath();
      ctx.arc(p.point.x + 10, p.point.y + 10, 4, 0, Math.PI * 2);
      ctx.fill();
    }
  });

  if (path.length > 0) {
    ctx.beginPath();
    ctx.strokeStyle = 'orange';
    ctx.lineWidth = 3;
    ctx.moveTo(path[0].x, path[0].y);
    for (let i = 1; i < path.length; i++) {
      ctx.lineTo(path[i].x, path[i].y);
    }
    ctx.stroke();
  }
}, [rects, points, pointStatuses, path]);


  const drawGrid = (ctx: CanvasRenderingContext2D) => {
    const { width, height } = ctx.canvas;
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 1;
    ctx.font = '12px sans-serif';
    ctx.fillStyle = '#000';

    for (let x = 0; x <= width; x += GRID_SIZE) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
      if (x % 100 === 0) ctx.fillText(`${x}`, x + 2, 14);
    }

    for (let y = 0; y <= height; y += GRID_SIZE) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
      if (y % 100 === 0) ctx.fillText(`${y}`, 2, y - 2);
    }
  };

  /*const updatePointStatuses = (newPoints: ConnectionPoint[]) => {
    const statuses = newPoints.map((pt) => {
      const side = rects.map((r) => getConnectionSide(r, pt)).find((s) => s !== null);
      return side || false;
    });
    setPointStatuses(statuses);
  };*/
  const updatePointStatuses = (newPoints: ConnectionPoint[], currentRects = rects) => {
  const statuses = newPoints.map((pt) => {
    const side = currentRects.map((r) => getConnectionSide(r, pt)).find((s) => s !== null);
    return side || false;
  });
  setPointStatuses(statuses);
};


  const handleDrawRoute = () => {
  if (rects.length !== 2 || points.length !== 2) {
    alert('Недостаточно элементов для построения маршрута. Нужно 2 прямоугольника и 2 точки.');
    return;
  }
  if (pointStatuses.some((status) => status === false)) {
    alert('Точки должны быть на границе прямоугольника.');
    return;
  }

  if (areRectsOverlapping(rects[0], rects[1])) {
    alert('Прямоугольники пересекаются!');
    return;
  }

  console.log("RECTS", rects);

  const updatedPoints = points.map((cp) => {
    const side = rects.map((r) => getConnectionSide(r, cp)).find((s) => s !== null);
    const angle = side ? getAngle(side) : undefined;
    return { ...cp, angle };
  });


  const newPath = dataConverter(rects[0], rects[1], updatedPoints[0], updatedPoints[1]);
  setPath(newPath);
};

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isEditing || mouseDown || mode === 'move-rect' || mode === 'move-point') return;
    const rect = canvasRef.current!.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (mode === 'add-rect') {
      const newRect: Rect = {
        position: { x, y },
        size: { width: 50, height: 50 },
      };
      const updated = [...rects.slice(-1), newRect].slice(-MAX_RECTS);
      setRects(updated);
      setSelectedRectIndex(updated.length - 1);
      updatePointStatuses(points, updated);
    }

    if (mode === 'delete-rect') {
      const updated = rects.filter((r) => !pointInRect({ x, y }, r));
      setRects(updated);
      updatePointStatuses(points, updated);
    }

    if (mode === 'add-point') {
      const newPoint: ConnectionPoint = { point: { x, y } };
      const updatedPoints = [...points.slice(-1), newPoint].slice(-MAX_POINTS);
      setPoints(updatedPoints);
      updatePointStatuses(updatedPoints);
    }

    if (mode === 'delete-point') {
      const updated = points.filter((p) => distance(p.point, { x, y }) > 10);
      setPoints(updated);
    }
  };

  const pointInRect = (point: Point, rect: Rect) => {
    const left = rect.position.x - rect.size.width / 2;
    const right = rect.position.x + rect.size.width / 2;
    const top = rect.position.y - rect.size.height / 2;
    const bottom = rect.position.y + rect.size.height / 2;
    return point.x >= left && point.x <= right && point.y >= top && point.y <= bottom;
  };

  const distance = (p1: Point, p2: Point) => {
    return Math.sqrt((p1.x - p2.x) ** 2 + (p1.y - p2.y) ** 2);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!isEditing || (mode !== 'move-rect' && mode !== 'move-point')) return;
    setMouseDown(true);
    const rect = canvasRef.current!.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (mode === 'move-rect') {
      rects.forEach((r, i) => {
        if (pointInRect({ x, y }, r)) {
          setDraggingIndex({ type: 'rect', index: i });
        }
      });
    }

    if (mode === 'move-point') {
      points.forEach((p, i) => {
        if (distance({ x, y }, p.point) < 10) {
          setDraggingIndex({ type: 'point', index: i });
        }
      });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isEditing || !draggingIndex) return;
    const rect = canvasRef.current!.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (draggingIndex.type === 'rect') {
      const updatedRects = [...rects];
      updatedRects[draggingIndex.index] = { ...updatedRects[draggingIndex.index], position: { x, y } };
      setRects(updatedRects);
      updatePointStatuses(points, updatedRects);
    }

    if (draggingIndex.type === 'point') {
      const updatedPoints = [...points];
      updatedPoints[draggingIndex.index] = { point: { x, y } };
      setPoints(updatedPoints);
      updatePointStatuses(updatedPoints);
    }
  };

  const handleMouseUp = () => {
    setDraggingIndex(null);
    setMouseDown(false);
  };

  return (
    <Box display="flex" gap={4}>

      <Box>
        <canvas
          ref={canvasRef}
          width={800}
          height={600}
          style={{ border: '1px solid black', marginTop: 20 }}
          onClick={handleCanvasClick}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
        />
      </Box>

      <Stack spacing={2}>
        <Button
          variant={isEditing ? 'contained' : 'outlined'}
          onClick={() => {
            if (isEditing) {
              setIsEditing(false);
              setMode('none');
            } else {
              setIsEditing(true);
              setPath([]);
            }
          }}
        >
          {isEditing ? 'Завершить редактирование' : 'Редактировать'}
        </Button>

        {!isEditing && (
          <Button variant="contained" color="success" onClick={handleDrawRoute}>
            Отрисовать маршрут
          </Button>
        )}

        {isEditing && (
          <>
            <Button variant={mode === 'add-rect' ? 'contained' : 'outlined'} onClick={() => setMode('add-rect')}>
              Добавить прямоугольник
            </Button>
            <Button variant={mode === 'delete-rect' ? 'contained' : 'outlined'} onClick={() => setMode('delete-rect')}>
              Удалить прямоугольник
            </Button>
            <Button variant={mode === 'add-point' ? 'contained' : 'outlined'} onClick={() => setMode('add-point')}>
              Добавить точку соединения
            </Button>
            <Button variant={mode === 'delete-point' ? 'contained' : 'outlined'} onClick={() => setMode('delete-point')}>
              Удалить точку соединения
            </Button>
            <Button variant={mode === 'move-rect' ? 'contained' : 'outlined'} onClick={() => setMode('move-rect')}>
              Переместить прямоугольники
            </Button>
            <Button variant={mode === 'move-point' ? 'contained' : 'outlined'} onClick={() => setMode('move-point')}>
              Переместить точки
            </Button>
          </>
        )}

        {isEditing && selectedRectIndex !== null && rects[selectedRectIndex] && mode === 'add-rect' && (
          <Stack spacing={2} width={300} marginTop={2}>
            <Typography gutterBottom>Ширина: {rects[selectedRectIndex].size.width}px</Typography>
            <Slider
              min={10}
              max={200}
              value={rects[selectedRectIndex].size.width}
              onChange={(_, width) => {
                if (typeof width === 'number') {
                  setRects((prev) => {
                    const copy = [...prev];
                    copy[selectedRectIndex] = {
                      ...copy[selectedRectIndex],
                      size: { ...copy[selectedRectIndex].size, width },
                    };
                    updatePointStatuses(points, copy);
                    return copy;
                  });
                }
              }}
            />
            <Typography gutterBottom>Высота: {rects[selectedRectIndex].size.height}px</Typography>
            <Slider
              min={10}
              max={200}
              value={rects[selectedRectIndex].size.height}
              onChange={(_, height) => {
                if (typeof height === 'number') {
                  setRects((prev) => {
                    const copy = [...prev];
                    copy[selectedRectIndex] = {
                      ...copy[selectedRectIndex],
                      size: { ...copy[selectedRectIndex].size, height },
                    };
                    return copy;
                  });
                }
              }}
            />
          </Stack>
        )}
      </Stack>
    </Box>
  );
}