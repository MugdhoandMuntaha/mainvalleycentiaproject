import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ISiteSetting extends Document {
    key: string;
    value: Record<string, unknown>;
    description: string | null;
    updatedAt: Date;
}

const SiteSettingSchema = new Schema<ISiteSetting>({
    key: { type: String, required: true, unique: true },
    value: { type: Schema.Types.Mixed, required: true },
    description: { type: String, default: null },
    updatedAt: { type: Date, default: Date.now },
}, { timestamps: false });



const SiteSetting: Model<ISiteSetting> = mongoose.models.SiteSetting || mongoose.model<ISiteSetting>('SiteSetting', SiteSettingSchema);
export default SiteSetting;
