import { NextResponse } from 'next/server';

export async function GET(request: Request) {
    const host = request.headers.get('host') || 'localhost:3000';

    const protocol =
        request.headers.get('x-forwarded-proto') ||
        (process.env.NODE_ENV === 'production' ? 'https' : 'http');

    const domain = `${protocol}://${host}`;

    return NextResponse.json({
        name: 'Hidden queen chess',
        description: 'I could not find this variant anywhere online so i created it myself',
        domain,
    });
}
