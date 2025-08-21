import { initTRPC } from '@trpc/server';
import SuperJSON from 'superjson';
import { EventEmitter } from 'events';
import { ZodError } from 'zod';

export const ee = new EventEmitter();

/**
 * Initialization of tRPC backend
 * Should be done only once per backend!
 */
export const t = initTRPC.create({
    transformer: SuperJSON,
    errorFormatter(opts) {
        const { shape, error } = opts;
        return {
            ...shape,
            data: {
                ...shape.data,
                zodError:
                    error.code === 'BAD_REQUEST' && error.cause instanceof ZodError
                        ? error.cause.flatten()
                        : null,
            },
        };
    },
});

export const publicProcedure = t.procedure;
export const router = t.router;
export const middleware = t.middleware;
export const mergeRouters = t.mergeRouters;
