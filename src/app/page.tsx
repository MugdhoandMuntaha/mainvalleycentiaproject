import HeroCarousel from '@/components/HeroCarousel';
import ProductCarouselSection from '@/components/ProductCarouselSection';
import BrandsThatLead from '@/components/BrandsThatLead';
import VisibleChange from '@/components/VisibleChange';
import { getHeroSlides, getHomepageSections, getBrands, getVisibleChanges } from '@/lib/db/queries';
import type { SectionProductCard } from '@/lib/db/queries';
import type { SectionProduct } from '@/data/homeSections';

/** Map Supabase section products → the SectionProduct shape ProductCarouselSection expects */
function toSectionProduct(p: SectionProductCard): SectionProduct {
  const badges = p.badges as { badge: string; label: string | null; color: string | null }[] | null;
  const primaryBadge = badges?.find((b) => b.label) || badges?.[0];
  const badgeText = primaryBadge?.label || primaryBadge?.badge || undefined;
  const isPremium = badgeText?.toLowerCase() === 'premium';
  return {
    id: p.id,
    slug: (p.slug as string) || '',
    image: (p.primary_image_url as string) || '/no-image.svg',
    title: (p.name as string) || '',
    description: (p.short_description as string) || '',
    price: Math.ceil(Number(p.base_price) || 0),
    originalPrice: p.compare_at_price ? Math.ceil(Number(p.compare_at_price)) : undefined,
    discountPercent: p.discount_percent ? Number(p.discount_percent) : undefined,
    couponPrice: p.coupon_price ? Math.ceil(Number(p.coupon_price)) : undefined,
    couponCode: (p.coupon_code as string) || undefined,
    rating: Number(p.rating_avg) || 0,
    reviewCount: formatReviewCount(Number(p.review_count) || 0),
    badge: badgeText,
    badgeColor: isPremium ? '#f0c14b' : (primaryBadge?.color || undefined),
    extraBadge: (p.custom_badge_text as string) || undefined,
    inStock: p.in_stock !== undefined ? p.in_stock : true,
  };
}

function formatReviewCount(count: number): string {
  if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
  return String(count);
}

/** Section types that are NOT product carousels — they're rendered separately */
const NON_PRODUCT_SECTION_TYPES = ['hero_carousel', 'brands_that_lead', 'visible_change'];

/** Alternate default backgrounds for product sections */
const DEFAULT_BACKGROUNDS = ['#ffffff', '#f9f9f6'];

export const revalidate = 60; // Regenerate homepage at most once every 60 seconds (ISR)

export default async function HomePage() {
  // Fetch all data server-side in parallel
  const [slides, sections, brands, visibleChanges] = await Promise.all([
    getHeroSlides(),
    getHomepageSections(),
    getBrands(),
    getVisibleChanges(),
  ]);

  // Map hero slides
  const heroSlides = slides.map((s) => ({
    image: s.image_url,
    mobileImage: s.mobile_image_url || undefined,
    alt: s.image_alt || s.title,
    background: s.background_color || '#f0efed',
    link: s.cta_link || undefined,
  }));

  // Filter to only product sections (sorted by sort_order from DB)
  const productSections = sections.filter(
    (s) => !NON_PRODUCT_SECTION_TYPES.includes(s.section_type)
  );

  // Split into core sections (above Brands) and custom sections (below Brands)
  const CORE_TYPES = ['best_sellers', 'new_launches'];
  const coreSections = productSections.filter((s) => CORE_TYPES.includes(s.section_type));
  const powerDuos = productSections.find((s) => s.section_type === 'power_care_duos');
  const customSections = productSections.filter((s) => !CORE_TYPES.includes(s.section_type) && s.section_type !== 'power_care_duos');

  // Map brands for BrandsThatLead
  const brandCards = brands.map((b, i) => {
    const accent = b.accent_color || '#c4a882';
    return {
      id: i + 1,
      name: b.name,
      slug: b.slug,
      tagline: b.tagline || '',
      image: b.logo_url || '/no-image.svg',
      background: `linear-gradient(135deg, ${accent}cc 0%, ${accent} 50%, ${accent}dd 100%)`,
      textColor: b.text_color || undefined,
    };
  });

  return (
    <>
      {/* ===== HERO CAROUSEL ===== */}
      <HeroCarousel slides={heroSlides} />

      {/* ===== CORE PRODUCT SECTIONS (above brands) ===== */}
      {coreSections.map((section, index) => (
        <ProductCarouselSection
          key={section.id}
          title={section.title}
          subtitle={section.subtitle || ''}
          products={section.products.map(toSectionProduct)}
          background={DEFAULT_BACKGROUNDS[index % DEFAULT_BACKGROUNDS.length]}
          viewAllHref={section.cta_link || `/shop?section=${section.section_type}`}
        />
      ))}

      {/* ===== BRANDS THAT LEAD ===== */}
      <BrandsThatLead brands={brandCards} background="#f9f9f6" />

      {/* ===== POWER CARE DUOS (hardcoded below brands) ===== */}
      {powerDuos && (
        <ProductCarouselSection
          title={powerDuos.title}
          subtitle={powerDuos.subtitle || ''}
          products={powerDuos.products.map(toSectionProduct)}
          background="#ffffff"
          viewAllHref={powerDuos.cta_link || '/shop?section=power-care-duos'}
        />
      )}

      {/* ===== CUSTOM SECTIONS (added from admin, below power duos) ===== */}
      {customSections.map((section, index) => (
        <ProductCarouselSection
          key={section.id}
          title={section.title}
          subtitle={section.subtitle || ''}
          products={section.products.map(toSectionProduct)}
          background={DEFAULT_BACKGROUNDS[index % DEFAULT_BACKGROUNDS.length]}
          viewAllHref={section.cta_link || `/shop?section=${section.section_type}`}
        />
      ))}

      {/* ===== VISIBLE CHANGE / REAL STORIES ===== */}
      <VisibleChange items={visibleChanges} />
    </>
  );
}



  