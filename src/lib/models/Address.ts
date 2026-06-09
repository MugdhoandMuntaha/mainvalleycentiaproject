import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IAddress extends Document {
    _id: mongoose.Types.ObjectId;
    userId: mongoose.Types.ObjectId;
    label: string;
    fullName: string;
    phone: string;
    addressLine1: string;
    addressLine2: string | null;
    city: string;
    state: string;
    postalCode: string;
    country: string;
    landmark: string | null;
    isDefault: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const AddressSchema = new Schema<IAddress>(
    {
        userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        label: { type: String, default: 'Home' },
        fullName: { type: String, required: true },
        phone: { type: String, required: true },
        addressLine1: { type: String, required: true },
        addressLine2: { type: String, default: null },
        city: { type: String, required: true },
        state: { type: String, required: true },
        postalCode: { type: String, required: true },
        country: { type: String, default: 'Bangladesh' },
        landmark: { type: String, default: null },
        isDefault: { type: Boolean, default: false },
    },
    { timestamps: true }
);

AddressSchema.index({ userId: 1 });

const Address: Model<IAddress> = mongoose.models.Address || mongoose.model<IAddress>('Address', AddressSchema);
export default Address;
