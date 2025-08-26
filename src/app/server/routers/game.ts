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
const gameTimeIncrement: number = 5; // 5 seconds

function hasMovedLikeAPawn(
    originTile: string,
    destinationTile: string,
    x1: number,
    y1: number,
    x2: number,
    y2: number
): boolean {
    if (originTile == 'wH') {
        if (x1 == x2 && y1 == 6 && y2 == 4 && destinationTile == '  ') return true; //initial pawn move
        if (x1 == x2 && y1 == y2 + 1 && destinationTile == '  ') return true; //any single forward pawn like move
        if (destinationTile != '  ' && Math.abs(x2 - x1) == 1 && Math.abs(y2 - y1) == 1 && y1 > y2)
            //pawn capture
            return true;
    } else if (originTile == 'bH') {
        if (x1 == x2 && y1 == 1 && destinationTile == '  ' && y2 == 3) return true; //initial pawn move
        if (x1 == x2 && y1 == y2 - 1 && destinationTile == '  ') return true; //any single forward pawn like move
        if (destinationTile != '  ' && Math.abs(x2 - x1) == 1 && Math.abs(y2 - y1) == 1 && y1 < y2)
            //pawn capture
            return true;
    }

    return false;
}

function hidePlayerIdsFromGame(playerId: string, game: Game): Game {
    return {
        id: game.id,
        board: maskHiddenQueen(playerId, game),
        isStarted: game.isStarted,
        isEnded: false,
        winnerId: null,
        isPrivate: game.isPrivate,
        whitePlayerId: null,
        blackPlayerId: null,
        whiteTimeLeft: game.whiteTimeLeft,
        blackTimeLeft: game.blackTimeLeft,
        lastMovePlayedAtTime: game.lastMovePlayedAtTime,
        isWhiteTurn: game.isWhiteTurn,
        whiteHiddenRevealed: game.whiteHiddenRevealed,
        blackHiddenRevealed: game.blackHiddenRevealed,
        moves: game.moves,
    };
}

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
        isEnded: false,
        winnerId: null,
        isPrivate: isPrivate,
        whitePlayerId: whitePlayerId,
        blackPlayerId: blackPlayerId,
        whiteTimeLeft: gameTime,
        blackTimeLeft: gameTime,
        lastMovePlayedAtTime: null,
        isWhiteTurn: true,
        whiteHiddenRevealed: false,
        blackHiddenRevealed: false,
        moves: [],
    };

    games.set(id, game);
    isInQueue.add(playerId);

    ee.emit('queueUpdate');

    return id;
}

function maskHiddenQueen(playerId: string, game: Game): Board {
    const tiles = game.board.tiles.map((tile) => {
        if (tile === 'wH' && game.whitePlayerId !== playerId && !game.whiteHiddenRevealed) {
            return 'wP';
        }
        if (tile === 'bH' && game.blackPlayerId !== playerId && !game.blackHiddenRevealed) {
            return 'bP';
        }
        return tile;
    });

    return { ...game.board, tiles };
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
            ee.emit('GameUpdate', game.id);
            ee.emit('opponentJoinedGame', game.id);

            return true;
        }),

    leaveGame: t.procedure.input(z.string()).mutation((req): boolean => {
        for (const [gameId, game] of games.entries()) {
            if (game.whitePlayerId == req.input || game.blackPlayerId == req.input) {
                games.delete(gameId);
                ee.emit('GameUpdate', gameId);
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

    onGameUpdate: t.procedure
        .input(
            z.object({
                gameId: z.string(),
                playerId: z.string(),
            })
        )
        .subscription((req) => {
            const { gameId: subscriptionGameId, playerId } = req.input;

            return observable<Game>((emit) => {
                const onGameUpdate = (gameId: string) => {
                    if (gameId === subscriptionGameId) {
                        const game = games.get(gameId);
                        if (game) {
                            emit.next(hidePlayerIdsFromGame(playerId, game));
                        }
                    }
                };

                ee.on('GameUpdate', onGameUpdate);

                const game = games.get(subscriptionGameId);
                if (game) {
                    emit.next(hidePlayerIdsFromGame(playerId, game));
                }

                return () => {
                    ee.off('GameUpdate', onGameUpdate);
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
                board: maskHiddenQueen(playerId, game),
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
            return null;
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
                game.lastMovePlayedAtTime = Date.now();
            }

            ee.emit('GameUpdate', gameId);

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
            const currentTime = Date.now();

            if (!game) {
                throw new Error(`No game found with id ${gameId}`);
            }

            if (!game.isStarted) {
                throw new Error('Game has not started yet');
            }

            if (game.isEnded) {
                throw new Error('Game ended');
            }

            const isWhitePlayer = game.whitePlayerId === playerId;
            const isBlackPlayer = game.blackPlayerId === playerId;

            if (!isWhitePlayer && !isBlackPlayer) {
                throw new Error('Player not found in this game');
            }

            if ((game.isWhiteTurn && !isWhitePlayer) || (!game.isWhiteTurn && !isBlackPlayer)) {
                throw new Error('Not your turn');
            }

            // Update time for the current player
            if (game.lastMovePlayedAtTime !== null) {
                const timeElapsed = Math.floor((currentTime - game.lastMovePlayedAtTime) / 1000); // Convert to seconds

                if (game.isWhiteTurn) {
                    game.whiteTimeLeft = Math.max(0, game.whiteTimeLeft - timeElapsed);

                    // Check if white player ran out of time
                    if (game.whiteTimeLeft <= 0) {
                        game.isEnded = true;
                        game.winnerId = game.blackPlayerId;
                        ee.emit('GameUpdate', gameId);
                        throw new Error('Time expired - Black wins!');
                    }
                    game.whiteTimeLeft += gameTimeIncrement;
                } else {
                    game.blackTimeLeft = Math.max(0, game.blackTimeLeft - timeElapsed);

                    // Check if black player ran out of time
                    if (game.blackTimeLeft <= 0) {
                        game.isEnded = true;
                        game.winnerId = game.whitePlayerId;
                        ee.emit('GameUpdate', gameId);
                        throw new Error('Time expired - White wins!');
                    }
                    game.blackTimeLeft += gameTimeIncrement;
                }
            }

            const originTileIndex = x1 + y1 * game.board.width;
            const originTile = game.board.tiles[originTileIndex];
            const destinationPieceIndex = x2 + y2 * game.board.width;
            const destinationTile = game.board.tiles[destinationPieceIndex];

            if (originTile === '  ') {
                throw new Error('No piece at origin position');
            }

            const pieceIsWhite = originTile.includes('w');
            const pieceIsBlack = originTile.includes('b');

            if ((isWhitePlayer && !pieceIsWhite) || (isBlackPlayer && !pieceIsBlack)) {
                throw new Error("Cannot move opponent's piece");
            }

            const canPieceMoveTo = pieceMovementHandler.canPieceMoveTo(game, x1, y1, x2, y2);

            if (!canPieceMoveTo) {
                throw new Error('Invalid move');
            }

            // Execute the move
            game.board.tiles[destinationPieceIndex] = game.board.tiles[originTileIndex];
            game.board.tiles[originTileIndex] = '  ';
            game.moves.push({ piece: originTile, fromX: x1, fromY: y1, toX: x2, toY: y2 });

            // Handle castling - rook moves
            if (originTile == 'wK') {
                if (x2 == 6 && y2 == 7) {
                    game.board.tiles[7 + 7 * game.board.width] = '  ';
                    game.board.tiles[5 + 7 * game.board.width] = 'wR';
                } else if (x2 == 2 && y2 == 7) {
                    game.board.tiles[0 + 7 * game.board.width] = '  ';
                    game.board.tiles[3 + 7 * game.board.width] = 'wR';
                }
            } else if (originTile == 'bK') {
                if (x2 == 6 && y2 == 0) {
                    game.board.tiles[7 + 0 * game.board.width] = '  ';
                    game.board.tiles[5 + 0 * game.board.width] = 'bR';
                } else if (x2 == 2 && y2 == 0) {
                    game.board.tiles[0 + 0 * game.board.width] = '  ';
                    game.board.tiles[3 + 0 * game.board.width] = 'bR';
                }
            }

            // Handle en passant
            if (originTile == 'wP' && y1 == 3 && y1 != y2 && destinationTile == '  ') {
                game.board.tiles[destinationPieceIndex + game.board.width] = '  ';
            } else if (originTile == 'bP' && y1 == 4 && y1 != y2 && destinationTile == '  ') {
                game.board.tiles[destinationPieceIndex - game.board.width] = '  ';
            }

            // Auto promote to a queen
            if (originTile == 'wP' && y2 == 0) {
                game.board.tiles[destinationPieceIndex] = 'wQ';
            } else if (originTile == 'bP' && y2 == 7) {
                game.board.tiles[destinationPieceIndex] = 'bQ';
            }

            // Reveal queens if they have arived to the end of the board
            if (originTile == 'wH' && y2 == 0) {
                game.whiteHiddenRevealed = true;
            } else if (originTile == 'bH' && y2 == 7) {
                game.blackHiddenRevealed = true;
            }

            // Check for game-ending captures
            if (destinationTile == 'wK') {
                game.isEnded = true;
                game.winnerId = game.blackPlayerId;
            } else if (destinationTile == 'bK') {
                game.isEnded = true;
                game.winnerId = game.whitePlayerId;
            }

            //check if we should reveal
            const movedLikeAPawn = hasMovedLikeAPawn(originTile, destinationTile, x1, y1, x2, y2);
            if (originTile == 'wH' && !movedLikeAPawn) {
                game.whiteHiddenRevealed = true;
            }
            if (originTile == 'bH' && !movedLikeAPawn) {
                game.blackHiddenRevealed = true;
            }

            // Switch turns and update last move time
            game.isWhiteTurn = !game.isWhiteTurn;
            game.lastMovePlayedAtTime = currentTime;

            ee.emit('GameUpdate', gameId);

            return true;
        }),
});
