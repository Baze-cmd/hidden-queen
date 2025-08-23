'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { BoardComponent } from '@/components/BoardComponent/BoardComponent';
import styles from './page.module.css';
import { Board } from '@/types/Board';
import { Player } from '@/types/Player';
import { InitBoard } from '@/app/InitBoard';
import { useParams } from 'next/navigation';
import { usePlayer } from '@/app/providers';
import { LoaderIcon } from 'lucide-react';
import { trpc } from '@/app/utils/trpc';
import { pieceMovementHandler } from '@/core/PieceMovement';
import { skipToken } from '@tanstack/react-query';

export default function GamePage() {
    const gameTime = 300;
    const gameTimeIncrement = 5;

    const [currentUserPlayer, setCurrentUserPlayer] = useState<Player>();
    const [opponentPlayer, setOpponentPlayer] = useState<Player>();

    const [currentUserTime, setCurrentUserTime] = useState<number>();
    const [opponentTime, setOpponentTime] = useState<number>();

    const [whitePOV, setWhitePOV] = useState<boolean>(true);
    const [board, setBoard] = useState<Board>(InitBoard());
    const [originalBoard, setOriginalBoard] = useState<Board>(InitBoard());
    const [message, setMessage] = useState<string>('');
    const [opponentHasJoined, setOpponentHasJoined] = useState<boolean>(false);

    const [gameIsStarted, setGameIsStarted] = useState<boolean>(false);

    const [selectedPiece, setSelectedPiece] = useState<{ x: number; y: number } | null>(null);

    const [isMakingMove, setIsMakingMove] = useState<boolean>(false);

    const params = useParams();
    const gameId = params.gameId as string;
    const { playerId, isLoading: isPlayerLoading } = usePlayer();

    const { data: opponentInfo, refetch: fetchOpponentInfo } = trpc.games.getOpponentInfo.useQuery(
        { gameId, playerId: playerId! },
        {
            enabled: !!gameId && !!playerId,
        }
    );

    const { data: currentPlayerInfo } = trpc.getPlayerById.useQuery(playerId ?? skipToken, {
        enabled: !!playerId,
    });

    const { data: gameState, refetch: refetchBoard } =
        trpc.games.getGameBoardStateForGameWithId.useQuery(
            !gameId || !playerId ? skipToken : { gameId, playerId },
            { enabled: !!gameId && !!playerId }
        );

    const { refetch: refetchIsWhite, data: isWhite } = trpc.games.isWhite.useQuery(
        !gameId || !playerId ? skipToken : { gameId, playerId },
        {
            enabled: !!gameId && !!playerId,
        }
    );

    trpc.games.onBoardUpdate.useSubscription(
        { gameId, playerId: playerId || '' },
        {
            enabled: !!gameId && !!playerId,
            onData: (updatedBoard) => {
                console.log('Board update received:', updatedBoard);
                setBoard(updatedBoard);
                setOriginalBoard(updatedBoard);

                if (selectedPiece) {
                    setSelectedPiece(null);
                }

                setIsMakingMove(false);
            },
            onError: (err) => {
                console.error('Subscription error:', err);
                setMessage('Error: Could not subscribe to board updates.');
                setIsMakingMove(false);
            },
        }
    );

    useEffect(() => {
        if (opponentHasJoined && isWhite !== undefined) {
            setWhitePOV(isWhite);
        }
    }, [isWhite, opponentHasJoined]);

    trpc.games.opponentJoinedGame.useSubscription(gameId, {
        enabled: !!gameId,
        onData: () => {
            setOpponentHasJoined(true);
            refetchIsWhite();
            fetchOpponentInfo();
        },
    });

    trpc.games.gameStartedUpdate.useSubscription(gameId, {
        enabled: !!gameId,
        onData: () => {
            setGameIsStarted(true);
        },
    });

    useEffect(() => {
        if (opponentInfo) {
            setOpponentPlayer({
                id: '',
                name: opponentInfo.name,
                rating: opponentInfo.rating,
            });
        }
    }, [opponentInfo]);

    useEffect(() => {
        if (gameId && playerId) {
            setOpponentHasJoined(true);
            refetchIsWhite();
            fetchOpponentInfo();
        }
    }, [gameId, playerId, refetchIsWhite, fetchOpponentInfo]);

    useEffect(() => {
        if (gameState) {
            setBoard(gameState.board);
            setOriginalBoard(gameState.board);
            setGameIsStarted(gameState.isStarted);
        }
    }, [gameState]);

    const selectHiddenQueenMutation = trpc.games.selectHiddenQueen.useMutation();
    const makeMoveMutation = trpc.games.move.useMutation();

    if (isPlayerLoading) {
        return <LoaderIcon className={`${styles.spinner} animate-spin`} />;
    }

    const formatTime = (seconds: number): string => {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    };

    const clearSelection = () => {
        setSelectedPiece(null);
        setBoard({ ...originalBoard });
    };

    const isMyPiece = (x: number, y: number): boolean => {
        const tile = originalBoard.tiles[x + y * originalBoard.width];
        if (tile === '  ') return false;

        const isWhitePlayer = Boolean(isWhite);
        const isWhitePiece = tile.includes('w');
        const isBlackPiece = tile.includes('b');

        return (isWhitePlayer && isWhitePiece) || (!isWhitePlayer && isBlackPiece);
    };

    const selectPiece = (x: number, y: number) => {
        if (isMakingMove) return;

        if (!isMyPiece(x, y)) return;

        const moves = pieceMovementHandler.getValidMoves(originalBoard, x, y);

        const newBoard = { ...originalBoard };
        newBoard.tiles = [...originalBoard.tiles];

        moves.forEach((move) => {
            const index = move.y * newBoard.width + move.x;
            newBoard.tiles[index] = 'ci';
        });

        setBoard(newBoard);
        setSelectedPiece({ x, y });
    };

    const makeMove = async (toX: number, toY: number) => {
        if (!selectedPiece || !gameId || !playerId || isMakingMove) return;

        setIsMakingMove(true);

        try {
            console.log('Making move:', selectedPiece, 'to', toX, toY);

            await makeMoveMutation.mutateAsync({
                gameId,
                playerId,
                x1: selectedPiece.x,
                y1: selectedPiece.y,
                x2: toX,
                y2: toY,
            });

            setMessage('Move made successfully!');
        } catch (error: unknown) {
            console.error('Failed to make move:', error);
            setIsMakingMove(false);

            if (error instanceof Error) {
                setMessage(`Error: ${error.message}`);
            } else {
                setMessage('An unknown error occurred.');
            }
        }
    };

    const handleHiddenQueenSelection = async (x: number, y: number) => {
        if (!playerId) {
            return;
        }
        try {
            const result = await selectHiddenQueenMutation.mutateAsync({
                gameId,
                playerId,
                x,
                y,
            });
            if (result) {
                setMessage('Hidden queen selected! Game starting...');
            } else {
                setMessage('Invalid move: You must select one of your pawns.');
            }
        } catch (error: unknown) {
            console.error('Failed to select hidden queen:', error);
            if (error instanceof Error) {
                setMessage(`Error: ${error.message}`);
            } else {
                setMessage('An unknown error occurred.');
            }
        }

        return;
    };

    const handleTileClick = async (x: number, y: number) => {
        if (!gameId || !playerId) {
            setMessage('Error: Game or player information missing.');
            return;
        }

        if (isMakingMove) return;

        const clickedTile = board.tiles[y * board.width + x];
        console.log('Clicked tile:', clickedTile, 'at', x, y, 'Game started:', gameIsStarted);

        if (!gameIsStarted) {
            if (clickedTile === '  ') {
                return;
            }
            await handleHiddenQueenSelection(x, y);
            return;
        }

        if (clickedTile === 'ci') {
            await makeMove(x, y);
        } else if (clickedTile === '  ') {
            clearSelection();
        } else if (isMyPiece(x, y)) {
            selectPiece(x, y);
        } else {
            clearSelection();
        }
    };

    return (
        <div className={styles.page}>
            <div className={styles.grid}>
                <div className={styles.col1}>
                    <Card className={styles.cardDark}>
                        <CardContent className={styles.playerSection}>
                            {!opponentHasJoined && (
                                <div
                                    style={{
                                        padding: '1rem',
                                        backgroundColor: '#333',
                                        borderRadius: '8px',
                                        marginBottom: '1rem',
                                        textAlign: 'center',
                                    }}
                                >
                                    <p>{message}</p>
                                    <div
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            gap: '0.5rem',
                                            marginTop: '0.5rem',
                                        }}
                                    >
                                        <LoaderIcon className="h-4 w-4 animate-spin" />
                                        <span style={{ fontSize: '0.875rem', opacity: 0.7 }}>
                                            Waiting for opponent...
                                        </span>
                                    </div>
                                </div>
                            )}

                            <div className={styles.playerCard}>
                                <div className={styles.playerInfo}>
                                    <div className={styles.playerName}>
                                        {opponentPlayer?.name || 'opponent'}
                                    </div>
                                    <div className={styles.playerRating}>
                                        ({opponentPlayer?.rating || 0})
                                    </div>
                                </div>
                                <div className={styles.timeDisplay}>
                                    {formatTime(opponentTime || gameTime)}
                                </div>
                            </div>

                            <div className={styles.playerCard}>
                                <div className={styles.playerInfo}>
                                    <div className={styles.playerName}>
                                        {currentUserPlayer?.name || 'You'} (you)
                                    </div>
                                    <div className={styles.playerRating}>
                                        ({currentUserPlayer?.rating || 0})
                                    </div>
                                </div>
                                <div className={styles.timeDisplay}>
                                    {formatTime(currentUserTime || gameTime)}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
                <div className={styles.col2}>
                    <Card className={styles.cardDark}>
                        <CardContent className={styles.cardContent}>
                            <BoardComponent
                                board={board}
                                whitePOV={whitePOV}
                                onTileClick={handleTileClick}
                            />
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
