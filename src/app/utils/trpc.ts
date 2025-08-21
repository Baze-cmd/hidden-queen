'use client';

import { createTRPCReact } from '@trpc/react-query';
import type { AppRouter } from '@/app/server/MainRouter';

export const trpc = createTRPCReact<AppRouter>();