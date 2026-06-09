import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IJobApplication extends Document {
    _id: mongoose.Types.ObjectId;
    jobId: mongoose.Types.ObjectId;
    applicantName: string;
    applicantEmail: string;
    applicantPhone: string | null;
    resumeUrl: string | null;
    coverLetter: string | null;
    linkedinUrl: string | null;
    portfolioUrl: string | null;
    status: 'received' | 'screening' | 'interview' | 'offer' | 'hired' | 'rejected' | 'withdrawn';
    notes: string | null;
    createdAt: Date;
    updatedAt: Date;
}

const JobApplicationSchema = new Schema<IJobApplication>(
    {
        jobId: { type: Schema.Types.ObjectId, ref: 'JobListing', required: true },
        applicantName: { type: String, required: true },
        applicantEmail: { type: String, required: true },
        applicantPhone: { type: String, default: null },
        resumeUrl: { type: String, default: null },
        coverLetter: { type: String, default: null },
        linkedinUrl: { type: String, default: null },
        portfolioUrl: { type: String, default: null },
        status: { type: String, enum: ['received', 'screening', 'interview', 'offer', 'hired', 'rejected', 'withdrawn'], default: 'received' },
        notes: { type: String, default: null },
    },
    { timestamps: true }
);

JobApplicationSchema.index({ jobId: 1 });
JobApplicationSchema.index({ applicantEmail: 1 });

const JobApplication: Model<IJobApplication> = mongoose.models.JobApplication || mongoose.model<IJobApplication>('JobApplication', JobApplicationSchema);
export default JobApplication;
