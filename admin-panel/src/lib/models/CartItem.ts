import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ICartItem extends Document {
    userId: mongoose.Types.ObjectId;
    productId: mongoose.Types.ObjectId;
    sizeId: mongoose.Types.ObjectId | null;
    quantity: number;
    addedAt: Date;
    updatedAt: Date;
}

const CartItemSchema = new Schema<ICartItem>(
    {
        userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
        sizeId: { type: Schema.Types.ObjectId, default: null },
        quantity: { type: Number, required: true, default: 1, min: 1, max: 10 },
    },
    { timestamps: { createdAt: 'addedAt', updatedAt: 'updatedAt' } }
);

CartItemSchema.index({ userId: 1 });
CartItemSchema.index({ userId: 1, productId: 1, sizeId: 1 }, { unique: true });

const CartItem: Model<ICartItem> = mongoose.models.CartItem || mongoose.model<ICartItem>('CartItem', CartItemSchema);
export default CartItem;
