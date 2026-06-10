import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IPerk extends Document {
    iconName: string;
    title: string;
    description: string;
    sortOrder: number;
    isActive: boolean;
    createdAt: Date;
}

const PerkSchema = new Schema<IPerk>({
    iconName: { type: String, required: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    sortOrder: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
}, { timestamps: { createdAt: true, updatedAt: false } });

const Perk: Model<IPerk> = mongoose.models.Perk || mongoose.model<IPerk>('Perk', PerkSchema);
export default Perk;
