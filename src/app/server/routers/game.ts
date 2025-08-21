import { t, ee } from '@/app/server/trpc';
import { Game } from '@/types/Game';
import { InitBoard } from '@/app/InitBoard';
import { z } from 'zod';
import { Board } from '@/types/Board';
import { games, isInQueue } from '../gameStore';
import { allPlayers } from '../playerStore';
import { observable } from '@trpc/server/observable';

const gameTime: number = 300; // 5 minutes
const gameTimeIncrement: number = 50; // 5 seconds

function getPlayersInQueue() {
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
}

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

    // Publish event when a player joins the queue
    ee.emit('queueUpdate');

    return id;
}

function maskHiddenQueen(board: Board, playerId: string, game: Game): Board {
    const tiles = board.tiles.map((tile) => {
        if (tile === 'wH' && game.whitePlayerId !== playerId) {
            return 'wP'; // hide white queen from non-white player
        }
        if (tile === 'bH' && game.blackPlayerId !== playerId) {
            return 'bP'; // hide black queen from non-black player
        }
        return tile;
    });

    return { ...board, tiles };
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

            // Publish event when a player joins a game
            ee.emit('queueUpdate');
            // Notify clients of the board state change
            ee.emit('boardUpdate', game.id);

            return true;
        }),

    leaveGame: t.procedure.input(z.string()).mutation((req): boolean => {
        for (const [gameId, game] of games.entries()) {
            if (game.whitePlayerId == req.input || game.blackPlayerId == req.input) {
                games.delete(gameId);
                // Also notify clients that the game has ended
                ee.emit('boardUpdate', gameId);
                break;
            }
        }
        isInQueue.delete(req.input);

        // Publish event when a player leaves the queue/game
        ee.emit('queueUpdate');

        return true;
    }),

    isInQueue: t.procedure.input(z.string()).query((req): boolean => {
        return isInQueue.has(req.input);
    }),

    // New subscription procedure for real-time updates of the public queue
    getPlayersInPublicQueue: t.procedure.subscription(() => {
        return observable<ReturnType<typeof getPlayersInQueue>>((emit) => {
            const onQueueUpdate = () => {
                emit.next(getPlayersInQueue());
            };
            ee.on('queueUpdate', onQueueUpdate);

            // Initial emit of the current state
            onQueueUpdate();

            return () => {
                ee.off('queueUpdate', onQueueUpdate);
            };
        });
    }),

    // New subscription procedure for real-time board updates for a specific game
    onBoardUpdate: t.procedure
        .input(
            z.object({
                gameId: z.string(),
                playerId: z.string(),
            })
        )
        .subscription((req) => {
            const { gameId: subscriptionGameId, playerId } = req.input;

            return observable<Board>((emit) => {
                const onBoardUpdate = (gameId: string) => {
                    if (gameId === subscriptionGameId) {
                        const game = games.get(gameId);
                        if (game) {
                            emit.next(maskHiddenQueen(game.board, playerId, game));
                        }
                    }
                };

                ee.on('boardUpdate', onBoardUpdate);

                // Send initial board
                const game = games.get(subscriptionGameId);
                if (game) {
                    emit.next(maskHiddenQueen(game.board, playerId, game));
                }

                return () => {
                    ee.off('boardUpdate', onBoardUpdate);
                };
            });
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
        .input(z.object({ gameId: z.string(), playerId: z.string(), x: z.number(), y: z.number() }))
        .mutation((req): boolean => {
            const { gameId, playerId, x, y } = req.input;
            const game = games.get(gameId);
            if (!game) {
                throw new Error(`No game found with id ${req.input}`);
            }

            if (game.isStarted) {
                return false;
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

            game.board.tiles = game.board.tiles.map((tile) => {
                if (isWhitePlayer && tile == 'wH') return 'wP';
                if (!isWhitePlayer && tile == 'bH') return 'bP';
                return tile;
            });

            game.board.tiles[tileIndex] = hiddenQueen;

            // Notify all subscribed clients that the board has been updated
            ee.emit('boardUpdate', gameId);

            return true;
        }),
});
