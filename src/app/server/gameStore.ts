import { Game } from '@/types/Game';
import { Player } from '@/types/Player';

declare global {
    var __games: Map<string, Game> | undefined;
    var __isInQueue: Set<string> | undefined;
}

export const games: Map<string, Game> = globalThis.__games ?? new Map<string, Game>();
export const isInQueue: Set<string> = globalThis.__isInQueue ?? new Set<string>();

if (process.env.NODE_ENV !== 'production') {
    globalThis.__games = games;
    globalThis.__isInQueue = isInQueue;
}
