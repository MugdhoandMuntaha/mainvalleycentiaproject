import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IJobListing extends Document {
    _id: mongoose.Types.ObjectId;
    departmentId: mongoose.Types.ObjectId;
    title: string;
    slug: string;
    description: string;
    responsibilities: string[];
    requirements: string[];
    niceToHaves: string[];
    location: string;
    jobType: 'full_time' | 'part_time' | 'contract' | 'internship';
    experienceRange: string | null;
    salaryMin: number | null;
    salaryMax: number | null;
    salaryCurrency: string;
    isSalaryVisible: boolean;
    status: 'active' | 'paused' | 'closed' | 'filled';
    applyEmail: string;
    applyUrl: string | null;
    publishedAt: Date | null;
    closesAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
}

const JobListingSchema = new Schema<IJobListing>(
    {
        departmentId: { type: Schema.Types.ObjectId, ref: 'Department', required: true },
        title: { type: String, required: true },
        slug: { type: String, required: true, unique: true },
        description: { type: String, required: true },
        responsibilities: [{ type: String }],
        requirements: [{ type: String }],
        niceToHaves: [{ type: String }],
        location: { type: String, required: true },
        jobType: { type: String, enum: ['full_time', 'part_time', 'contract', 'internship'], default: 'full_time' },
        experienceRange: { type: String, default: null },
        salaryMin: { type: Number, default: null },
        salaryMax: { type: Number, default: null },
        salaryCurrency: { type: String, default: 'BDT' },
        isSalaryVisible: { type: Boolean, default: false },
        status: { type: String, enum: ['active', 'paused', 'closed', 'filled'], default: 'active' },
        applyEmail: { type: String, default: 'careers@valleycentia.com' },
        applyUrl: { type: String, default: null },
        publishedAt: { type: Date, default: null },
        closesAt: { type: Date, default: null },
    },
    { timestamps: true }
);

JobListingSchema.index({ departmentId: 1 });
JobListingSchema.index({ status: 1 });


const JobListing: Model<IJobListing> = mongoose.models.JobListing || mongoose.model<IJobListing>('JobListing', JobListingSchema);
export default JobListing;
