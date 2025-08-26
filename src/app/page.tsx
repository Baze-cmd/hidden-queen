'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Crown, Loader as LoaderIcon } from 'lucide-react';
import { QueueList } from '@/components/QueueList/QueueList';
import { BoardComponent } from '@/components/BoardComponent/BoardComponent';
import { boardStates } from './BoardStates';
import { usePlayer } from '@/app/providers';
import styles from './page.module.css';

export default function HiddenQueenPage() {
    const [currentBoardIndex, setCurrentStateIndex] = useState(0);
    const { isLoading: isPlayerLoading, error } = usePlayer();

    useEffect(() => {
        if (!isPlayerLoading && !error) {
            const timer = setInterval(() => {
                setCurrentStateIndex((prev) => (prev + 1) % boardStates.length);
            }, 1000);
            return () => clearInterval(timer);
        }
    }, [isPlayerLoading, error]);

    const currentBoard = boardStates[currentBoardIndex];

    function tileClick() {}

    if (isPlayerLoading) {
        return (
            <div className={styles.page}>
                <div className={styles.container}>
                    <div className={styles.header}>
                        <div className={styles.headerIcons}>
                            <Crown className={styles.iconYellow} />
                            <h1 className={styles.title}>Hidden Queen</h1>
                            <Crown className={styles.iconYellow} />
                        </div>
                        <LoaderIcon className={`${styles.spinner} animate-spin`} />
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className={styles.page}>
                <div className={styles.container}>
                    <div className={styles.header}>
                        <div className={styles.headerIcons}>
                            <Crown className={styles.iconYellow} />
                            <h1 className={styles.title}>Hidden Queen</h1>
                            <Crown className={styles.iconYellow} />
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.page}>
            <div className={styles.container}>
                <div className={styles.header}>
                    <div className={styles.headerIcons}>
                        <Crown className={styles.iconYellow} />
                        <h1 className={styles.title}>Hidden Queen</h1>
                        <Crown className={styles.iconYellow} />
                    </div>
                    <p className={styles.subtitle}>
                        Choose a pawn to be your secret queen. Keep it hidden until the perfect
                        moment to strike!
                    </p>
                </div>
                <div className={styles.grid}>
                    <div className={styles.col1}>
                        <Card className={styles.cardDark}>
                            <QueueList />
                        </Card>
                    </div>
                    <div className={styles.col2}>
                        <Card className={styles.cardDark}>
                            <CardContent className={styles.cardContent}>
                                <BoardComponent
                                    board={currentBoard}
                                    isWhite={true}
                                    onTileClick={tileClick}
                                />
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
}
