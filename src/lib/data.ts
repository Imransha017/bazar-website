// Static demo catalog for the Bazar-style storefront.
// Images are sourced from loremflickr.com (keyword-tagged real photos) so
// the UI looks like a real e-commerce site instead of cartoon emoji.

export type L = { bn: string; en: string };

export type Subcategory = { slug: string; name: L; keyword: string; productCount?: number; children?: Subcategory[] };

export type Category = {
  slug: string;
  name: L;
  icon: string;       // small emoji fallback used in chips only
  image: string;      // category tile image
  color: string;
  subcategories: Subcategory[];
  productCount?: number;
};

export type Product = {
  id: string;
  slug?: string;        // when present, use /p/$slug route (DB products)
  title: L;
  price: number;
  mrp: number;
  dropshipper_price?: number | null;
  rating: number;
  reviewCount?: number;
  sold: number;
  category: string;     // primary category slug
  categoryName?: string;
  subcategory?: string; // primary subcategory slug
  subcategoryName?: string;
  categories?: string[];     // all category slugs (multi-select)
  subcategories?: string[];  // all subcategory slugs (multi-select)
  options?: string[];        // all level-3 option slugs (multi-select)

  brand: string;
  sku?: string;
  tags?: string[];
  badge?: "FLASH" | "NEW" | "TOP" | "MALL";
  image: string;        // primary product image
  gallery: string[];    // gallery thumbs
  description: L;
  is_active?: boolean;
};

// Static categories and products have been removed to show only live DB data.
export const categories: Category[] = [];
export const products: Product[] = [];
export const flashSale: Product[] = [];

export const getProduct = (id: string) => products.find((p) => p.id === id);
export const productsByCategory = (slug: string) => products.filter((p) => p.category === slug);
export const productsBySubcategory = (cat: string, sub: string) =>
  products.filter((p) => p.category === cat && p.subcategory === sub);
export const getCategory = (slug: string) => categories.find((c) => c.slug === slug);
export const searchProducts = (q: string) => {
  const s = q.trim().toLowerCase();
  if (!s) return [];
  return products.filter(
    (p) =>
      p.title.en.toLowerCase().includes(s) ||
      p.title.bn.includes(s) ||
      p.brand.toLowerCase().includes(s) ||
      p.category.includes(s),
  );
};

export const formatBDT = (n: number) => `৳${Number(n || 0).toLocaleString("en-BD")}`;
