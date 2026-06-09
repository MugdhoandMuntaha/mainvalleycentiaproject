import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Order from '@/lib/models/Order';

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const tran_id = formData.get('tran_id') as string;

        if (tran_id) {
            await connectToDatabase();
            await Order.findOneAndUpdate(
                { transactionId: tran_id },
                {
                    status: 'cancelled',
                    paymentStatus: 'failed',
                    $push: { statusHistory: { status: 'cancelled', note: 'Payment cancelled by user' } }
                }
            );
        }

        return NextResponse.redirect(new URL('/checkout/cancel', req.url));
    } catch (err) {
        console.error('Payment cancel callback error:', err);
        return NextResponse.redirect(new URL('/checkout/cancel', req.url));
    }
}
