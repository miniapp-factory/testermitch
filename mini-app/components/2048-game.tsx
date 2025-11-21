"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Share } from "@/components/share";
import { url } from "@/lib/metadata";

const SIZE = 4;

function createEmptyBoard(): number[][] {
  return Array.from({ length: SIZE }, () => Array(SIZE).fill(0));
}

function addRandomTile(board: number[][]): number[][] {
  const empty: [number, number][] = [];
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      if (board[r][c] === 0) empty.push([r, c]);
    }
  }
  if (empty.length === 0) return board;
  const [r, c] = empty[Math.floor(Math.random() * empty.length)];
  const value = Math.random() < 0.9 ? 2 : 4;
  const newBoard = board.map(row => [...row]);
  newBoard[r][c] = value;
  return newBoard;
}

function compress(row: number[]): number[] {
  const filtered = row.filter(v => v !== 0);
  const merged: number[] = [];
  let skip = false;
  for (let i = 0; i < filtered.length; i++) {
    if (skip) {
      skip = false;
      continue;
    }
    if (i + 1 < filtered.length && filtered[i] === filtered[i + 1]) {
      merged.push(filtered[i] * 2);
      skip = true;
    } else {
      merged.push(filtered[i]);
    }
  }
  while (merged.length < SIZE) merged.push(0);
  return merged;
}

function move(board: number[][], dir: "up" | "down" | "left" | "right"): { board: number[][]; scoreDelta: number } {
  let newBoard = board.map(row => [...row]);
  let scoreDelta = 0;

  const rotate = (b: number[][], times: number): number[][] => {
    let res = b;
    for (let t = 0; t < times; t++) {
      const tmp = createEmptyBoard();
      for (let r = 0; r < SIZE; r++) {
        for (let c = 0; c < SIZE; c++) {
          tmp[c][SIZE - 1 - r] = res[r][c];
        }
      }
      res = tmp;
    }
    return res;
  };

  // Normalize to left move
  if (dir === "up") newBoard = rotate(newBoard, 1);
  else if (dir === "right") newBoard = rotate(newBoard, 2);
  else if (dir === "down") newBoard = rotate(newBoard, 3);

  for (let r = 0; r < SIZE; r++) {
    const original = newBoard[r];
    const compressed = compress(original);
    scoreDelta += compressed.reduce((a, b, i) => a + (b - original[i]), 0);
    newBoard[r] = compressed;
  }

  // Rotate back
  if (dir === "up") newBoard = rotate(newBoard, 3);
  else if (dir === "right") newBoard = rotate(newBoard, 2);
  else if (dir === "down") newBoard = rotate(newBoard, 1);

  return { board: newBoard, scoreDelta };
}

function canMove(board: number[][]): boolean {
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      if (board[r][c] === 0) return true;
      if (c + 1 < SIZE && board[r][c] === board[r][c + 1]) return true;
      if (r + 1 < SIZE && board[r][c] === board[r + 1][c]) return true;
    }
  }
  return false;
}

export default function Game2048() {
  const [board, setBoard] = useState<number[][]>(createEmptyBoard());
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);

  useEffect(() => {
    let b = createEmptyBoard();
    b = addRandomTile(b);
    b = addRandomTile(b);
    setBoard(b);
  }, []);

  const handleMove = (dir: "up" | "down" | "left" | "right") => {
    if (gameOver) return;
    const { board: newBoard, scoreDelta } = move(board, dir);
    if (JSON.stringify(newBoard) === JSON.stringify(board)) return;
    setBoard(newBoard);
    setScore(prev => prev + scoreDelta);
    const after = addRandomTile(newBoard);
    setBoard(after);
    if (!canMove(after)) setGameOver(true);
  };

  const shareText = `I scored ${score} in 2048! ${url}`;

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="grid grid-cols-4 gap-2">
        {board.flat().map((v, i) => (
          <div
            key={i}
            className={`w-16 h-16 flex items-center justify-center rounded-md text-xl font-bold ${
              v
                ? `bg-${v === 2048 ? "green-500" : "blue-200"}`
                : "bg-gray-200"
            }`}
          >
            {v || ""}
          </div>
        ))}
      </div>
      <div className="flex flex-col items-center gap-2">
        <div className="text-lg">Score: {score}</div>
        <div className="grid grid-cols-3 gap-2">
          <Button variant="outline" onClick={() => handleMove("up")}>
            ↑
          </Button>
          <Button variant="outline" onClick={() => handleMove("left")}>
            ←
          </Button>
          <Button variant="outline" onClick={() => handleMove("right")}>
            →
          </Button>
          <Button variant="outline" onClick={() => handleMove("down")}>
            ↓
          </Button>
        </div>
        {gameOver && (
          <Share text={shareText} className="mt-4" />
        )}
      </div>
    </div>
  );
}
