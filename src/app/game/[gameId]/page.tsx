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

export default function GamePage() {
    const gameTime = 300;
    const gameTimeIncrement = 5;

    const [whitePlayer, setWhitePlayer] = useState<Player>();
    const [whiteTime, setWhiteTime] = useState<number>(gameTime);
    const [blackPlayer, setBlackPlayer] = useState<Player>();
    const [blackTime, setBlackTime] = useState<number>(gameTime);
    const [whitePOV, setWhitePOV] = useState<boolean>(true);
    const [board, setBoard] = useState<Board>(InitBoard());

    const params = useParams();
    const gameId = params.gameId as string;
    const { playerId, isLoading: isPlayerLoading } = usePlayer();

    const gameStarted = whitePlayer && blackPlayer;
    const shouldPoll = !gameStarted;

    const { data: gotBoard } = trpc.games.getGameBoardStateForGameWithId.useQuery(gameId, {
        enabled: !!gameId,
        refetchInterval: shouldPoll ? 5000 : false,
    });

    const { data: gameInfo } = trpc.games.getGameInfo.useQuery(gameId, {
        enabled: !!gameId,
        refetchInterval: shouldPoll ? 5000 : false,
    });

    const { data: isWhite } = trpc.games.isWhite.useQuery(
        { gameId, playerId: playerId || '' },
        {
            enabled: !!gameId && !!playerId,
            refetchInterval: shouldPoll ? 5000 : false,
        }
    );

    useEffect(() => {
        if (gotBoard) {
            setBoard(gotBoard);
        }
    }, [gotBoard]);

    useEffect(() => {
        if (gameInfo) {
            if (gameInfo.whitePlayer) {
                setWhitePlayer({
                    id: '',
                    name: gameInfo.whitePlayer.name,
                    rating: gameInfo.whitePlayer.rating,
                });
            }

            if (gameInfo.blackPlayer) {
                setBlackPlayer({
                    id: '',
                    name: gameInfo.blackPlayer.name,
                    rating: gameInfo.blackPlayer.rating,
                });
            }

            setWhiteTime(gameInfo.whiteTimeLeft);
            setBlackTime(gameInfo.blackTimeLeft);
        }
    }, [gameInfo]);

    useEffect(() => {
        if (isWhite !== undefined && gameStarted) {
            setWhitePOV(isWhite);
        }
    }, [isWhite, gameStarted]);

    if (isPlayerLoading) {
        return <LoaderIcon className={`${styles.spinner} animate-spin`} />;
    }

    const formatTime = (seconds: number): string => {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    };

    const currentUserIsWhite = isWhite;
    const currentUserPlayer = currentUserIsWhite ? whitePlayer : blackPlayer;
    const opponentPlayer = currentUserIsWhite ? blackPlayer : whitePlayer;
    const currentUserTime = currentUserIsWhite ? whiteTime : blackTime;
    const opponentTime = currentUserIsWhite ? blackTime : whiteTime;

    return (
        <div className={styles.page}>
            <div className={styles.grid}>
                <div className={styles.col1}>
                    <Card className={styles.cardDark}>
                        <CardContent className={styles.playerSection}>
                            {!gameStarted && (
                                <div
                                    style={{
                                        padding: '1rem',
                                        backgroundColor: '#333',
                                        borderRadius: '8px',
                                        marginBottom: '1rem',
                                        textAlign: 'center',
                                    }}
                                >
                                    <p>Waiting for opponent to join...</p>
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
                                            Checking for updates...
                                        </span>
                                    </div>
                                </div>
                            )}

                            {/* Opponent (top) */}
                            <div className={styles.playerCard}>
                                <div className={styles.playerInfo}>
                                    <div className={styles.playerName}>
                                        {opponentPlayer?.name || 'Waiting for opponent...'}
                                    </div>
                                    <div className={styles.playerRating}>
                                        ({opponentPlayer?.rating || 0})
                                    </div>
                                </div>
                                <div className={styles.timeDisplay}>{formatTime(opponentTime)}</div>
                            </div>

                            {/* Current User (bottom) */}
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
                                    {formatTime(currentUserTime)}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
                <div className={styles.col2}>
                    <Card className={styles.cardDark}>
                        <CardContent className={styles.cardContent}>
                            <BoardComponent board={board} whitePOV={whitePOV} />
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
