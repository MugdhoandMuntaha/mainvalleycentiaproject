import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ICompanyValue extends Document {
    iconName: string;
    title: string;
    description: string;
    sortOrder: number;
    createdAt: Date;
}

const CompanyValueSchema = new Schema<ICompanyValue>({
    iconName: { type: String, required: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    sortOrder: { type: Number, default: 0 },
}, { timestamps: { createdAt: true, updatedAt: false } });

const CompanyValue: Model<ICompanyValue> = mongoose.models.CompanyValue || mongoose.model<ICompanyValue>('CompanyValue', CompanyValueSchema);
export default CompanyValue;
