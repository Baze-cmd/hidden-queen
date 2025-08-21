import { Board } from '@/types/Board'
import { InitBoard } from './InitBoard';

export const boardStates: Board[] = [
    InitBoard(),
    {
      tiles: [
        "bR", "bN", "bB", "bQ", "bK", "bB", "bN", "bR",
        "bP", "bP", "bP", "bP", "bP", "bP", "bP", "bP",
        "  ", "  ", "  ", "  ", "  ", "  ", "  ", "  ",
        "  ", "  ", "  ", "  ", "  ", "  ", "  ", "  ",
        "  ", "  ", "  ", "  ", "  ", "  ", "  ", "  ",
        "  ", "  ", "  ", "  ", "  ", "  ", "  ", "  ",
        "wP", "wP", "wP", "wP", "wH", "wP", "wP", "wP",
        "wR", "wN", "wB", "wQ", "wK", "wB", "wN", "wR"
      ],
      width: 8,
      height: 8,
    },
    {
      tiles: [
        "bR", "bN", "bB", "bQ", "bK", "bB", "bN", "bR",
        "bP", "bP", "bP", "bP", "bP", "bP", "bP", "bP",
        "  ", "  ", "  ", "  ", "  ", "  ", "  ", "  ",
        "  ", "  ", "  ", "  ", "  ", "  ", "  ", "  ",
        "  ", "  ", "  ", "ci", "  ", "  ", "  ", "  ",
        "  ", "  ", "  ", "ci", "  ", "  ", "  ", "  ",
        "wP", "wP", "wP", "wP", "wH", "wP", "wP", "wP",
        "wR", "wN", "wB", "wQ", "wK", "wB", "wN", "wR"
      ],
      width: 8,
      height: 8,
    },
    {
      tiles: [
        "bR", "bN", "bB", "bQ", "bK", "bB", "bN", "bR",
        "bP", "bP", "bP", "bP", "bP", "bP", "bP", "bP",
        "  ", "  ", "  ", "  ", "  ", "  ", "  ", "  ",
        "  ", "  ", "  ", "  ", "  ", "  ", "  ", "  ",
        "  ", "  ", "  ", "wP", "  ", "  ", "  ", "  ",
        "  ", "  ", "  ", "  ", "  ", "  ", "  ", "  ",
        "wP", "wP", "wP", "  ", "wH", "wP", "wP", "wP",
        "wR", "wN", "wB", "wQ", "wK", "wB", "wN", "wR"
      ],
      width: 8,
      height: 8,
    },
    {
      tiles: [
        "bR", "bN", "bB", "bQ", "bK", "bB", "bN", "bR",
        "bP", "bP", "bP", "bP", "  ", "bP", "bP", "bP",
        "  ", "  ", "  ", "  ", "  ", "  ", "  ", "  ",
        "  ", "  ", "  ", "  ", "bP", "  ", "  ", "  ",
        "  ", "  ", "  ", "wP", "  ", "  ", "  ", "  ",
        "  ", "  ", "  ", "  ", "  ", "  ", "  ", "  ",
        "wP", "wP", "wP", "  ", "wH", "wP", "wP", "wP",
        "wR", "wN", "wB", "wQ", "wK", "wB", "wN", "wR"
      ],
      width: 8,
      height: 8,
    },
    {
      tiles: [
        "bR", "bN", "bB", "bQ", "bK", "bB", "bN", "bR",
        "bP", "bP", "bP", "bP", "  ", "bP", "bP", "bP",
        "  ", "  ", "  ", "  ", "  ", "  ", "  ", "  ",
        "  ", "  ", "  ", "  ", "bP", "  ", "  ", "  ",
        "  ", "  ", "  ", "wP", "  ", "  ", "  ", "  ",
        "  ", "  ", "  ", "  ", "  ", "ci", "  ", "ci",
        "wP", "wP", "wP", "  ", "wH", "wP", "wP", "wP",
        "wR", "wN", "wB", "wQ", "wK", "wB", "wN", "wR"
      ],
      width: 8,
      height: 8,
    },
    {
      tiles: [
        "bR", "bN", "bB", "bQ", "bK", "bB", "bN", "bR",
        "bP", "bP", "bP", "bP", "  ", "bP", "bP", "bP",
        "  ", "  ", "  ", "  ", "  ", "  ", "  ", "  ",
        "  ", "  ", "  ", "  ", "bP", "  ", "  ", "  ",
        "  ", "  ", "  ", "wP", "  ", "  ", "  ", "  ",
        "  ", "  ", "  ", "  ", "  ", "wN", "  ", "  ",
        "wP", "wP", "wP", "  ", "wH", "wP", "wP", "wP",
        "wR", "wN", "wB", "wQ", "wK", "wB", "  ", "wR"
      ],
      width: 8,
      height: 8,
    },
    {
      tiles: [
        "bR", "bN", "bB", "bQ", "bK", "bB", "bN", "bR",
        "bP", "bP", "bP", "bP", "  ", "bP", "bP", "bP",
        "  ", "  ", "  ", "  ", "  ", "  ", "  ", "  ",
        "  ", "  ", "  ", "  ", "  ", "  ", "  ", "  ",
        "  ", "  ", "  ", "bP", "  ", "  ", "  ", "  ",
        "  ", "  ", "  ", "  ", "  ", "wN", "  ", "  ",
        "wP", "wP", "wP", "  ", "wH", "wP", "wP", "wP",
        "wR", "wN", "wB", "wQ", "wK", "wB", "  ", "wR"
      ],
      width: 8,
      height: 8,
    },
    {
      tiles: [
        "bR", "bN", "bB", "bQ", "bK", "bB", "bN", "bR",
        "bP", "bP", "bP", "bP", "ci", "bP", "bP", "bP",
        "ci", "  ", "  ", "  ", "ci", "  ", "  ", "  ",
        "  ", "ci", "  ", "  ", "ci", "  ", "  ", "  ",
        "  ", "  ", "ci", "bP", "ci", "  ", "  ", "  ",
        "  ", "  ", "  ", "ci", "ci", "wN", "  ", "  ",
        "wP", "wP", "wP", "  ", "wH", "wP", "wP", "wP",
        "wR", "wN", "wB", "wQ", "wK", "wB", "  ", "wR"
      ],
      width: 8,
      height: 8,
    },
    {
      tiles: [
        "bR", "bN", "bB", "bQ", "wQ", "bB", "bN", "bR",
        "bP", "bP", "bP", "bP", "  ", "bP", "bP", "bP",
        "  ", "  ", "  ", "  ", "  ", "  ", "  ", "  ",
        "  ", "  ", "  ", "  ", "  ", "  ", "  ", "  ",
        "  ", "  ", "  ", "bP", "  ", "  ", "  ", "  ",
        "  ", "  ", "  ", "  ", "  ", "wN", "  ", "  ",
        "wP", "wP", "wP", "  ", "  ", "wP", "wP", "wP",
        "wR", "wN", "wB", "wQ", "wK", "wB", "  ", "wR"
      ],
      width: 8,
      height: 8,
    },
  ];
  