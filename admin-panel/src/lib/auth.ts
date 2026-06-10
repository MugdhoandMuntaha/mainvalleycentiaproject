import { type AuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
import connectToDatabase from '@/lib/mongodb';
import User from '@/lib/models/User';

export const authOptions: AuthOptions = {
    providers: [
        // Email + Password
        CredentialsProvider({
            name: 'credentials',
            credentials: {
                email: { label: 'Email', type: 'email' },
                password: { label: 'Password', type: 'password' },
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) {
                    throw new Error('Please enter email and password');
                }

                await connectToDatabase();

                // Need to explicitly select password since it's excluded by default
                const user = await User.findOne({ email: credentials.email.toLowerCase() }).select('+password');

                if (!user) {
                    throw new Error('No account found with this email');
                }

                if (!user.password) {
                    throw new Error('This account uses Google sign-in. Please use Google to log in.');
                }

                const isValid = await user.comparePassword(credentials.password);
                if (!isValid) {
                    throw new Error('Invalid password');
                }

                return {
                    id: user._id.toString(),
                    email: user.email,
                    name: user.fullName || user.displayName || user.email,
                    image: user.avatarUrl,
                };
            },
        }),

        // Google OAuth (only if credentials are configured)
        ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
            ? [
                GoogleProvider({
                    clientId: process.env.GOOGLE_CLIENT_ID,
                    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
                }),
            ]
            : []),
    ],

    session: {
        strategy: 'jwt' as const,
        maxAge: 30 * 24 * 60 * 60, // 30 days
    },

    pages: {
        signIn: '/auth',
        error: '/auth',
    },

    callbacks: {
        async signIn({ user, account }) {
            if (account?.provider === 'google') {
                await connectToDatabase();

                // Find or create user for Google sign-in
                const existingUser = await User.findOne({ email: user.email?.toLowerCase() });

                if (!existingUser) {
                    const newUser = await User.create({
                        email: user.email?.toLowerCase(),
                        fullName: user.name || null,
                        displayName: user.name || user.email?.split('@')[0] || null,
                        avatarUrl: user.image || null,
                        provider: 'google',
                        isEmailVerified: true,
                        role: 'customer',
                    });
                    // Attach the MongoDB _id to the user object for the jwt callback
                    user.id = newUser._id.toString();
                } else {
                    user.id = existingUser._id.toString();
                    // Update avatar if changed
                    if (user.image && user.image !== existingUser.avatarUrl) {
                        existingUser.avatarUrl = user.image;
                        await existingUser.save();
                    }
                }
            }
            return true;
        },

        async jwt({ token, user, trigger, session }) {
            // On initial sign-in, attach user data
            if (user) {
                await connectToDatabase();
                const dbUser = await User.findOne({ email: user.email?.toLowerCase() }).select('_id').lean();
                if (dbUser) {
                    token.userId = dbUser._id.toString();
                } else {
                    token.userId = user.id;
                }
            }

            // Fetch role from database (cached in token, refreshed on update trigger)
            if (token.userId && (!token.role || trigger === 'update')) {
                await connectToDatabase();
                const dbUser = await User.findById(token.userId).select('role fullName displayName avatarUrl createdAt').lean();
                if (dbUser) {
                    token.role = (dbUser.role || 'customer').toLowerCase();
                    token.fullName = dbUser.fullName;
                    token.displayName = dbUser.displayName;
                    token.avatarUrl = dbUser.avatarUrl;
                    token.createdAt = dbUser.createdAt ? dbUser.createdAt.toISOString() : null;
                }
            }

            // Allow session updates to propagate
            if (trigger === 'update' && session) {
                if (session.role) token.role = session.role;
            }

            return token;
        },

        async session({ session, token }) {
            if (session.user) {
                (session.user as Record<string, unknown>).id = token.userId as string;
                (session.user as Record<string, unknown>).role = (token.role as string) || 'customer';
                (session.user as Record<string, unknown>).fullName = token.fullName || null;
                (session.user as Record<string, unknown>).displayName = token.displayName || null;
                (session.user as Record<string, unknown>).avatarUrl = token.avatarUrl || null;
                (session.user as Record<string, unknown>).createdAt = token.createdAt || null;
            }
            return session;
        },
    },

    secret: process.env.NEXTAUTH_SECRET,
};
