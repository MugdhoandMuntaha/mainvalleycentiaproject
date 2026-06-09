import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import User from '@/lib/models/User';

export async function POST(req: NextRequest) {
    try {
        const { email, password, name } = await req.json();

        if (!email || !password) {
            return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
        }

        if (password.length < 6) {
            return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 });
        }

        await connectToDatabase();

        // Check if user already exists
        const existingUser = await User.findOne({ email: email.toLowerCase() });
        if (existingUser) {
            return NextResponse.json({ error: 'An account with this email already exists' }, { status: 409 });
        }

        // Create new user
        const user = await User.create({
            email: email.toLowerCase(),
            password, // Will be hashed by pre-save hook
            fullName: name || null,
            displayName: name || email.split('@')[0],
            provider: 'credentials',
            role: 'customer',
        });

        return NextResponse.json({
            user: {
                id: user._id.toString(),
                email: user.email,
                name: user.fullName || user.displayName,
            },
        });
    } catch (err) {
        console.error('Registration error:', err);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
