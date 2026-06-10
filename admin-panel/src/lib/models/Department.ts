import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IDepartment extends Document {
    _id: mongoose.Types.ObjectId;
    name: string;
    slug: string;
    iconName: string | null;
    sortOrder: number;
    createdAt: Date;
}

const DepartmentSchema = new Schema<IDepartment>({
    name: { type: String, required: true, unique: true },
    slug: { type: String, required: true, unique: true },
    iconName: { type: String, default: null },
    sortOrder: { type: Number, default: 0 },
}, { timestamps: { createdAt: true, updatedAt: false } });

const Department: Model<IDepartment> = mongoose.models.Department || mongoose.model<IDepartment>('Department', DepartmentSchema);
export default Department;
