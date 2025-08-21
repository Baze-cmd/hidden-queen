import { Player } from '@/types/Player';

declare global {
    var __allPlayers: Map<string, Player> | undefined;
}

export const allPlayers: Map<string, Player> = globalThis.__allPlayers ?? new Map<string, Player>();

if (process.env.NODE_ENV !== 'production') {
    globalThis.__allPlayers = allPlayers;
}
