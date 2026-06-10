import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const lat = searchParams.get('lat');
        const lon = searchParams.get('lon');

        if (!lat || !lon) {
            return NextResponse.json({ error: 'Missing coordinates (lat, lon)' }, { status: 400 });
        }

        // Call OSM Nominatim API with identifying User-Agent headers
        const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}&accept-language=en`;
        
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'ValleyCentiaApp/1.0 (contact@valleycentia.com)',
            },
        });

        if (!response.ok) {
            console.error('Nominatim request failed:', response.statusText);
            return NextResponse.json({ error: 'Failed to retrieve address details from geolocation service.' }, { status: 502 });
        }

        const data = await response.json();
        return NextResponse.json(data);
    } catch (err) {
        console.error('Reverse geocoding error:', err);
        return NextResponse.json({ error: err instanceof Error ? err.message : 'Internal server error' }, { status: 500 });
    }
}
