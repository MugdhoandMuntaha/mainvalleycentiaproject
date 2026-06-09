import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IAboutContent extends Document {
    sectionKey: string;
    content: unknown;
    updatedAt: Date;
}

const AboutContentSchema = new Schema<IAboutContent>({
    sectionKey: { type: String, required: true, unique: true },
    content: { type: Schema.Types.Mixed, required: true },
    updatedAt: { type: Date, default: Date.now },
}, { timestamps: false });



const AboutContent: Model<IAboutContent> = mongoose.models.AboutContent || mongoose.model<IAboutContent>('AboutContent', AboutContentSchema);
export default AboutContent;
