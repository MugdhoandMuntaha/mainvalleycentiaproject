import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ICompanyTimeline extends Document {
    year: string;
    event: string;
    sortOrder: number;
    createdAt: Date;
}

const CompanyTimelineSchema = new Schema<ICompanyTimeline>({
    year: { type: String, required: true },
    event: { type: String, required: true },
    sortOrder: { type: Number, default: 0 },
}, { timestamps: { createdAt: true, updatedAt: false } });

const CompanyTimeline: Model<ICompanyTimeline> = mongoose.models.CompanyTimeline || mongoose.model<ICompanyTimeline>('CompanyTimeline', CompanyTimelineSchema);
export default CompanyTimeline;
