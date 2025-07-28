import { UpdateAction } from '@commercetools/sdk-client-v2';
import { LineItem, DirectDiscountUpdateAction } from '../interfaces/resource.interface';
import { logger } from './logger.utils';

/**
 * Enum for availability flags
 */
export enum AvailabilityFlag {
  LOW_ON_STOCK = 'low-on-stock',
  HIGH_ON_STOCK = 'high-on-stock',
  LAST_ITEMS_ON_STOCK = 'last-items-on-stock',
  MORE_THAN_STOCK = 'more-than-stock',
  OUT_OF_STOCK = 'out-of-stock'
}

/**
 * Generate a random percentage between 0 and 10 (inclusive)
 * @returns {number} Random percentage as permyriad (e.g., 1000 = 10%)
 */
export const generateRandomDiscountPercentage = (): number => {
  // Generate random number between 0 and 10 (inclusive)
  const randomPercentage = Math.floor(Math.random() * 11);
  // Convert to permyriad (per ten thousand)
  return randomPercentage * 100; // 100 permyriad = 1%
};

/**
 * Check if a line item was added recently (within last 5 minutes)
 * This is used to identify "new" line items that should get discounts
 * @param {LineItem} lineItem The line item to check
 * @returns {boolean} True if the item was added recently
 */
export const isLineItemRecentlyAdded = (lineItem: LineItem): boolean => {
  if (!lineItem.addedAt) {
    logger.warn(`Line item ${lineItem.id} has no addedAt timestamp`);
    return false;
  }

  try {
    const addedTime = new Date(lineItem.addedAt);
    const currentTime = new Date();
    const timeDifferenceMs = currentTime.getTime() - addedTime.getTime();
    const fiveMinutesMs = 1 * 60 * 1000; // 1 minutes in milliseconds

    const isRecent = timeDifferenceMs <= fiveMinutesMs;
    logger.debug(`Line item ${lineItem.id} added ${timeDifferenceMs}ms ago, isRecent: ${isRecent}`);

    return isRecent;
  } catch (error) {
    logger.error(`Error parsing addedAt timestamp for line item ${lineItem.id}: ${lineItem.addedAt}`);
    return false;
  }
};

/**
 * Validate line item data before processing
 * @param {LineItem} lineItem The line item to validate
 * @returns {boolean} True if the line item is valid
 */
export const validateLineItem = (lineItem: LineItem): boolean => {
  if (!lineItem.id) {
    logger.error('Line item missing required id field');
    return false;
  }

  if (!lineItem.productId) {
    logger.error(`Line item ${lineItem.id} missing required productId field`);
    return false;
  }

  if (!lineItem.variant?.id) {
    logger.error(`Line item ${lineItem.id} missing required variant.id field`);
    return false;
  }

  if (!lineItem.price?.value?.currencyCode) {
    logger.error(`Line item ${lineItem.id} missing required price.value.currencyCode field`);
    return false;
  }

  return true;
};

export const processDiscounts = (lineItems: LineItem[]): UpdateAction[] => {
  const updateActions: UpdateAction[] = [];
  const directDiscounts: Array<{
    value: {
      type: 'relative';
      permyriad: number;
    };
    target?: {
      type: 'lineItems';
      predicate: string;
    };
  }> = [];
  lineItems.forEach((lineItem) => {
    const discountPercentage = generateRandomDiscountPercentage();

    if (discountPercentage > 0) {
      logger.info(`Applying ${discountPercentage / 100}% discount to line item ${lineItem.id} (Product: ${lineItem.productId})`);

      // Create a direct discount targeting this specific line item
      directDiscounts.push({
        value: {
          type: 'relative',
          permyriad: discountPercentage
        },
        target: {
          type: 'lineItems',
          predicate: `sku = "${lineItem.variant.sku}"`
        }
      });
    } else {
      logger.info(`No discount (0%) applied to line item ${lineItem.id} (Product: ${lineItem.productId})`);
    }
  });

  // If we have discounts to apply, create the update action
  if (directDiscounts.length > 0) {
    const setDirectDiscountsAction: DirectDiscountUpdateAction = {
      action: 'setDirectDiscounts',
      discounts: directDiscounts
    };

    updateActions.push(setDirectDiscountsAction as UpdateAction);
    logger.info(`Created setDirectDiscounts action with ${directDiscounts.length} discounts`);
  }

  return updateActions;
}

/**
 * Generate a random available quantity between 1 and 100
 * @returns {number} Random available quantity
 */
export const generateRandomAvailableQuantity = (): number => {
  return Math.floor(Math.random() * 10) + 1; // 1 to 10 inclusive
};

/**
 * Determine availability flag based on current quantity and available quantity
 * @param {number} currentQuantity The quantity in the cart
 * @param {number} availableQuantity The available stock quantity
 * @returns {AvailabilityFlag} The appropriate availability flag
 */
export const determineAvailabilityFlag = (currentQuantity: number, availableQuantity: number): AvailabilityFlag => {
  if (availableQuantity === 0) {
    return AvailabilityFlag.OUT_OF_STOCK;
  }

  if (currentQuantity > availableQuantity) {
    return AvailabilityFlag.MORE_THAN_STOCK;
  }

  if (currentQuantity === availableQuantity) {
    return AvailabilityFlag.LAST_ITEMS_ON_STOCK;
  }

  // currentQuantity < availableQuantity
  const ratio = currentQuantity / availableQuantity;
  if (ratio <= 0.2) { // If current quantity is 20% or less of available
    return AvailabilityFlag.HIGH_ON_STOCK;
  } else {
    return AvailabilityFlag.LOW_ON_STOCK;
  }
};

/**
 * Process stocks and add custom type with availability information to line items
 * @param {LineItem[]} lineItems Array of line items from the cart
 * @returns {UpdateAction[]} Array of update actions to set custom types
 */
export const processStocks = (lineItems: LineItem[]): UpdateAction[] => {
  const updateActions: UpdateAction[] = [];

  if (!Array.isArray(lineItems)) {
    logger.error('Invalid lineItems input - not an array');
    return updateActions;
  }

  lineItems.forEach((lineItem) => {
    try {
      // Check if line item already has the custom type with custom fields
      const existingCustomType = lineItem.custom;
      let availableQuantity: number;

      if (existingCustomType &&
          existingCustomType.type?.key === 'ABC' &&
          existingCustomType.fields?.availableQuantity) {
        // Use existing available quantity
        availableQuantity = existingCustomType.fields.availableQuantity;
        logger.info(`Using existing available quantity ${availableQuantity} for line item ${lineItem.id}`);
      } else {
        // Generate new random available quantity
        availableQuantity = generateRandomAvailableQuantity();
        logger.info(`Generated new available quantity ${availableQuantity} for line item ${lineItem.id}`);
      }

      // Determine availability flag
      const availabilityFlag = determineAvailabilityFlag(lineItem.quantity, availableQuantity);

      logger.info(`Line item ${lineItem.id}: quantity=${lineItem.quantity}, available=${availableQuantity}, flag=${availabilityFlag}`);

      // Create update action to set custom type
      const setCustomTypeAction: UpdateAction = {
        action: 'setLineItemCustomType',
        lineItemId: lineItem.id,
        type: {
          key: 'external-lineitem-info'
        },
        fields: {
          availabilityFlag: availabilityFlag,
          availableQuantity: availableQuantity
        }
      };

      updateActions.push(setCustomTypeAction);

    } catch (error) {
      logger.error(`Error processing stocks for line item ${lineItem.id}: ${error}`);
    }
  });

  logger.info(`Created ${updateActions.length} stock update actions`);
  return updateActions;
};

/**
 * Create direct discounts for newly added line items
 * @param {LineItem[]} lineItems Array of line items from the cart
 * @returns {UpdateAction[]} Array of update actions to apply discounts
 */
export const createDiscountsForNewLineItems = (lineItems: LineItem[]): UpdateAction[] => {
  const updateActions: UpdateAction[] = [];

  if (!Array.isArray(lineItems)) {
    logger.error('Invalid lineItems input - not an array');
    return updateActions;
  }

  // Validate and filter line items
  const validLineItems = lineItems.filter(validateLineItem);

  if (validLineItems.length !== lineItems.length) {
    logger.warn(`${lineItems.length - validLineItems.length} invalid line items filtered out`);
  }

  // Find recently added line items
  const newLineItems = validLineItems.filter(isLineItemRecentlyAdded);

  if (newLineItems.length === 0) {
    logger.info('No new line items found, no discounts to apply');
    return updateActions;
  }

  logger.info(`Found ${newLineItems.length} new line items to apply discounts to`);

  updateActions.push(...processDiscounts(newLineItems));
  updateActions.push(...processStocks(validLineItems));



  // Create discounts for each new line item


  return updateActions;
}; 