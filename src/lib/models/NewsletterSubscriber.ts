import mongoose, { Schema, Document, Model } from 'mongoose';

export interface INewsletterSubscriber extends Document {
    email: string;
    fullName: string | null;
    isSubscribed: boolean;
    subscribedAt: Date;
    unsubscribedAt: Date | null;
    source: string;
}

const NewsletterSubscriberSchema = new Schema<INewsletterSubscriber>({
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    fullName: { type: String, default: null },
    isSubscribed: { type: Boolean, default: true },
    subscribedAt: { type: Date, default: Date.now },
    unsubscribedAt: { type: Date, default: null },
    source: { type: String, default: 'footer' },
}, { timestamps: false });

NewsletterSubscriberSchema.index({ email: 1 }, { unique: true });

const NewsletterSubscriber: Model<INewsletterSubscriber> = mongoose.models.NewsletterSubscriber || mongoose.model<INewsletterSubscriber>('NewsletterSubscriber', NewsletterSubscriberSchema);
export default NewsletterSubscriber;
