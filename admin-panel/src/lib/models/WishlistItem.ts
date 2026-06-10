import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IWishlistItem extends Document {
    userId: mongoose.Types.ObjectId;
    productId: mongoose.Types.ObjectId;
    addedAt: Date;
}

const WishlistItemSchema = new Schema<IWishlistItem>(
    {
        userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    },
    { timestamps: { createdAt: 'addedAt', updatedAt: false } }
);

WishlistItemSchema.index({ userId: 1 });
WishlistItemSchema.index({ userId: 1, productId: 1 }, { unique: true });

const WishlistItem: Model<IWishlistItem> = mongoose.models.WishlistItem || mongoose.model<IWishlistItem>('WishlistItem', WishlistItemSchema);
export default WishlistItem;
