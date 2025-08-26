'use client';

import { useState, useEffect, useRef } from 'react';
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
import { Game } from '@/types/Game';

export default function GamePage() {
    const [me, setMyself] = useState<Player>();
    const [opponent, setOpponent] = useState<Player>();

    const [originalBoard, setOriginalBoard] = useState<Board>(InitBoard());

    const [game, setGame] = useState<Game>();

    const [localWhiteTime, setLocalWhiteTime] = useState<number>(300);
    const [localBlackTime, setLocalBlackTime] = useState<number>(300);
    const [lastUpdateTime, setLastUpdateTime] = useState<number>(Date.now());
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    const [selectedPiece, setSelectedPiece] = useState<{ x: number; y: number } | null>(null);

    const params = useParams();
    const gameId = params.gameId as string;
    const { playerId, isLoading: isPlayerLoading } = usePlayer();

    const { data: player } = trpc.getPlayerById.useQuery(playerId!, {
        enabled: !!playerId,
    });

    useEffect(() => {
        if (player) {
            setMyself(player);
        }
    }, [player]);

    const { data: opponentInfo, refetch: fetchOpponentInfo } = trpc.games.getOpponentInfo.useQuery(
        { gameId, playerId: playerId! },
        {
            enabled: !!gameId && !!playerId,
        }
    );

    const { refetch: refetchIsWhite, data: isWhite } = trpc.games.isWhite.useQuery(
        !gameId || !playerId ? skipToken : { gameId, playerId },
        {
            enabled: !!gameId && !!playerId,
        }
    );

    trpc.games.onGameUpdate.useSubscription(
        { gameId, playerId: playerId || '' },
        {
            enabled: !!gameId && !!playerId,
            onData: (game) => {
                setGame(game);
                setOriginalBoard(game.board);

                setLocalWhiteTime(game.whiteTimeLeft);
                setLocalBlackTime(game.blackTimeLeft);
                setLastUpdateTime(Date.now());

                if (selectedPiece) {
                    setSelectedPiece(null);
                }
            },
            onError: (err) => {
                console.error('Subscription error:', err);
            },
        }
    );

    trpc.games.opponentJoinedGame.useSubscription(gameId, {
        enabled: !!gameId,
        onData: () => {
            refetchIsWhite();
            fetchOpponentInfo();
        },
    });

    useEffect(() => {
        if (!game?.isStarted || game?.isEnden) {
            if (timerRef.current) {
                clearInterval(timerRef.current);
                timerRef.current = null;
            }
            return;
        }

        timerRef.current = setInterval(() => {
            const now = Date.now();
            const elapsed = Math.floor((now - lastUpdateTime) / 1000);

            if (game.isWhiteTurn) {
                setLocalWhiteTime(() => Math.max(0, game.whiteTimeLeft - elapsed));
            } else {
                setLocalBlackTime(() => Math.max(0, game.blackTimeLeft - elapsed));
            }
        }, 100);

        return () => {
            if (timerRef.current) {
                clearInterval(timerRef.current);
                timerRef.current = null;
            }
        };
    }, [
        game?.isStarted,
        game?.isEnden,
        game?.isWhiteTurn,
        game?.whiteTimeLeft,
        game?.blackTimeLeft,
        lastUpdateTime,
    ]);

    useEffect(() => {
        return () => {
            if (timerRef.current) {
                clearInterval(timerRef.current);
            }
        };
    }, []);

    useEffect(() => {
        if (opponentInfo) {
            setOpponent({
                id: '',
                name: opponentInfo.name,
                rating: opponentInfo.rating,
            });
        }
    }, [opponentInfo]);

    useEffect(() => {
        if (gameId && playerId) {
            refetchIsWhite();
            fetchOpponentInfo();
        }
    }, [gameId, playerId, refetchIsWhite, fetchOpponentInfo]);

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
        setGame((prev) => (prev ? { ...prev, board: { ...originalBoard } } : undefined));
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
        if (!isMyPiece(x, y)) return;
        const validMoves = pieceMovementHandler.getValidMoves(game!, x, y);

        const newBoard = { ...originalBoard };
        newBoard.tiles = [...originalBoard.tiles];

        validMoves.forEach((move) => {
            const index = move.x + move.y * newBoard.width;
            newBoard.tiles[index] = 'ci';
        });

        setGame((prev) => (prev ? { ...prev, board: { ...newBoard } } : undefined));
        setSelectedPiece({ x, y });
    };

    const makeMove = async (toX: number, toY: number) => {
        if (!selectedPiece || !gameId || !playerId) return;
        if ((isWhite && !game?.isWhiteTurn) || (!isWhite && game?.isWhiteTurn)) {
            return;
        }
        try {
            await makeMoveMutation.mutateAsync({
                gameId,
                playerId,
                x1: selectedPiece.x,
                y1: selectedPiece.y,
                x2: toX,
                y2: toY,
            });
        } catch (error: unknown) {
            console.error('Failed to make move:', error);
        }
    };

    const handleHiddenQueenSelection = async (x: number, y: number) => {
        if (!playerId) {
            return;
        }
        try {
            await selectHiddenQueenMutation.mutateAsync({
                gameId,
                playerId,
                x,
                y,
            });
        } catch (error: unknown) {
            console.error('Failed to select hidden queen:', error);
        }

        return;
    };

    const handleTileClick = async (x: number, y: number) => {
        if (!gameId || !playerId) {
            return;
        }

        const clickedTile = game!.board.tiles[y * game!.board.width + x];
        console.log('Clicked tile:', clickedTile, 'at', x, y, 'Game started:', game?.isStarted);

        if (!game?.isStarted) {
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
                            <div className={styles.playerCard}>
                                <div className={styles.playerInfo}>
                                    <div className={styles.playerName}>
                                        {opponent?.name || 'opponent'}
                                    </div>
                                    <div className={styles.playerRating}>
                                        ({opponent?.rating || 0})
                                    </div>
                                </div>
                                <div className={styles.timeDisplay}>
                                    {formatTime(isWhite ? localBlackTime : localWhiteTime)}
                                </div>
                            </div>

                            <div className={styles.playerCard}>
                                <div className={styles.playerInfo}>
                                    <div className={styles.playerName}>{me?.name} (you)</div>
                                    <div className={styles.playerRating}>({me?.rating || 0})</div>
                                </div>
                                <div className={styles.timeDisplay}>
                                    {formatTime(isWhite ? localWhiteTime : localBlackTime)}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
                <div className={styles.col2}>
                    <Card className={styles.cardDark}>
                        <CardContent className={styles.cardContent}>
                            <BoardComponent
                                board={game?.board ?? originalBoard}
                                isWhite={isWhite!}
                                onTileClick={handleTileClick}
                            />
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
