import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IHeroSlide extends Document {
    _id: mongoose.Types.ObjectId;
    title: string;
    subtitle: string | null;
    ctaText: string | null;
    ctaLink: string | null;
    imageUrl: string;
    mobileImageUrl: string | null;
    imageAlt: string | null;
    backgroundColor: string | null;
    textColor: string;
    isActive: boolean;
    sortOrder: number;
    startsAt: Date | null;
    expiresAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
}

const HeroSlideSchema = new Schema<IHeroSlide>(
    {
        title: { type: String, required: true },
        subtitle: { type: String, default: null },
        ctaText: { type: String, default: null },
        ctaLink: { type: String, default: null },
        imageUrl: { type: String, required: true },
        mobileImageUrl: { type: String, default: null },
        imageAlt: { type: String, default: null },
        backgroundColor: { type: String, default: null },
        textColor: { type: String, default: '#ffffff' },
        isActive: { type: Boolean, default: true },
        sortOrder: { type: Number, default: 0 },
        startsAt: { type: Date, default: null },
        expiresAt: { type: Date, default: null },
    },
    { timestamps: true }
);

HeroSlideSchema.index({ isActive: 1, sortOrder: 1 });

const HeroSlide: Model<IHeroSlide> = mongoose.models.HeroSlide || mongoose.model<IHeroSlide>('HeroSlide', HeroSlideSchema);
export default HeroSlide;
