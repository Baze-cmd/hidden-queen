import { Game } from '@/types/Game';
import { getRedisClient } from '@/lib/redis';

class RedisGameStore {
    private redis = getRedisClient();
    private gamePrefix = 'game:';
    private queueKey = 'queue:players';

    async get(gameId: string): Promise<Game | undefined> {
        const gameData = await this.redis.get(`${this.gamePrefix}${gameId}`);
        return gameData ? JSON.parse(gameData) : undefined;
    }

    async set(gameId: string, game: Game): Promise<void> {
        await this.redis.set(`${this.gamePrefix}${gameId}`, JSON.stringify(game));
    }

    async has(gameId: string): Promise<boolean> {
        const exists = await this.redis.exists(`${this.gamePrefix}${gameId}`);
        return exists === 1;
    }

    async delete(gameId: string): Promise<boolean> {
        const deleted = await this.redis.del(`${this.gamePrefix}${gameId}`);
        return deleted === 1;
    }

    async entries(): Promise<[string, Game][]> {
        const keys = await this.redis.keys(`${this.gamePrefix}*`);
        const games: [string, Game][] = [];

        for (const key of keys) {
            const gameId = key.replace(this.gamePrefix, '');
            const gameData = await this.redis.get(key);
            if (gameData) {
                games.push([gameId, JSON.parse(gameData)]);
            }
        }

        return games;
    }

    async addToQueue(playerId: string): Promise<void> {
        await this.redis.sadd(this.queueKey, playerId);
    }

    async removeFromQueue(playerId: string): Promise<void> {
        await this.redis.srem(this.queueKey, playerId);
    }

    async isInQueue(playerId: string): Promise<boolean> {
        const exists = await this.redis.sismember(this.queueKey, playerId);
        return exists === 1;
    }
}

const gameStore = new RedisGameStore();

export const games = {
    get: (gameId: string) => gameStore.get(gameId),
    set: (gameId: string, game: Game) => gameStore.set(gameId, game),
    has: (gameId: string) => gameStore.has(gameId),
    delete: (gameId: string) => gameStore.delete(gameId),
    entries: () => gameStore.entries(),
};

export const isInQueue = {
    add: (playerId: string) => gameStore.addToQueue(playerId),
    delete: (playerId: string) => gameStore.removeFromQueue(playerId),
    has: (playerId: string) => gameStore.isInQueue(playerId),
};
