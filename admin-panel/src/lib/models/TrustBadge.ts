import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ITrustBadge extends Document {
    _id: mongoose.Types.ObjectId;
    iconName: string;
    label: string;
    description: string | null;
    isActive: boolean;
    sortOrder: number;
}

const TrustBadgeSchema = new Schema<ITrustBadge>({
    iconName: { type: String, required: true },
    label: { type: String, required: true },
    description: { type: String, default: null },
    isActive: { type: Boolean, default: true },
    sortOrder: { type: Number, default: 0 },
}, { timestamps: false });

const TrustBadge: Model<ITrustBadge> = mongoose.models.TrustBadge || mongoose.model<ITrustBadge>('TrustBadge', TrustBadgeSchema);
export default TrustBadge;
