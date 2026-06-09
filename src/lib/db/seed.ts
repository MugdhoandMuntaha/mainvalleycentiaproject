import { loadEnvConfig } from '@next/env';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

// Load environment variables from .env.local
const projectDir = process.cwd();
loadEnvConfig(projectDir);

import connectToDatabase from '../mongodb';
import {
    Brand,
    Category,
    Department,
    Coupon,
    TrustBadge,
    CompanyTimeline,
    CompanyValue,
    Perk,
    SiteSetting,
    HeroSlide,
    HomepageSection,
    AboutContent,
    User
} from '../models';

async function seed() {
    console.log('Connecting to database...');
    await connectToDatabase();
    console.log('Connected.');

    // 1. Seed Admin User
    console.log('Seeding Admin User...');
    const adminEmail = 'admin@valleycentia.com';
    await User.deleteOne({ email: adminEmail });
    await User.create({
        fullName: 'Admin User',
        displayName: 'Admin',
        email: adminEmail,
        password: 'admin123',
        role: 'admin',
        isEmailVerified: true,
        provider: 'credentials'
    });
    console.log('Admin user seeded: admin@valleycentia.com / admin123');

    // 2. Seed Brands
    console.log('Seeding Brands...');
    await Brand.deleteMany({});
    const brandsData = [
        {
            name: 'Bare Anatomy',
            slug: 'bare-anatomy',
            tagline: 'Personalized hair & skin science',
            description: "India's first personalized beauty brand. Every product is tailored to your unique hair and skin profile.",
            accentColor: '#c9a96e',
            textColor: '#1a1512',
            isActive: true,
            sortOrder: 1
        },
        {
            name: 'Chemist at Play',
            slug: 'chemist-at-play',
            tagline: 'Actives that actually work',
            description: 'Clinical-grade active ingredients at honest prices. AHAs, BHAs, Niacinamide, Retinol.',
            accentColor: '#6ec9b0',
            textColor: '#121a17',
            isActive: true,
            sortOrder: 2
        },
        {
            name: 'Sun Scoop',
            slug: 'sun-scoop',
            tagline: 'Everyday sun protection, reimagined',
            description: "Lightweight, invisible sunscreens that you'll actually want to wear.",
            accentColor: '#f5c518',
            textColor: '#1a1812',
            isActive: true,
            sortOrder: 3
        }
    ];
    await Brand.create(brandsData);
    console.log('Brands seeded.');

    // 3. Seed Categories
    console.log('Seeding Categories...');
    await Category.deleteMany({});
    
    // Parent Categories
    const parents = [
        { name: 'Hair Care', slug: 'hair-care', description: 'Everything your hair needs', iconName: 'Scissors', isActive: true },
        { name: 'Face Care', slug: 'face-care', description: 'Glow from within', iconName: 'Sparkles', isActive: true },
        { name: 'Body Care', slug: 'body-care', description: 'Nourish your skin head to toe', iconName: 'Heart', isActive: true },
        { name: 'Sun Care', slug: 'sun-care', description: 'Shield your skin every day', iconName: 'Sun', isActive: true }
    ];

    const seededParents = await Category.create(parents);
    const parentMap: Record<string, string> = {};
    seededParents.forEach(p => {
        parentMap[p.slug] = String(p._id);
    });

    // Subcategories
    const subCategories = [
        // Hair Care
        { parentSlug: 'hair-care', name: 'Shampoo', slug: 'shampoo', description: 'Cleanse and nourish' },
        { parentSlug: 'hair-care', name: 'Conditioner', slug: 'conditioner', description: 'Smooth and hydrate' },
        { parentSlug: 'hair-care', name: 'Hair Oil', slug: 'hair-oil', description: 'Deep nourishment' },
        { parentSlug: 'hair-care', name: 'Hair Serum', slug: 'hair-serum', description: 'Repair and protect' },
        { parentSlug: 'hair-care', name: 'Hair Mask', slug: 'hair-mask', description: 'Intensive treatment' },
        
        // Face Care
        { parentSlug: 'face-care', name: 'Face Wash', slug: 'face-wash', description: 'Gentle daily cleansing' },
        { parentSlug: 'face-care', name: 'Moisturizer', slug: 'moisturizer', description: 'Hydrate and protect' },
        { parentSlug: 'face-care', name: 'Serum', slug: 'serum', description: 'Targeted treatment' },
        { parentSlug: 'face-care', name: 'Toner', slug: 'toner', description: 'Balance and prep' },
        { parentSlug: 'face-care', name: 'Face Mask', slug: 'face-mask', description: 'Weekly pampering' },

        // Sun Care
        { parentSlug: 'sun-care', name: 'Sunscreen', slug: 'sunscreen', description: 'Broad spectrum SPF protection' },
        { parentSlug: 'sun-care', name: 'After Sun', slug: 'after-sun', description: 'Soothe and repair' },
        { parentSlug: 'sun-care', name: 'SPF Moisturizer', slug: 'spf-moisturizer', description: 'Moisturize with protection' },
        { parentSlug: 'sun-care', name: 'Lip SPF', slug: 'lip-spf', description: 'Protect your lips' }
    ];

    const subsToCreate = subCategories.map(sub => ({
        parentId: parentMap[sub.parentSlug],
        name: sub.name,
        slug: sub.slug,
        description: sub.description,
        isActive: true
    }));

    await Category.create(subsToCreate);
    console.log('Categories seeded.');

    // 4. Seed Departments
    console.log('Seeding Departments...');
    await Department.deleteMany({});
    const departmentsData = [
        { name: 'R&D', slug: 'r-and-d', iconName: 'FlaskConical', sortOrder: 1 },
        { name: 'Design', slug: 'design', iconName: 'Palette', sortOrder: 2 },
        { name: 'Marketing', slug: 'marketing', iconName: 'Megaphone', sortOrder: 3 },
        { name: 'CX', slug: 'cx', iconName: 'Headphones', sortOrder: 4 },
        { name: 'Engineering', slug: 'engineering', iconName: 'Code', sortOrder: 5 },
        { name: 'Analytics', slug: 'analytics', iconName: 'BarChart3', sortOrder: 6 }
    ];
    await Department.create(departmentsData);
    console.log('Departments seeded.');

    // 5. Seed Coupons
    console.log('Seeding Coupons...');
    await Coupon.deleteMany({});
    const now = new Date();
    const expiry = new Date();
    expiry.setFullYear(now.getFullYear() + 2); // Expiry in 2 years

    const couponsData = [
        { code: 'FLAT20', description: '20% off on your order', discountType: 'percentage', discountValue: 20, minimumOrderValue: 0, startsAt: now, expiresAt: expiry, isActive: true },
        { code: 'VALLEY20', description: '৳20 off on your order', discountType: 'fixed_amount', discountValue: 20, minimumOrderValue: 0, startsAt: now, expiresAt: expiry, isActive: true },
        { code: 'FLAT25', description: '25% off on combo packs', discountType: 'percentage', discountValue: 25, minimumOrderValue: 500, startsAt: now, expiresAt: expiry, isActive: true },
        { code: 'FLAT35', description: '35% off on duo combos', discountType: 'percentage', discountValue: 35, minimumOrderValue: 700, startsAt: now, expiresAt: expiry, isActive: true }
    ];
    await Coupon.create(couponsData);
    console.log('Coupons seeded.');

    // 6. Seed Trust Badges
    console.log('Seeding Trust Badges...');
    await TrustBadge.deleteMany({});
    const trustBadgesData = [
        { iconName: 'Truck', label: 'Free Shipping', description: 'On orders over ৳499', sortOrder: 1 },
        { iconName: 'ShieldCheck', label: 'Secure Payment', description: '256-bit SSL encryption', sortOrder: 2 },
        { iconName: 'RotateCcw', label: 'Easy Returns', description: '30-day return policy', sortOrder: 3 },
        { iconName: 'Headphones', label: '24/7 Support', description: 'Always here to help', sortOrder: 4 }
    ];
    await TrustBadge.create(trustBadgesData);
    console.log('Trust Badges seeded.');

    // 7. Seed Company Timeline
    console.log('Seeding Company Timeline...');
    await CompanyTimeline.deleteMany({});
    const timelineData = [
        { year: '2018', event: "Bare Anatomy launches as India's first personalized hair care brand", sortOrder: 1 },
        { year: '2020', event: 'Chemist at Play disrupts actives-based skincare with honest pricing', sortOrder: 2 },
        { year: '2021', event: 'Sun Scoop enters the market, redefining everyday sun protection', sortOrder: 3 },
        { year: '2022', event: 'Crossed 500K+ customers across all brands', sortOrder: 4 },
        { year: '2023', event: 'ValleyCentia parent brand unifies the portfolio under one roof', sortOrder: 5 },
        { year: '2024', event: 'Expanded to 50+ products with an average rating of 4.7 stars', sortOrder: 6 }
    ];
    await CompanyTimeline.create(timelineData);
    console.log('Company Timeline seeded.');

    // 8. Seed Company Values
    console.log('Seeding Company Values...');
    await CompanyValue.deleteMany({});
    const valuesData = [
        { iconName: 'Leaf', title: 'Clean Beauty', description: 'Every formula is free from harmful chemicals.', sortOrder: 1 },
        { iconName: 'Shield', title: 'Science-Backed', description: 'Cutting-edge dermatological research with potent botanicals.', sortOrder: 2 },
        { iconName: 'Users', title: 'Community First', description: 'Built with real feedback from real people.', sortOrder: 3 },
        { iconName: 'Globe', title: 'Sustainable Impact', description: 'From recyclable packaging to cruelty-free testing.', sortOrder: 4 }
    ];
    await CompanyValue.create(valuesData);
    console.log('Company Values seeded.');

    // 9. Seed Perks
    console.log('Seeding Perks...');
    await Perk.deleteMany({});
    const perksData = [
        { iconName: 'Heart', title: 'Health & Wellness', description: 'Comprehensive medical insurance, mental health support, and wellness stipends', sortOrder: 1 },
        { iconName: 'Zap', title: 'Flexible Work', description: 'Hybrid model — work from home 2 days a week with flexible hours', sortOrder: 2 },
        { iconName: 'BookOpen', title: 'Learning Budget', description: '৳50,000/year for courses, conferences, and professional development', sortOrder: 3 },
        { iconName: 'Coffee', title: 'Free Products', description: 'Monthly hampers from Bare Anatomy, Chemist at Play, and Sun Scoop', sortOrder: 4 },
        { iconName: 'Sparkles', title: 'Growth Path', description: 'Clear promotion ladders and quarterly performance reviews', sortOrder: 5 },
        { iconName: 'BarChart3', title: 'ESOPs', description: 'Stock options for key roles — grow as the company grows', sortOrder: 6 }
    ];
    await Perk.create(perksData);
    console.log('Perks seeded.');

    // 10. Seed Site Settings
    console.log('Seeding Site Settings...');
    await SiteSetting.deleteMany({});
    const siteSettingsData = [
        { key: 'free_shipping_threshold', value: { amount: 499, currency: 'BDT' }, description: 'Minimum order value for free shipping' },
        { key: 'shipping_fee', value: { amount: 49, currency: 'BDT' }, description: 'Standard shipping fee when threshold not met' },
        { key: 'max_cart_quantity', value: { value: 10 }, description: 'Maximum quantity per item in cart' },
        { key: 'contact_email', value: { value: 'support@valleycentia.com' }, description: 'Customer support email' },
        { key: 'careers_email', value: { value: 'careers@valleycentia.com' }, description: 'Careers application email' }
    ];
    await SiteSetting.create(siteSettingsData);
    console.log('Site Settings seeded.');

    // 11. Seed Hero Slide
    console.log('Seeding Hero Slides...');
    await HeroSlide.deleteMany({});
    const heroSlidesData = [
        {
            title: 'Elevate Your Style',
            subtitle: 'Discover curated collections of premium accessories and beauty essentials.',
            ctaText: 'Shop Collection',
            ctaLink: '/shop',
            imageUrl: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1200&q=80',
            imageAlt: 'Elevate Your Style Banner',
            isActive: true,
            sortOrder: 1
        }
    ];
    await HeroSlide.create(heroSlidesData);
    console.log('Hero Slides seeded.');

    // 12. Seed Homepage Sections
    console.log('Seeding Homepage Sections...');
    await HomepageSection.deleteMany({});
    const homepageSectionsData = [
        { sectionType: 'best_sellers', title: 'Best Sellers Across Brands', subtitle: 'The most-loved essentials, all in one place', badgeText: '🔥 Most Loved', sortOrder: 1, isActive: true },
        { sectionType: 'new_launches', title: 'New Launches', subtitle: 'New formulas to love every day', badgeText: '✨ Just Dropped', sortOrder: 2, isActive: true },
        { sectionType: 'power_care_duos', title: 'Power Care Duos', subtitle: 'Essentials that work from root to glow', badgeText: '💪 Power Pairs', sortOrder: 3, isActive: true },
        { sectionType: 'brands_that_lead', title: 'Brands That Lead. Ingredients That Deliver.', subtitle: 'Explore our portfolio of science-backed brands', badgeText: null, sortOrder: 4, isActive: true }
    ];
    await HomepageSection.create(homepageSectionsData);
    console.log('Homepage Sections seeded.');

    // 13. Seed About Content
    console.log('Seeding About Content...');
    await AboutContent.deleteMany({});
    const aboutContentData = [
        {
            sectionKey: 'hero',
            content: {
                badge: 'About Us',
                title: 'Beauty rooted in <accent>science</accent>,<br/>driven by <accent>purpose</accent>.',
                description: 'ValleyCentia is the home of three distinct brands united by one belief: everyone deserves personal care that is honest, effective, and kind to the planet.'
            }
        },
        {
            sectionKey: 'stats',
            content: [
                { value: '3+', label: 'Premium Brands', icon: 'Award' },
                { value: '50+', label: 'Curated Products', icon: 'Sparkles' },
                { value: '1M+', label: 'Happy Customers', icon: 'Heart' },
                { value: '4.7', label: 'Avg Rating', icon: 'TrendingUp' }
            ]
        },
        {
            sectionKey: 'values',
            content: [
                { icon: 'Leaf', title: 'Clean Beauty', text: 'Every formula is free from harmful chemicals. We believe what you put on your body matters as much as what you put in it.' },
                { icon: 'Shield', title: 'Science-Backed', text: 'Our R&D lab combines cutting-edge dermatological research with potent botanicals for results you can see and feel.' },
                { icon: 'Users', title: 'Community First', text: 'Built with real feedback from real people. Our community of 1M+ drives every product decision we make.' },
                { icon: 'Globe', title: 'Sustainable Impact', text: 'From recyclable packaging to cruelty-free testing, sustainability is not a buzzword — it is our baseline.' }
            ]
        },
        {
            sectionKey: 'brands',
            content: [
                { name: 'Bare Anatomy', tagline: 'Personalized hair & skin science', description: "India's first personalized beauty brand. Every product is tailored to your unique hair and skin profile using our proprietary diagnostic quiz.", color: '#c9a96e' },
                { name: 'Chemist at Play', tagline: 'Actives that actually work', description: 'Clinical-grade active ingredients at honest prices. AHAs, BHAs, Niacinamide, Retinol — formulated for real results without the premium markup.', color: '#6ec9b0' },
                { name: 'Sun Scoop', tagline: 'Everyday sun protection, reimagined', description: "Lightweight, invisible sunscreens that you'll actually want to wear. No white cast, no greasiness — just broad-spectrum protection all day.", color: '#f5c518' }
            ]
        },
        {
            sectionKey: 'timeline',
            content: [
                { year: '2018', event: "Bare Anatomy launches as India's first personalized hair care brand" },
                { year: '2020', event: 'Chemist at Play disrupts actives-based skincare with honest pricing' },
                { year: '2021', event: 'Sun Scoop enters the market, redefining everyday sun protection' },
                { year: '2022', event: 'Crossed 500K+ customers across all brands' },
                { year: '2023', event: 'ValleyCentia parent brand unifies the portfolio under one roof' },
                { year: '2024', event: 'Expanded to 50+ products with an average rating of 4.7 stars' }
            ]
        },
        {
            sectionKey: 'cta',
            content: {
                title: 'Join the ValleyCentia family',
                description: 'Whether you are shopping our products or exploring a career with us, we would love to have you.',
                primary_btn_text: 'Shop Now',
                primary_btn_link: '/shop',
                secondary_btn_text: 'View Careers',
                secondary_btn_link: '/careers'
            }
        }
    ];
    await AboutContent.create(aboutContentData);
    console.log('About Content seeded.');

    console.log('All seed data successfully written!');
}

seed()
    .then(() => {
        console.log('Seeding complete.');
        process.exit(0);
    })
    .catch(err => {
        console.error('Error seeding database:', err);
        process.exit(1);
    });
