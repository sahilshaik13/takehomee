/**
 * Price utility functions for tiered/bulk pricing
 */

/**
 * Format price to USD currency string
 * * @param {number} price - Price value
 * @returns {string} - Formatted price string
 */
export const formatPrice = (price) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(price);
};

/**
 * Calculate the unit price for a product based on quantity
 * Finds the best applicable tier price based on percentage discount
 * * @param {Object} product - Product with optional pricing_tiers
 * @param {number} quantity - Quantity being purchased
 * @returns {number} - The applicable unit price
 */
export const calculateUnitPrice = (product, quantity) => {
  // If no tiers, return base price
  if (!product.pricing_tiers || product.pricing_tiers.length === 0) {
    return product.price;
  }

  // 1. Filter out disabled tiers (if is_active exists and is false)
  // 2. Sort tiers by min_quantity in DESCENDING order to find the highest applicable tier
  const applicableTiers = [...product.pricing_tiers]
    .filter(t => t.is_active !== false)
    .sort((a, b) => b.min_quantity - a.min_quantity);

  // Find the first tier where quantity meets the minimum
  const tier = applicableTiers.find((t) => quantity >= t.min_quantity);

  if (tier) {
    // Calculate Discount: Base Price * (1 - (Percentage / 100))
    const discountDecimal = tier.discount_percentage / 100;
    return product.price * (1 - discountDecimal);
  }

  return product.price;
};

/**
 * Calculate line total for a cart item (unit price * quantity)
 * * @param {Object} product - Product with optional pricing_tiers
 * @param {number} quantity - Quantity in cart
 * @returns {number} - Total price for this line item
 */
export const calculateLineTotal = (product, quantity) => {
  const unitPrice = calculateUnitPrice(product, quantity);
  return unitPrice * quantity;
};

/**
 * Get the best bulk tier info for display
 * Returns the "Entry Level" tier (lowest quantity requirement) 
 * Used for showing badges like "Buy 5+ get 10% Off"
 * * @param {Object} product - Product with optional pricing_tiers
 * @returns {Object|null} - { min_quantity, discount_percentage, unit_price }
 */
export const getBestBulkTier = (product) => {
  if (!product.pricing_tiers || product.pricing_tiers.length === 0) {
    return null;
  }

  // Sort by min_quantity ASCENDING to get the entry-level tier
  const sortedTiers = [...product.pricing_tiers]
    .filter(t => t.is_active !== false)
    .sort((a, b) => a.min_quantity - b.min_quantity);

  if (sortedTiers.length === 0) return null;

  const entryTier = sortedTiers[0];
  
  // Calculate what the unit price would be at this tier
  const discountDecimal = entryTier.discount_percentage / 100;
  const discountedUnitPrice = product.price * (1 - discountDecimal);

  return {
    min_quantity: entryTier.min_quantity,
    discount_percentage: entryTier.discount_percentage,
    unit_price: discountedUnitPrice
  };
};

/**
 * Check if current quantity qualifies for a bulk discount
 * * @param {Object} product - Product with optional pricing_tiers
 * @param {number} quantity - Current quantity
 * @returns {boolean} - True if qualifying for a bulk tier
 */
export const isGettingBulkDiscount = (product, quantity) => {
  if (!product.pricing_tiers || product.pricing_tiers.length === 0) {
    return false;
  }

  // Find the absolute lowest quantity requirement among active tiers
  const activeTiers = product.pricing_tiers.filter(t => t.is_active !== false);
  
  if (activeTiers.length === 0) return false;

  const lowestMinQty = Math.min(...activeTiers.map(t => t.min_quantity));

  return quantity >= lowestMinQty;
};

/**
 * Get savings amount for current quantity
 * * @param {Object} product - Product with optional pricing_tiers
 * @param {number} quantity - Current quantity
 * @returns {number} - Amount saved (0 if no savings)
 */
export const calculateSavings = (product, quantity) => {
  const baseTotal = product.price * quantity;
  const actualTotal = calculateLineTotal(product, quantity);
  return Math.max(0, baseTotal - actualTotal);
};