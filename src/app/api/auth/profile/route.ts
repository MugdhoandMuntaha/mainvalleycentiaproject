import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectToDatabase from '@/lib/mongodb';
import User from '@/lib/models/User';

export async function PATCH(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
        }

        const userId = (session.user as Record<string, unknown>).id as string;
        const updates = await req.json();

        await connectToDatabase();

        const user = await User.findById(userId);
        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        // Apply profile updates
        if (updates.full_name !== undefined) user.fullName = updates.full_name;
        if (updates.display_name !== undefined) user.displayName = updates.display_name;
        if (updates.phone !== undefined) user.phone = updates.phone;
        if (updates.avatar_url !== undefined) user.avatarUrl = updates.avatar_url;
        if (updates.date_of_birth !== undefined) user.dateOfBirth = updates.date_of_birth;
        if (updates.gender !== undefined) user.gender = updates.gender;

        // Apply password update if provided
        if (updates.password !== undefined) {
            user.password = updates.password;
        }

        await user.save();

        return NextResponse.json({ success: true });
    } catch (err) {
        console.error('Profile update error:', err);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
        }

        const userId = (session.user as Record<string, unknown>).id as string;

        await connectToDatabase();
        const user = await User.findById(userId).lean();

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        return NextResponse.json({
            profile: {
                full_name: user.fullName,
                display_name: user.displayName,
                phone: user.phone,
                avatar_url: user.avatarUrl,
                date_of_birth: user.dateOfBirth,
                gender: user.gender,
                role: user.role,
            },
        });
    } catch (err) {
        console.error('Profile fetch error:', err);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
