import { fetchRequestHandler } from '@trpc/server/adapters/fetch';
import { appRouter } from '@/app/server/MainRouter';

const handler = (req: Request) => {
  return fetchRequestHandler({
    router: appRouter,
    req,
    endpoint: '/api/trpc',
  });
};

export { handler as GET, handler as POST };