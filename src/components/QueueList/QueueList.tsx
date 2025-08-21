import { Button } from '@/components/ui/button';
import { Play, X } from 'lucide-react';
import styles from './QueueList.module.css';
import { trpc } from '@/app/utils/trpc';
import { CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, LoaderIcon } from 'lucide-react';
import { usePlayer } from '@/app/providers';
import { useRouter } from 'next/navigation';
import { join } from 'path';

export const QueueList = () => {
    const { data, isLoading } = trpc.games.getPlayersByPublicGameId.useQuery();
    const playersByPublicGameId = new Map(data);
    const createPrivateGameMutation = trpc.games.createPrivateGame.useMutation();
    const createPublicGameMutation = trpc.games.createPublicGame.useMutation();
    const joinGameMutation = trpc.games.joinGame.useMutation();
    const leaveGameMutation = trpc.games.leaveGame.useMutation();

    const { playerId, isLoading: isPlayerLoading } = usePlayer();
    const router = useRouter();
    const utils = trpc.useUtils();

    const { data: isPlayerInQueue, isLoading: isQueueStatusLoading } =
        trpc.games.isInQueue.useQuery(playerId || '', { enabled: !!playerId });

    if (isLoading || isPlayerLoading || isQueueStatusLoading)
        return <LoaderIcon className={`${styles.spinner} animate-spin`} />;

    function createPrivateGameButton() {
        if (!playerId) {
            console.error('Player ID is not available');
            return;
        }
        createPrivateGameMutation
            .mutateAsync(playerId)
            .then((gameId) => {
                if (gameId) {
                    router.push(`/game/${gameId}`);
                }
            })
            .catch((error) => {
                console.error('Failed to create game:', error);
            });
    }

    async function handleQueueToggle() {
        if (!playerId) {
            console.error('Player ID is not available');
            return;
        }

        try {
            if (isPlayerInQueue) {
                await leaveGameMutation.mutateAsync(playerId);
                await utils.games.isInQueue.invalidate();
                await utils.games.getPlayersByPublicGameId.invalidate();
            } else {
                const gameId = await createPublicGameMutation.mutateAsync(playerId);
                if (gameId) {
                    router.push(`/game/${gameId}`);
                } else {
                    await utils.games.isInQueue.invalidate();
                    await utils.games.getPlayersByPublicGameId.invalidate();
                }
            }
        } catch (error) {
            console.error('Failed to toggle queue:', error);
            await utils.games.isInQueue.invalidate();
            await utils.games.getPlayersByPublicGameId.invalidate();
        }
    }

    function joinGame(gameId: string) {
        if (playerId && gameId) {
            joinGameMutation.mutateAsync({ playerId, gameId });
            router.push(`/game/${gameId}`);
        }
    }

    return (
        <>
            <CardHeader>
                <CardTitle className={styles.cardTitle}>
                    <Users className={styles.iconSmall} />
                    Queued Players ({playersByPublicGameId.size})
                </CardTitle>
            </CardHeader>
            <CardContent className={styles.cardContent}>
                <div className={styles.cardContentSpace}>
                    <div className={styles.buttonGrid}>
                        <Button
                            onClick={createPrivateGameButton}
                            className={styles.createPrivateGameButton}
                        >
                            Private game
                        </Button>
                        <Button
                            className={styles.joinQueueButton}
                            onClick={handleQueueToggle}
                            disabled={
                                createPublicGameMutation.status === 'pending' ||
                                leaveGameMutation.status === 'pending'
                            }
                        >
                            {isPlayerInQueue ? (
                                <>
                                    <X className={styles.playIcon} />
                                    Leave game
                                </>
                            ) : (
                                <>
                                    <Play className={styles.playIcon} />
                                    Public game
                                </>
                            )}
                        </Button>
                    </div>
                    <div className={styles.playerListContainer}>
                        {Array.from(playersByPublicGameId.entries()).map(([gameId, player]) => (
                            <div key={gameId} className={styles.playerItem}>
                                <div>
                                    <div className={styles.playerName}>{player.name}</div>
                                    <div className={styles.playerRating}>
                                        Rating: {player.rating}
                                    </div>
                                </div>
                                <Button
                                    onClick={() => joinGame(gameId)}
                                    className={styles.joinGameButton}
                                >
                                    Join game
                                </Button>
                            </div>
                        ))}
                    </div>
                </div>
            </CardContent>
        </>
    );
};
