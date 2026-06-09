import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IBrand extends Document {
    _id: mongoose.Types.ObjectId;
    name: string;
    slug: string;
    tagline: string | null;
    description: string | null;
    logoUrl: string | null;
    accentColor: string | null;
    textColor: string | null;
    isActive: boolean;
    sortOrder: number;
    createdAt: Date;
    updatedAt: Date;
}

const BrandSchema = new Schema<IBrand>(
    {
        name: { type: String, required: true, unique: true },
        slug: { type: String, required: true, unique: true },
        tagline: { type: String, default: null },
        description: { type: String, default: null },
        logoUrl: { type: String, default: null },
        accentColor: { type: String, default: null },
        textColor: { type: String, default: null },
        isActive: { type: Boolean, default: true },
        sortOrder: { type: Number, default: 0 },
    },
    { timestamps: true }
);



const Brand: Model<IBrand> = mongoose.models.Brand || mongoose.model<IBrand>('Brand', BrandSchema);
export default Brand;
