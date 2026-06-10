import mongoose, { Schema, Document, Model } from 'mongoose';

// ── Sub-schemas ──────────────────────────────────────────────────────────

const OrderItemSchema = new Schema(
    {
        productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
        productName: { type: String, required: true },
        productImage: { type: String, default: null },
        productSlug: { type: String, default: null },
        sizeLabel: { type: String, default: null },
        sizeId: { type: Schema.Types.ObjectId, default: null },
        unitPrice: { type: Number, required: true },
        originalPrice: { type: Number, default: null },
        quantity: { type: Number, required: true, min: 1 },
        totalPrice: { type: Number, required: true },
    },
    { _id: true, timestamps: false }
);

const StatusHistorySchema = new Schema(
    {
        status: { type: String, required: true },
        note: { type: String, default: null },
        changedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
        createdAt: { type: Date, default: Date.now },
    },
    { _id: true }
);

export interface IOrderItem {
    _id: mongoose.Types.ObjectId;
    productId: mongoose.Types.ObjectId;
    productName: string;
    productImage: string | null;
    productSlug: string | null;
    sizeLabel: string | null;
    sizeId: mongoose.Types.ObjectId | null;
    unitPrice: number;
    originalPrice: number | null;
    quantity: number;
    totalPrice: number;
}

export interface IStatusHistory {
    _id: mongoose.Types.ObjectId;
    status: string;
    note: string | null;
    changedBy: mongoose.Types.ObjectId | null;
    createdAt: Date;
}

export interface IOrder extends Document {
    _id: mongoose.Types.ObjectId;
    orderNumber: string;
    userId: mongoose.Types.ObjectId | null;
    status: string;
    paymentStatus: string;
    paymentMethod: string | null;
    subtotal: number;
    discountAmount: number;
    shippingCost: number;
    tax: number;
    total: number;
    couponId: mongoose.Types.ObjectId | null;
    couponCode: string | null;
    currency: string;
    // Shipping address snapshot
    shippingName: string | null;
    shippingPhone: string | null;
    shippingAddressLine1: string | null;
    shippingAddressLine2: string | null;
    shippingCity: string | null;
    shippingState: string | null;
    shippingPostalCode: string | null;
    shippingCountry: string;
    // Billing address snapshot
    billingName: string | null;
    billingPhone: string | null;
    billingAddressLine1: string | null;
    billingAddressLine2: string | null;
    billingCity: string | null;
    billingState: string | null;
    billingPostalCode: string | null;
    billingCountry: string;

    notes: string | null;
    trackingNumber: string | null;
    trackingUrl: string | null;
    estimatedDelivery: Date | null;
    deliveredAt: Date | null;
    cancelledAt: Date | null;
    cancellationReason: string | null;
    transactionId: string | null;
    sslSessionKey: string | null;
    sslValId: string | null;

    orderItems: IOrderItem[];
    statusHistory: IStatusHistory[];

    createdAt: Date;
    updatedAt: Date;
}

const OrderSchema = new Schema<IOrder>(
    {
        orderNumber: { type: String, required: true, unique: true },
        userId: { type: Schema.Types.ObjectId, ref: 'User', required: false, default: null },
        status: {
            type: String,
            enum: ['pending', 'confirmed', 'processing', 'shipped', 'in_transit', 'delivered', 'cancelled', 'refunded', 'return_requested', 'returned'],
            default: 'pending',
        },
        paymentStatus: {
            type: String,
            enum: ['pending', 'authorized', 'captured', 'failed', 'refunded', 'partially_refunded'],
            default: 'pending',
        },
        paymentMethod: {
            type: String,
            enum: ['credit_card', 'debit_card', 'upi', 'net_banking', 'wallet', 'cod', 'emi', null],
            default: null,
        },
        subtotal: { type: Number, required: true, default: 0 },
        discountAmount: { type: Number, default: 0 },
        shippingCost: { type: Number, default: 0 },
        tax: { type: Number, default: 0 },
        total: { type: Number, required: true, default: 0 },
        couponId: { type: Schema.Types.ObjectId, ref: 'Coupon', default: null },
        couponCode: { type: String, default: null },
        currency: { type: String, default: 'BDT' },

        shippingName: { type: String, default: null },
        shippingPhone: { type: String, default: null },
        shippingAddressLine1: { type: String, default: null },
        shippingAddressLine2: { type: String, default: null },
        shippingCity: { type: String, default: null },
        shippingState: { type: String, default: null },
        shippingPostalCode: { type: String, default: null },
        shippingCountry: { type: String, default: 'Bangladesh' },

        billingName: { type: String, default: null },
        billingPhone: { type: String, default: null },
        billingAddressLine1: { type: String, default: null },
        billingAddressLine2: { type: String, default: null },
        billingCity: { type: String, default: null },
        billingState: { type: String, default: null },
        billingPostalCode: { type: String, default: null },
        billingCountry: { type: String, default: 'Bangladesh' },

        notes: { type: String, default: null },
        trackingNumber: { type: String, default: null },
        trackingUrl: { type: String, default: null },
        estimatedDelivery: { type: Date, default: null },
        deliveredAt: { type: Date, default: null },
        cancelledAt: { type: Date, default: null },
        cancellationReason: { type: String, default: null },
        transactionId: { type: String, default: null },
        sslSessionKey: { type: String, default: null },
        sslValId: { type: String, default: null },

        orderItems: [OrderItemSchema],
        statusHistory: [StatusHistorySchema],
    },
    { timestamps: true }
);

OrderSchema.index({ userId: 1 });

OrderSchema.index({ status: 1 });
OrderSchema.index({ createdAt: -1 });
OrderSchema.index({ transactionId: 1 });

const Order: Model<IOrder> = mongoose.models.Order || mongoose.model<IOrder>('Order', OrderSchema);
export default Order;
