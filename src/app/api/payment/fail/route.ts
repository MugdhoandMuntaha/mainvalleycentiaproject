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
                    paymentStatus: 'failed',
                    $push: { statusHistory: { status: 'failed', note: 'Payment failed' } }
                }
            );
        }

        return NextResponse.redirect(new URL('/checkout/fail', req.url));
    } catch (err) {
        console.error('Payment fail callback error:', err);
        return NextResponse.redirect(new URL('/checkout/fail', req.url));
    }
}
