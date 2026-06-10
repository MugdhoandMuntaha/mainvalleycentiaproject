import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ICategory extends Document {
    _id: mongoose.Types.ObjectId;
    parentId: mongoose.Types.ObjectId | null;
    name: string;
    slug: string;
    description: string | null;
    imageUrl: string | null;
    iconName: string | null;
    isActive: boolean;
    sortOrder: number;
    createdAt: Date;
    updatedAt: Date;
}

const CategorySchema = new Schema<ICategory>(
    {
        parentId: { type: Schema.Types.ObjectId, ref: 'Category', default: null },
        name: { type: String, required: true },
        slug: { type: String, required: true, unique: true },
        description: { type: String, default: null },
        imageUrl: { type: String, default: null },
        iconName: { type: String, default: null },
        isActive: { type: Boolean, default: true },
        sortOrder: { type: Number, default: 0 },
    },
    { timestamps: true }
);


CategorySchema.index({ parentId: 1 });

const Category: Model<ICategory> = mongoose.models.Category || mongoose.model<ICategory>('Category', CategorySchema);
export default Category;
