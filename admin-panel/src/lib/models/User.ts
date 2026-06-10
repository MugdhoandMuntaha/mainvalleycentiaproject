import mongoose, { Schema, Document, Model } from 'mongoose';
import bcrypt from 'bcryptjs';

export type UserRole = 'customer' | 'admin';

export interface IUser extends Document {
    _id: mongoose.Types.ObjectId;
    email: string;
    password?: string; // Optional for OAuth users
    fullName: string | null;
    displayName: string | null;
    phone: string | null;
    avatarUrl: string | null;
    dateOfBirth: Date | null;
    gender: string | null;
    role: UserRole;
    isEmailVerified: boolean;
    isPhoneVerified: boolean;
    provider: 'credentials' | 'google';
    createdAt: Date;
    updatedAt: Date;
    comparePassword(candidatePassword: string): Promise<boolean>;
}

const UserSchema = new Schema<IUser>(
    {
        email: { type: String, required: true, unique: true, lowercase: true, trim: true },
        password: { type: String, select: false }, // Excluded from queries by default
        fullName: { type: String, default: null },
        displayName: { type: String, default: null },
        phone: { type: String, default: null },
        avatarUrl: { type: String, default: null },
        dateOfBirth: { type: Date, default: null },
        gender: { type: String, default: null },
        role: { type: String, enum: ['customer', 'admin'], default: 'customer', lowercase: true, trim: true },
        isEmailVerified: { type: Boolean, default: false },
        isPhoneVerified: { type: Boolean, default: false },
        provider: { type: String, enum: ['credentials', 'google'], default: 'credentials' },
    },
    { timestamps: true }
);

// Index
UserSchema.index({ phone: 1 });

// Hash password before saving
UserSchema.pre('save', async function (next) {
    if (!this.isModified('password') || !this.password) return next();
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

// Compare password method
UserSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
    if (!this.password) return false;
    return bcrypt.compare(candidatePassword, this.password);
};

const User: Model<IUser> = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
export default User;
