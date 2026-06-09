import mongoose, { Schema, Document, Model } from 'mongoose';

export interface INavLink extends Document {
    _id: mongoose.Types.ObjectId;
    parentId: mongoose.Types.ObjectId | null;
    label: string;
    href: string;
    highlight: boolean;
    isActive: boolean;
    sortOrder: number;
    linkedCategoryId: mongoose.Types.ObjectId | null;
    createdAt: Date;
    updatedAt: Date;
}

const NavLinkSchema = new Schema<INavLink>(
    {
        parentId: { type: Schema.Types.ObjectId, ref: 'NavLink', default: null },
        label: { type: String, required: true },
        href: { type: String, required: true },
        highlight: { type: Boolean, default: false },
        isActive: { type: Boolean, default: true },
        sortOrder: { type: Number, default: 0 },
        linkedCategoryId: { type: Schema.Types.ObjectId, ref: 'Category', default: null },
    },
    { timestamps: true }
);

NavLinkSchema.index({ isActive: 1, sortOrder: 1 });

const NavLink: Model<INavLink> = mongoose.models.NavLink || mongoose.model<INavLink>('NavLink', NavLinkSchema);
export default NavLink;
