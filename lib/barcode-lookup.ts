export type BarcodeHit = { brand: string | null; name: string | null; image: string | null };

type OpenFactsProduct = {
  brands?: string;
  product_name?: string;
  image_front_url?: string;
  image_url?: string;
};

type OpenFactsResponse = { status?: number; product?: OpenFactsProduct };

/**
 * Open Beauty Facts return `status: 0` with no `product` for an unknown
 * code, not a 404, so a miss is a normal response shape, not a fetch error.
 */
export function parseProduct(json: OpenFactsResponse): BarcodeHit | null {
  const product = json.status === 1 ? json.product : undefined;
  if (!product) return null;

  const brand = product.brands?.split(",")[0]?.trim() || null;
  const name = product.product_name?.trim() || null;
  if (!brand && !name) return null;

  return { brand, name, image: product.image_front_url || product.image_url || null };
}
