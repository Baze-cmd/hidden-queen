import { t } from '@/app/server/trpc';
import { Game } from '@/types/Game';
import { InitBoard } from '@/app/InitBoard';
import { z } from 'zod';
import { Board } from '@/types/Board';
import { games, isInQueue } from '../gameStore';
import { allPlayers } from '../playerStore';

const gameTime: number = 300; // 5 minutes
const gameTimeIncrement: number = 50; // 5 seconds

function createGame(isPrivate: boolean, playerId: string): string | null {
    if (isInQueue.has(playerId)) {
        return null;
    }

    let id: string;
    do {
        id = crypto.randomUUID();
    } while (games.has(id));

    const coinFlip = Math.random() < 0.5;
    const whitePlayerId = coinFlip ? playerId : null;
    const blackPlayerId = coinFlip ? null : playerId;

    const game: Game = {
        id: id,
        board: InitBoard(),
        isStarted: false,
        isPrivate: isPrivate,
        whitePlayerId: whitePlayerId,
        blackPlayerId: blackPlayerId,
        whiteTimeLeft: gameTime,
        blackTimeLeft: gameTime,
        lastMovePlayedAtTime: null,
        isWhiteTurn: true,
        moves: [],
    };

    games.set(id, game);
    isInQueue.add(playerId);
    return id;
}

export const gamesRouter = t.router({
    createPrivateGame: t.procedure.input(z.string()).mutation((req): string | null => {
        return createGame(true, req.input);
    }),

    createPublicGame: t.procedure.input(z.string()).mutation((req): string | null => {
        return createGame(false, req.input);
    }),

    joinGame: t.procedure
        .input(z.object({ playerId: z.string(), gameId: z.string() }))
        .mutation((req): boolean => {
            const game = games.get(req.input.gameId);
            if (!game) {
                return false;
            }

            const player = allPlayers.get(req.input.playerId);
            if (!player) {
                return false;
            }

            if (!game.whitePlayerId) {
                game.whitePlayerId = req.input.playerId;
            } else if (!game.blackPlayerId) {
                game.blackPlayerId = req.input.playerId;
            } else {
                return false;
            }

            if (game.whitePlayerId) {
                isInQueue.delete(game.whitePlayerId);
            }
            if (game.blackPlayerId) {
                isInQueue.delete(game.blackPlayerId);
            }
            return true;
        }),

    leaveGame: t.procedure.input(z.string()).mutation((req): boolean => {
        for (const [gameId, game] of games.entries()) {
            if (game.whitePlayerId == req.input || game.blackPlayerId == req.input) {
                games.delete(gameId);
                break;
            }
        }
        isInQueue.delete(req.input);
        return true;
    }),

    isInQueue: t.procedure.input(z.string()).query((req): boolean => {
        return isInQueue.has(req.input);
    }),

    getPlayersByPublicGameId: t.procedure.query(() => {
        const playersByPublicGameId: Map<string, { name: string; rating: number }> = new Map();

        for (const [gameId, game] of games.entries()) {
            if (game.isPrivate) continue;

            let numOfPlayers = 0;
            if (game.blackPlayerId) numOfPlayers += 1;
            if (game.whitePlayerId) numOfPlayers += 1;
            if (numOfPlayers === 0 || numOfPlayers === 2) continue;

            let singlePlayerId: string | null = null;
            if (game.blackPlayerId && !game.whitePlayerId) {
                singlePlayerId = game.blackPlayerId;
            } else if (!game.blackPlayerId && game.whitePlayerId) {
                singlePlayerId = game.whitePlayerId;
            }

            if (singlePlayerId) {
                const player = allPlayers.get(singlePlayerId);
                if (player) {
                    playersByPublicGameId.set(gameId, { name: player.name, rating: player.rating });
                }
            }
        }

        return Array.from(playersByPublicGameId.entries());
    }),

    getGameBoardStateForGameWithId: t.procedure.input(z.string()).query((req): Board => {
        const game = games.get(req.input);
        if (!game) {
            throw new Error(`No game found with id ${req.input}`);
        }
        const board = game.board;
        return board;
    }),

    getGameInfo: t.procedure.input(z.string()).query(
        (
            req
        ): {
            whitePlayer: { name: string; rating: number } | null;
            blackPlayer: { name: string; rating: number } | null;
            isStarted: boolean;
            whiteTimeLeft: number;
            blackTimeLeft: number;
            isWhiteTurn: boolean;
        } => {
            const game = games.get(req.input);
            if (!game) {
                throw new Error(`No game found with id ${req.input}`);
            }

            const whitePlayer = game.whitePlayerId ? allPlayers.get(game.whitePlayerId) : null;
            const blackPlayer = game.blackPlayerId ? allPlayers.get(game.blackPlayerId) : null;

            return {
                whitePlayer: whitePlayer
                    ? {
                          name: whitePlayer.name,
                          rating: whitePlayer.rating,
                      }
                    : null,
                blackPlayer: blackPlayer
                    ? {
                          name: blackPlayer.name,
                          rating: blackPlayer.rating,
                      }
                    : null,
                isStarted: game.isStarted,
                whiteTimeLeft: game.whiteTimeLeft,
                blackTimeLeft: game.blackTimeLeft,
                isWhiteTurn: game.isWhiteTurn,
            };
        }
    ),

    isWhite: t.procedure
        .input(z.object({ gameId: z.string(), playerId: z.string() }))
        .query((req): boolean => {
            const game = games.get(req.input.gameId);
            if (!game) {
                throw new Error(`No game found with id ${req.input.gameId}`);
            }
            return game.whitePlayerId === req.input.playerId;
        }),

    selectHiddenQueen: t.procedure
        .input(z.object({ gameId: z.string(), playerId: z.string, x: z.number(), y: z.number() }))
        .mutation((req): boolean => {
            const { gameId, playerId, x, y } = req.input;
            const game = games.get(gameId);
            if (!game) {
                throw new Error(`No game found with id ${req.input}`);
            }

            if (playerId !== game.whitePlayerId && playerId !== game.blackPlayerId) {
                throw new Error(`No player found in this game ${playerId}`);
            }

            const isWhitePlayer = playerId === game.whitePlayerId;

            if (x < 0 || x >= game.board.width || y < 0 || y >= game.board.height) {
                throw new Error('Coordinates out of bounds');
            }
            const tileIndex = y * game.board.width + x;
            const currentPiece = game.board.tiles[tileIndex];

            const expectedPawn = isWhitePlayer ? 'wP' : 'bP';
            if (currentPiece !== expectedPawn) {
                throw new Error('Selected tile does not contain your pawn');
            }

            const hiddenQueen = isWhitePlayer ? 'wH' : 'bH';
            game.board.tiles[tileIndex] = hiddenQueen;
            return true;
        }),
});
