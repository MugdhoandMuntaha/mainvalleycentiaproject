import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import connectToDatabase from '@/lib/mongodb';
import Order from '@/lib/models/Order';

const store_id = process.env.SSLCOMMERZ_STORE_ID || '';
const store_passwd = process.env.SSLCOMMERZ_STORE_PASSWORD || '';
const is_sandbox = process.env.SSLCOMMERZ_IS_SANDBOX === 'true';
const base_url = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

const SSLCOMMERZ_API = is_sandbox
    ? 'https://sandbox.sslcommerz.com/gwprocess/v4/api.php'
    : 'https://securepay.sslcommerz.com/gwprocess/v4/api.php';

function generateOrderNumber() {
    const ts = Date.now().toString(36).toUpperCase();
    const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `VC-${ts}-${rand}`;
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { userId, items, address, subtotal, shipping, tax, total } = body;

        const isGuest = !userId || userId === 'guest';

        if ((!userId && !isGuest) || !items?.length || !address || !total) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        await connectToDatabase();
        const orderNumber = generateOrderNumber();
        const tran_id = `TXN_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

        const orderItems = items.map((item: { id: string; name: string; image: string; slug: string; size?: string; quantity: number; price: number }) => ({
            productId: new mongoose.Types.ObjectId(item.id),
            productName: item.name,
            productImage: item.image,
            productSlug: item.slug,
            sizeLabel: item.size || null,
            unitPrice: item.price,
            quantity: item.quantity,
            totalPrice: item.price * item.quantity,
        }));

        // 1. Create order in DB
        const order = await Order.create({
            userId: isGuest ? null : new mongoose.Types.ObjectId(userId),
            orderNumber: orderNumber,
            shippingName: address.full_name,
            shippingPhone: address.phone,
            shippingAddressLine1: address.address_line_1,
            shippingAddressLine2: address.address_line_2 || null,
            shippingCity: address.city,
            shippingState: address.state,
            shippingPostalCode: address.postal_code,
            shippingCountry: address.country || 'Bangladesh',
            subtotal,
            shippingCost: shipping,
            tax,
            total,
            status: 'pending',
            paymentStatus: 'pending',
            paymentMethod: 'credit_card',
            transactionId: tran_id,
            orderItems,
            statusHistory: [{ status: 'pending', note: 'Order initiated' }],
        });

        if (!order) {
            return NextResponse.json({ error: 'Failed to create order' }, { status: 500 });
        }

        // 2. Initiate SSLCommerz session (direct API call — no library needed)
        const sslParams = new URLSearchParams({
            store_id,
            store_passwd,
            total_amount: String(total),
            currency: 'BDT',
            tran_id,
            success_url: `${base_url}/api/payment/success`,
            fail_url: `${base_url}/api/payment/fail`,
            cancel_url: `${base_url}/api/payment/cancel`,
            ipn_url: `${base_url}/api/payment/success`,
            shipping_method: 'Courier',
            product_name: items.map((i: { name: string }) => i.name).join(', ').substring(0, 200),
            product_category: 'Beauty & Personal Care',
            product_profile: 'physical-goods',
            cus_name: address.full_name,
            cus_email: body.email || 'customer@valleycentia.com',
            cus_add1: address.address_line_1,
            cus_add2: address.address_line_2 || '',
            cus_city: address.city,
            cus_state: address.state,
            cus_postcode: address.postal_code,
            cus_country: address.country || 'Bangladesh',
            cus_phone: address.phone,
            ship_name: address.full_name,
            ship_add1: address.address_line_1,
            ship_add2: address.address_line_2 || '',
            ship_city: address.city,
            ship_state: address.state,
            ship_postcode: address.postal_code,
            ship_country: address.country || 'Bangladesh',
        });

        const sslResponse = await fetch(SSLCOMMERZ_API, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: sslParams.toString(),
        });

        const apiResponse = await sslResponse.json();

        if (apiResponse?.GatewayPageURL) {
            // Save session key
            order.sslSessionKey = apiResponse.sessionkey;
            await order.save();

            return NextResponse.json({
                url: apiResponse.GatewayPageURL,
                orderNumber,
            });
        } else {
            console.error('SSLCommerz init failed:', apiResponse);
            return NextResponse.json({ error: apiResponse?.failedreason || 'Payment gateway error' }, { status: 500 });
        }
    } catch (err) {
        console.error('Payment init error:', err);
        return NextResponse.json({ error: err instanceof Error ? err.message : 'Internal server error' }, { status: 500 });
    }
}
