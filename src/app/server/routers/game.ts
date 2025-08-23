import { t, ee } from '@/app/server/trpc';
import { Game } from '@/types/Game';
import { InitBoard } from '@/app/InitBoard';
import { z } from 'zod';
import { Board } from '@/types/Board';
import { games, isInQueue } from '../gameStore';
import { allPlayers } from '../playerStore';
import { observable } from '@trpc/server/observable';
import { pieceMovementHandler } from '@/core/PieceMovement';

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

    ee.emit('queueUpdate');

    return id;
}

function maskHiddenQueen(board: Board, playerId: string, game: Game): Board {
    const tiles = board.tiles.map((tile) => {
        if (tile === 'wH' && game.whitePlayerId !== playerId) {
            return 'wP';
        }
        if (tile === 'bH' && game.blackPlayerId !== playerId) {
            return 'bP';
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
            if (
                game.whitePlayerId === req.input.playerId ||
                game.blackPlayerId === req.input.playerId
            ) {
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

            ee.emit('queueUpdate');
            ee.emit('boardUpdate', game.id);
            ee.emit('opponentJoinedGame', game.id);

            return true;
        }),

    leaveGame: t.procedure.input(z.string()).mutation((req): boolean => {
        for (const [gameId, game] of games.entries()) {
            if (game.whitePlayerId == req.input || game.blackPlayerId == req.input) {
                games.delete(gameId);
                ee.emit('boardUpdate', gameId);
                break;
            }
        }
        isInQueue.delete(req.input);

        ee.emit('queueUpdate');

        return true;
    }),

    isInQueue: t.procedure.input(z.string()).query((req): boolean => {
        return isInQueue.has(req.input);
    }),

    getPlayersInPublicQueue: t.procedure.subscription(() => {
        return observable<ReturnType<typeof getPlayersInQueue>>((emit) => {
            const onQueueUpdate = () => {
                emit.next(getPlayersInQueue());
            };
            ee.on('queueUpdate', onQueueUpdate);

            onQueueUpdate();

            return () => {
                ee.off('queueUpdate', onQueueUpdate);
            };
        });
    }),

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
                            console.log(
                                `Emitting board update for game ${gameId} to player ${playerId}`
                            );
                            emit.next(maskHiddenQueen(game.board, playerId, game));
                        }
                    }
                };

                ee.on('boardUpdate', onBoardUpdate);

                const game = games.get(subscriptionGameId);
                if (game) {
                    emit.next(maskHiddenQueen(game.board, playerId, game));
                }

                return () => {
                    ee.off('boardUpdate', onBoardUpdate);
                };
            });
        }),

    getGameBoardStateForGameWithId: t.procedure
        .input(z.object({ gameId: z.string(), playerId: z.string() }))
        .query((req) => {
            const game = games.get(req.input.gameId);
            const playerId = req.input.playerId;
            if (!game) {
                throw new Error(`No game found with id ${req.input.gameId}`);
            }
            return {
                board: maskHiddenQueen(game.board, playerId, game),
                isStarted: game.isStarted,
            };
        }),

    isWhite: t.procedure
        .input(z.object({ gameId: z.string(), playerId: z.string() }))
        .query((req): boolean => {
            const game = games.get(req.input.gameId);
            if (!game) {
                throw new Error(`No game found with id ${req.input.gameId}`);
            }
            return game.whitePlayerId === req.input.playerId;
        }),

    getOpponentInfo: t.procedure
        .input(z.object({ gameId: z.string(), playerId: z.string() }))
        .query((req) => {
            const gameId = req.input.gameId;
            const playerId = req.input.playerId;
            const game = games.get(gameId);
            if (!game) {
                throw new Error(`No game found with id ${gameId}`);
            }
            const whitePlayerId = game.whitePlayerId;
            const blackPlayerId = game.blackPlayerId;
            let player = null;
            if (whitePlayerId == playerId) {
                player = allPlayers.get(blackPlayerId!);
            } else if (blackPlayerId == playerId) {
                player = allPlayers.get(whitePlayerId!);
            } else {
                throw new Error('No opponent found');
            }
            if (player) {
                return { name: player.name, rating: player.rating };
            }
        }),

    selectHiddenQueen: t.procedure
        .input(z.object({ gameId: z.string(), playerId: z.string(), x: z.number(), y: z.number() }))
        .mutation((req): boolean => {
            const { gameId, playerId, x, y } = req.input;
            const game = games.get(gameId);
            if (!game) {
                throw new Error(`No game found with id ${gameId}`);
            }

            if (game.isStarted) {
                return false;
            }

            if (playerId !== game.whitePlayerId && playerId !== game.blackPlayerId) {
                console.log(`${playerId} - ${game.whitePlayerId} - ${game.blackPlayerId}`);
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

            let numHiddenQueens = 0;
            for (const tile of game.board.tiles) {
                if (tile === 'wH') {
                    numHiddenQueens += 1;
                }
                if (tile === 'bH') {
                    numHiddenQueens += 1;
                }
            }

            if (numHiddenQueens == 2) {
                game.isStarted = true;
                game.isWhiteTurn = true;
                ee.emit('gameStartedUpdate', gameId);
            }

            ee.emit('boardUpdate', gameId);

            return game.isStarted;
        }),

    opponentJoinedGame: t.procedure.input(z.string()).subscription((req) => {
        const subscriptionGameId = req.input;
        return observable<boolean>((emit) => {
            const onOpponentJoined = (gameId: string) => {
                if (gameId == subscriptionGameId) {
                    emit.next(true);
                }
            };
            ee.on('opponentJoinedGame', onOpponentJoined);
            return () => {
                ee.off('opponentJoinedGame', onOpponentJoined);
            };
        });
    }),

    gameStartedUpdate: t.procedure.input(z.string()).subscription((req) => {
        const subscriptionGameId = req.input;
        return observable<boolean>((emit) => {
            const onGameStart = (gameId: string) => {
                if (gameId == subscriptionGameId) {
                    emit.next(true);
                }
            };
            ee.on('gameStartedUpdate', onGameStart);
            return () => {
                ee.off('gameStartedUpdate', onGameStart);
            };
        });
    }),

    move: t.procedure
        .input(
            z.object({
                gameId: z.string(),
                playerId: z.string(),
                x1: z.number(),
                y1: z.number(),
                x2: z.number(),
                y2: z.number(),
            })
        )
        .mutation((req) => {
            const { gameId, playerId, x1, y1, x2, y2 } = req.input;
            const game = games.get(gameId);

            if (!game) {
                throw new Error(`No game found with id ${gameId}`);
            }

            if (!game.isStarted) {
                throw new Error('Game has not started yet');
            }

            const isWhitePlayer = game.whitePlayerId === playerId;
            const isBlackPlayer = game.blackPlayerId === playerId;

            if (!isWhitePlayer && !isBlackPlayer) {
                throw new Error('Player not found in this game');
            }

            if ((game.isWhiteTurn && !isWhitePlayer) || (!game.isWhiteTurn && !isBlackPlayer)) {
                throw new Error('Not your turn');
            }

            const originTileIndex = x1 + y1 * game.board.width;
            const originPiece = game.board.tiles[originTileIndex];

            if (originPiece === '  ') {
                throw new Error('No piece at origin position');
            }

            const pieceIsWhite = originPiece.includes('w');
            const pieceIsBlack = originPiece.includes('b');

            if ((isWhitePlayer && !pieceIsWhite) || (isBlackPlayer && !pieceIsBlack)) {
                throw new Error("Cannot move opponent's piece");
            }

            const canPieceMoveTo = pieceMovementHandler.canPieceMoveTo(game.board, x1, y1, x2, y2);
            if (!canPieceMoveTo) {
                throw new Error('Invalid move');
            }

            const destinationPieceIndex = x2 + y2 * game.board.width;
            game.board.tiles[destinationPieceIndex] = game.board.tiles[originTileIndex];
            game.board.tiles[originTileIndex] = '  ';

            game.isWhiteTurn = !game.isWhiteTurn;

            console.log(
                `Move made in game ${gameId}: ${originPiece} from (${x1},${y1}) to (${x2},${y2}). Next turn: ${
                    game.isWhiteTurn ? 'White' : 'Black'
                }`
            );

            ee.emit('boardUpdate', gameId);

            return {
                success: true,
                isWhiteTurn: game.isWhiteTurn,
                move: {
                    from: { x: x1, y: y1 },
                    to: { x: x2, y: y2 },
                    piece: originPiece,
                },
            };
        }),
});
