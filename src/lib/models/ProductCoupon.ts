import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IProductCoupon extends Document {
    productId: mongoose.Types.ObjectId;
    couponId: mongoose.Types.ObjectId;
    couponPrice: number | null;
}

const ProductCouponSchema = new Schema<IProductCoupon>(
    {
        productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
        couponId: { type: Schema.Types.ObjectId, ref: 'Coupon', required: true },
        couponPrice: { type: Number, default: null },
    },
    { timestamps: false }
);

ProductCouponSchema.index({ productId: 1, couponId: 1 }, { unique: true });

const ProductCoupon: Model<IProductCoupon> = mongoose.models.ProductCoupon || mongoose.model<IProductCoupon>('ProductCoupon', ProductCouponSchema);
export default ProductCoupon;
