import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Order from '@/lib/models/Order';
import { updateStockForOrder } from '@/lib/db/queries';

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const tran_id = formData.get('tran_id') as string;
        const val_id = formData.get('val_id') as string;
        const status = formData.get('status') as string;

        if (!tran_id) {
            return NextResponse.redirect(new URL('/checkout/fail', req.url));
        }

        await connectToDatabase();

        if (status === 'VALID' || status === 'VALIDATED') {
            let order = await Order.findOneAndUpdate(
                { transactionId: tran_id, status: 'pending' },
                {
                    status: 'confirmed',
                    paymentStatus: 'captured',
                    sslValId: val_id || null,
                    $push: { statusHistory: { status: 'confirmed', note: 'Payment validated by SSLCommerz' } }
                },
                { new: true }
            );

            if (order) {
                // Order is confirmed for the first time -> update stock
                await updateStockForOrder(order.orderItems);
            } else {
                // Already confirmed (e.g. via IPN/success overlap) -> fetch it
                order = await Order.findOne({ transactionId: tran_id });
            }

            const orderNumber = order?.orderNumber || '';
            return NextResponse.redirect(
                new URL(`/checkout/success?order=${orderNumber}`, req.url)
            );
        }

        return NextResponse.redirect(new URL('/checkout/fail', req.url));
    } catch (err) {
        console.error('Payment success callback error:', err);
        return NextResponse.redirect(new URL('/checkout/fail', req.url));
    }
}
