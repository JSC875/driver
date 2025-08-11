/**
 * Price utility functions for consistent price formatting and rounding
 * Makes payments easier between drivers and users by rounding to whole numbers
 */

export interface PriceBreakdown {
  baseFare: number;
  distanceFare: number;
  timeFare: number;
  total: number;
  roundedTotal: number;
}

/**
 * Rounds a price to the nearest whole number for easier payment
 * @param price - The original price (can be decimal)
 * @returns Rounded price as a whole number
 */
export function roundPrice(price: number): number {
  return Math.round(price);
}

/**
 * Rounds a price to the nearest whole number and returns as string with ₹ symbol
 * @param price - The original price (can be decimal)
 * @returns Formatted price string like "₹68"
 */
export function formatRoundedPrice(price: number): string {
  const rounded = roundPrice(price);
  return `₹${rounded}`;
}

/**
 * Rounds a price to the nearest whole number and returns as number
 * @param price - The original price (can be decimal)
 * @returns Rounded price as number
 */
export function getRoundedPrice(price: number): number {
  return roundPrice(price);
}

/**
 * Formats a price breakdown with rounded totals
 * @param breakdown - Object containing fare components
 * @returns Price breakdown with rounded total
 */
export function formatPriceBreakdown(breakdown: {
  baseFare: number;
  distanceFare: number;
  timeFare: number;
}): PriceBreakdown {
  const total = breakdown.baseFare + breakdown.distanceFare + breakdown.timeFare;
  const roundedTotal = roundPrice(total);
  
  return {
    ...breakdown,
    total,
    roundedTotal
  };
}

/**
 * Rounds ride price for easier payment between driver and user
 * @param price - Original ride price
 * @returns Rounded price for display and payment
 */
export function roundRidePrice(price: number | string): number {
  // Handle string prices (remove ₹ symbol and convert)
  if (typeof price === 'string') {
    const numericPrice = parseFloat(price.replace(/[^\d.]/g, ''));
    return roundPrice(numericPrice);
  }
  
  return roundPrice(price);
}

/**
 * Formats ride price for display with rounding
 * @param price - Original ride price
 * @returns Formatted price string like "₹68"
 */
export function formatRidePrice(price: number | string): string {
  const rounded = roundRidePrice(price);
  return `₹${rounded}`;
}

/**
 * Gets the rounded price value for calculations
 * @param price - Original ride price
 * @returns Rounded price as number
 */
export function getRidePrice(price: number | string): number {
  return roundRidePrice(price);
}

/**
 * Rounds multiple prices in an array
 * @param prices - Array of prices to round
 * @returns Array of rounded prices
 */
export function roundPrices(prices: number[]): number[] {
  return prices.map(price => roundPrice(price));
}

/**
 * Rounds prices in an object
 * @param priceObject - Object containing price properties
 * @returns Object with rounded prices
 */
export function roundPricesInObject(priceObject: Record<string, number>): Record<string, number> {
  const rounded: Record<string, number> = {};
  
  for (const [key, value] of Object.entries(priceObject)) {
    if (typeof value === 'number') {
      rounded[key] = roundPrice(value);
    } else {
      rounded[key] = value;
    }
  }
  
  return rounded;
}
