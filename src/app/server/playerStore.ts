import { Player } from '@/types/Player';
import { getRedisClient } from '@/lib/redis';

class RedisPlayerStore {
    private redis = getRedisClient();
    private playerPrefix = 'player:';

    async get(playerId: string): Promise<Player | undefined> {
        const playerData = await this.redis.get(`${this.playerPrefix}${playerId}`);
        return playerData ? JSON.parse(playerData) : undefined;
    }

    async set(playerId: string, player: Player): Promise<void> {
        await this.redis.set(`${this.playerPrefix}${playerId}`, JSON.stringify(player));
    }

    async has(playerId: string): Promise<boolean> {
        const exists = await this.redis.exists(`${this.playerPrefix}${playerId}`);
        return exists === 1;
    }

    async delete(playerId: string): Promise<boolean> {
        const deleted = await this.redis.del(`${this.playerPrefix}${playerId}`);
        return deleted === 1;
    }

    async entries(): Promise<[string, Player][]> {
        const keys = await this.redis.keys(`${this.playerPrefix}*`);
        const players: [string, Player][] = [];

        for (const key of keys) {
            const playerId = key.replace(this.playerPrefix, '');
            const playerData = await this.redis.get(key);
            if (playerData) {
                players.push([playerId, JSON.parse(playerData)]);
            }
        }

        return players;
    }
}

const playerStore = new RedisPlayerStore();

export const allPlayers = {
    get: (playerId: string) => playerStore.get(playerId),
    set: (playerId: string, player: Player) => playerStore.set(playerId, player),
    has: (playerId: string) => playerStore.has(playerId),
    delete: (playerId: string) => playerStore.delete(playerId),
    entries: () => playerStore.entries(),
};
