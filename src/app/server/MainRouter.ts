import { t } from './trpc';
import { Player } from '@/types/Player';
import { z } from 'zod';
import { uniqueNamesGenerator, adjectives, colors, animals } from 'unique-names-generator';
import { gamesRouter } from '@/app/server/routers/game';
import { allPlayers } from './playerStore';
import { initializeRedis } from '@/lib/redis';

initializeRedis().catch(console.error);

export const appRouter = t.router({
    validatePlayer: t.procedure.input(z.string()).mutation(async (req): Promise<boolean> => {
        return await allPlayers.has(req.input);
    }),

    createPlayer: t.procedure.mutation(async (): Promise<string> => {
        let id: string;
        do {
            id = crypto.randomUUID();
        } while (await allPlayers.has(id));

        const name = uniqueNamesGenerator({
            dictionaries: [adjectives, colors, animals],
            separator: ' ',
            length: 3,
        });

        const player: Player = {
            id: id,
            name: name,
            rating: 0,
        };

        await allPlayers.set(player.id, player);
        return player.id;
    }),

    getPlayerById: t.procedure.input(z.string()).query(async (req): Promise<Player> => {
        const player = await allPlayers.get(req.input);
        if (!player) {
            throw new Error(`No player found with id ${req.input}`);
        }
        return player;
    }),

    games: gamesRouter,
});

export type AppRouter = typeof appRouter;
