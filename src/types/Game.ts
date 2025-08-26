import { Board } from "./Board";
import { Move } from "./Move"

export type Game = {
    id: string;
    board: Board;
    isStarted: boolean;
    isEnded: boolean;
    winnerId: string | null;
    isPrivate: boolean;
    whitePlayerId: string | null;
    blackPlayerId: string | null;
    whiteTimeLeft: number;
    blackTimeLeft: number;
    lastMovePlayedAtTime: number | null;
    isWhiteTurn: boolean;
    whiteHiddenRevealed: boolean,
    blackHiddenRevealed: boolean,
    moves: Move[];
};
