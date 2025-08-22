import { NextResponse } from 'next/server';

export async function GET(request: Request) {
    const host = request.headers.get('host') || 'localhost:3000';

    const protocol =
        request.headers.get('x-forwarded-proto') ||
        (process.env.NODE_ENV === 'production' ? 'https' : 'http');

    const domain = `${protocol}://${host}`;

    return NextResponse.json({
        name: 'My App',
        description: 'This is a simple Next.js app that returns info.',
        domain,
    });
}
