import mongoose, { Schema, Document, Model } from 'mongoose';

const SectionProductSchema = new Schema({
    productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    sortOrder: { type: Number, default: 0 },
    customBadgeText: { type: String, default: null },
    customBadgeColor: { type: String, default: null },
}, { _id: false });

export interface ISectionProduct {
    productId: mongoose.Types.ObjectId;
    sortOrder: number;
    customBadgeText: string | null;
    customBadgeColor: string | null;
}

export interface IHomepageSection extends Document {
    _id: mongoose.Types.ObjectId;
    sectionType: string;
    title: string;
    subtitle: string | null;
    badgeText: string | null;
    ctaText: string | null;
    ctaLink: string | null;
    backgroundColor: string | null;
    isActive: boolean;
    sortOrder: number;
    products: ISectionProduct[];
    createdAt: Date;
    updatedAt: Date;
}

const HomepageSectionSchema = new Schema<IHomepageSection>(
    {
        sectionType: {
            type: String,
            enum: ['best_sellers', 'new_launches', 'power_care_duos', 'hero_carousel', 'brands_that_lead', 'visible_change', 'custom'],
            required: true,
        },
        title: { type: String, required: true },
        subtitle: { type: String, default: null },
        badgeText: { type: String, default: null },
        ctaText: { type: String, default: null },
        ctaLink: { type: String, default: null },
        backgroundColor: { type: String, default: null },
        isActive: { type: Boolean, default: true },
        sortOrder: { type: Number, default: 0 },
        products: [SectionProductSchema],
    },
    { timestamps: true }
);

HomepageSectionSchema.index({ isActive: 1, sortOrder: 1 });

const HomepageSection: Model<IHomepageSection> = mongoose.models.HomepageSection || mongoose.model<IHomepageSection>('HomepageSection', HomepageSectionSchema);
export default HomepageSection;
