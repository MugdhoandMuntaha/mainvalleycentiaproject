import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IVisibleChange extends Document {
    _id: mongoose.Types.ObjectId;
    productId: mongoose.Types.ObjectId | null;
    beforeImage: string;
    afterImage: string;
    beforeLabel: string;
    afterLabel: string;
    isActive: boolean;
    sortOrder: number;
    createdAt: Date;
    updatedAt: Date;
}

const VisibleChangeSchema = new Schema<IVisibleChange>(
    {
        productId: { type: Schema.Types.ObjectId, ref: 'Product', default: null },
        beforeImage: { type: String, required: true },
        afterImage: { type: String, required: true },
        beforeLabel: { type: String, default: 'Day 1' },
        afterLabel: { type: String, default: 'Day 30' },
        isActive: { type: Boolean, default: true },
        sortOrder: { type: Number, default: 0 },
    },
    { timestamps: true }
);

VisibleChangeSchema.index({ isActive: 1, sortOrder: 1 });

const VisibleChange: Model<IVisibleChange> = mongoose.models.VisibleChange || mongoose.model<IVisibleChange>('VisibleChange', VisibleChangeSchema);
export default VisibleChange;
