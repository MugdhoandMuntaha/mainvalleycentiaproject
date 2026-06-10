import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ICoupon extends Document {
    _id: mongoose.Types.ObjectId;
    code: string;
    description: string | null;
    discountType: 'percentage' | 'fixed_amount' | 'free_shipping';
    discountValue: number;
    minimumOrderValue: number;
    maxDiscountAmount: number | null;
    usageLimit: number | null;
    usageCount: number;
    perUserLimit: number;
    isActive: boolean;
    startsAt: Date;
    expiresAt: Date | null;
    applicableBrands: mongoose.Types.ObjectId[];
    applicableCategories: mongoose.Types.ObjectId[];
    createdAt: Date;
    updatedAt: Date;
}

const CouponSchema = new Schema<ICoupon>(
    {
        code: { type: String, required: true, unique: true, uppercase: true, trim: true },
        description: { type: String, default: null },
        discountType: { type: String, enum: ['percentage', 'fixed_amount', 'free_shipping'], required: true },
        discountValue: { type: Number, required: true },
        minimumOrderValue: { type: Number, default: 0 },
        maxDiscountAmount: { type: Number, default: null },
        usageLimit: { type: Number, default: null },
        usageCount: { type: Number, default: 0 },
        perUserLimit: { type: Number, default: 1 },
        isActive: { type: Boolean, default: true },
        startsAt: { type: Date, default: Date.now },
        expiresAt: { type: Date, default: null },
        applicableBrands: [{ type: Schema.Types.ObjectId, ref: 'Brand' }],
        applicableCategories: [{ type: Schema.Types.ObjectId, ref: 'Category' }],
    },
    { timestamps: true }
);



const Coupon: Model<ICoupon> = mongoose.models.Coupon || mongoose.model<ICoupon>('Coupon', CouponSchema);
export default Coupon;
