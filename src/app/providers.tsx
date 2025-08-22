'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { httpBatchLink, httpSubscriptionLink, loggerLink, splitLink } from '@trpc/client';
import { trpc } from '@/app/utils/trpc';
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import SuperJSON from 'superjson';

interface PlayerContextType {
    playerId: string | null;
    isLoading: boolean;
    error: string | null;
    clearPlayer: () => void;
}

const PlayerContext = createContext<PlayerContextType | undefined>(undefined);

const PLAYER_ID_KEY = 'hiddenQueenPlayerId';

export function Providers({ children }: { children: React.ReactNode }) {
    const [queryClient] = useState(() => new QueryClient());
    const [trpcClient] = useState(() =>
        trpc.createClient({
            links: [
                loggerLink(),
                splitLink({
                    condition: (op) => op.type === 'subscription',
                    true: httpSubscriptionLink({
                        url: `/api/trpc`,
                        transformer: SuperJSON,
                    }),
                    false: httpBatchLink({
                        url: `/api/trpc`,
                        transformer: SuperJSON,
                    }),
                }),
            ],
        })
    );

    return (
        <trpc.Provider client={trpcClient} queryClient={queryClient}>
            <QueryClientProvider client={queryClient}>
                <PlayerProvider>{children}</PlayerProvider>
            </QueryClientProvider>
        </trpc.Provider>
    );
}

export const PlayerProvider = ({ children }: { children: ReactNode }) => {
    const [playerId, setPlayerId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const createPlayerMutation = trpc.createPlayer.useMutation();
    const validatePlayerMutation = trpc.validatePlayer.useMutation();

    useEffect(() => {
        const initializePlayer = async () => {
            try {
                setError(null);

                const storedPlayerId = localStorage.getItem(PLAYER_ID_KEY);
                if (storedPlayerId) {
                    const isValid = await validatePlayerMutation.mutateAsync(storedPlayerId);

                    if (isValid === true) {
                        setPlayerId(storedPlayerId);
                        setIsLoading(false);
                        return;
                    } else {
                        localStorage.removeItem(PLAYER_ID_KEY);
                    }
                }

                const newPlayerId = await createPlayerMutation.mutateAsync();

                localStorage.setItem(PLAYER_ID_KEY, newPlayerId);
                setPlayerId(newPlayerId);
            } catch (err) {
                console.error('Failed to initialize player:', err);
                setError('Failed to initialize player');
            } finally {
                setIsLoading(false);
            }
        };

        initializePlayer();
    }, []);

    const clearPlayer = () => {
        localStorage.removeItem(PLAYER_ID_KEY);
        setPlayerId(null);
        setError(null);
        setIsLoading(true);
        window.location.reload();
    };

    return (
        <PlayerContext.Provider value={{ playerId, isLoading, error, clearPlayer }}>
            {children}
        </PlayerContext.Provider>
    );
};

export const usePlayer = () => {
    const context = useContext(PlayerContext);
    if (context === undefined) {
        throw new Error('usePlayer must be used within a PlayerProvider');
    }
    return context;
};

export const getStoredPlayerId = (): string | null => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(PLAYER_ID_KEY);
};
