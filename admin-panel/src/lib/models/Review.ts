import mongoose, { Schema, Document, Model } from 'mongoose';

const ReviewImageSchema = new Schema({
    url: { type: String, required: true },
    altText: { type: String, default: null },
    sortOrder: { type: Number, default: 0 },
}, { _id: true });

export interface IReviewImage {
    _id: mongoose.Types.ObjectId;
    url: string;
    altText: string | null;
    sortOrder: number;
}

export interface IReview extends Document {
    _id: mongoose.Types.ObjectId;
    productId: mongoose.Types.ObjectId;
    userId: mongoose.Types.ObjectId;
    orderItemId: mongoose.Types.ObjectId | null;
    rating: number;
    title: string | null;
    body: string | null;
    isVerified: boolean;
    isApproved: boolean;
    helpfulCount: number;
    images: IReviewImage[];
    createdAt: Date;
    updatedAt: Date;
}

const ReviewSchema = new Schema<IReview>(
    {
        productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
        userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        orderItemId: { type: Schema.Types.ObjectId, default: null },
        rating: { type: Number, required: true, min: 1, max: 5 },
        title: { type: String, default: null },
        body: { type: String, default: null },
        isVerified: { type: Boolean, default: false },
        isApproved: { type: Boolean, default: false },
        helpfulCount: { type: Number, default: 0 },
        images: [ReviewImageSchema],
    },
    { timestamps: true }
);

ReviewSchema.index({ productId: 1 });
ReviewSchema.index({ userId: 1 });
ReviewSchema.index({ productId: 1, rating: 1 });
ReviewSchema.index({ productId: 1, userId: 1, orderItemId: 1 }, { unique: true });

const Review: Model<IReview> = mongoose.models.Review || mongoose.model<IReview>('Review', ReviewSchema);
export default Review;
