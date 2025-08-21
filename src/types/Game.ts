import { Board } from "./Board";

export type Game = {
    id: string;
    board: Board;
    isStarted: boolean;
    isPrivate: boolean;
    whitePlayerId: string | null;
    blackPlayerId: string | null;
    whiteTimeLeft: number;
    blackTimeLeft: number;
    lastMovePlayedAtTime: number | null;
    isWhiteTurn: boolean;
    moves: string[];
};
