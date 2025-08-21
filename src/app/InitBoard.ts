import { Board } from "@/types/Board";

export function InitBoard(): Board {
    return {
        tiles: [
            "bR", "bN", "bB", "bQ", "bK", "bB", "bN", "bR",
            "bP", "bP", "bP", "bP", "bP", "bP", "bP", "bP",
            "  ", "  ", "  ", "  ", "  ", "  ", "  ", "  ",
            "  ", "  ", "  ", "  ", "  ", "  ", "  ", "  ",
            "  ", "  ", "  ", "  ", "  ", "  ", "  ", "  ",
            "  ", "  ", "  ", "  ", "  ", "  ", "  ", "  ",
            "wP", "wP", "wP", "wP", "wP", "wP", "wP", "wP",
            "wR", "wN", "wB", "wQ", "wK", "wB", "wN", "wR"
        ],
        width: 8,
        height: 8,
    };
}
