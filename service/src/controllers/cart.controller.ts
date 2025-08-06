import { UpdateAction } from '@commercetools/sdk-client-v2';
import CustomError from '../errors/custom.error';
import { Resource } from '../interfaces/resource.interface';
import { logger } from '../utils/logger.utils';
import { createDiscountsForNewCustomLineItems, createDiscountsForNewLineItems } from '../utils/cart-discount.utils';

/**
 * Handle the create action
 *
 * @param {Resource} resource The resource from the request body
 * @returns {object}
 */
const create = async (resource: Resource) => {
  try {
    const updateActions: Array<UpdateAction> = [];

    // Deserialize the resource to a Cart
    const cart = resource.obj;
    
    if (!cart) {
      throw new CustomError(400, 'Invalid cart data in resource object');
    }

    logger.info(`Processing cart update for cart ID: ${cart.id}, version: ${cart.version}`);

    // Check for new line items and apply discounts
    if (cart.lineItems && cart.lineItems.length > 0) {
      logger.info(`Cart contains ${cart.lineItems.length} line items, checking for new items to discount`);
      const discountActions = createDiscountsForNewLineItems(cart.lineItems);
      updateActions.push(...discountActions);
    } else {
      logger.info('No line items in cart, no discounts to apply');
    }

    if (cart.customLineItems && cart.customLineItems.length > 0) {
      logger.info(`Cart contains ${cart.customLineItems.length} custom line items, checking for new items to discount`);
      const discountActions = createDiscountsForNewCustomLineItems(cart.customLineItems);
      updateActions.push(...discountActions);
    } else {
      logger.info('No custom line items in cart, no discounts to apply');
    }

    // Return the update actions for the API extension
    return {
      actions: updateActions
    };

  } catch (error) {
    logger.error('Error in cart create handler:', error);
    
    // Return a proper error response for API extensions
    if (error instanceof CustomError) {
      throw error;
    }
    
    throw new CustomError(500, `Failed to process cart update: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

/**
 * Handle the update action
 *
 * @param {Resource} resource The resource from the request body
 * @returns {object}
 */
const update = async (resource: Resource) => {
  try {
    const updateActions: Array<UpdateAction> = [];

    // Deserialize the resource to a Cart
    const cart = resource.obj;
    
    if (!cart) {
      throw new CustomError(400, 'Invalid cart data in resource object');
    }

    logger.info(`Processing cart update for cart ID: ${cart.id}, version: ${cart.version}`);

    // Check for new line items and apply discounts
    if (cart.lineItems && cart.lineItems.length > 0) {
      logger.info(`Cart contains ${cart.lineItems.length} line items, checking for new items to discount`);
      const discountActions = createDiscountsForNewLineItems(cart.lineItems);
      updateActions.push(...discountActions);
    } else {
      logger.info('No line items in cart, no discounts to apply');
    }


    if (cart.customLineItems && cart.customLineItems.length > 0) {
      logger.info(`Cart contains ${cart.customLineItems.length} custom line items, checking for new items to discount`);
      const discountActions = createDiscountsForNewCustomLineItems(cart.customLineItems);
      updateActions.push(...discountActions);
    } else {
      logger.info('No custom line items in cart, no discounts to apply');
    }

    // Return the update actions for the API extension
    return {
      actions: updateActions
    };

  } catch (error) {
    logger.error('Error in cart update handler:', error);
    
    // Return a proper error response for API extensions
    if (error instanceof CustomError) {
      throw error;
    }
    
    throw new CustomError(500, `Failed to process cart update: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

export const cartController = async (action: string, resource: Resource) => {
  switch (action) {
    case 'Create': {
      const data = await create(resource);
      return data;
    }
    case 'Update':
      const data = await update(resource);
      return data;
      break;

    default:
      throw new CustomError(
        500,
        `Internal Server Error - Action not recognized. Allowed values are 'Create' or 'Update'.`
      );
  }
};