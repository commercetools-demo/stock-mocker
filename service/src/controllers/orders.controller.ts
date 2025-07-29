import { Resource } from '../interfaces/resource.interface';
import CustomError from '../errors/custom.error';

/**
 * Handle the create action for orders with fraud scoring
 *
 * @param {Resource} resource The resource from the request body
 * @returns {object}
 */
const create = async (resource: Resource) => {
  try {
    // Deserialize the resource to an Order
    const orderDraft = JSON.parse(JSON.stringify(resource));
    const order = orderDraft.obj;

    // Extract line items and total price information
    const lineItems = order.lineItems || [];
    const totalLineItemCount = lineItems.reduce((sum: number, item: any) => sum + (item.quantity || 0), 0);
    
    // Get total price pre-tax (in cents, so 500 EUR = 50000 cents)
    const totalPricePreTax = order.taxedPrice?.totalNet?.centAmount || order.totalPrice?.centAmount || 0;
    const currency = order.totalPrice?.currencyCode || 'EUR';

    // Fraud scoring logic: fail if >10 line items AND total pre-tax >500 EUR
    if (totalLineItemCount > 10 && totalPricePreTax > 50000 && currency === 'EUR') {
      // Return validation failure with proper Commercetools API extension error format
      const fraudError = {
        statusCode: 400,
        message: 'Fraud scoring failed: Order exceeds risk threshold',
      };
      throw new CustomError(400, fraudError.message);
    }

    // If fraud check passes, return success with empty actions
    return { statusCode: 200, actions: [] };
  } catch (error) {
    if (error instanceof CustomError) {
      throw error;
    }
    
    if (error instanceof Error) {
      throw new CustomError(
        400,
        `Internal server error on OrderController: ${error.message}`
      );
    }
    
    throw new CustomError(400, 'Unknown error occurred in fraud scoring');
  }
};

/**
 * Handle the order controller according to the action
 *
 * @param {string} action The action that comes with the request. Could be `Create` or `Update`
 * @param {Resource} resource The resource from the request body
 * @returns {Promise<object>} The data from the method that handles the action
 */
export const orderController = async (action: string, resource: Resource) => {
  switch (action) {
    case 'Create': {
      const data = await create(resource);
      return data;
    }
    case 'Update':
      // For this fraud scoring implementation, we only handle Create actions
      break;

    default:
      throw new CustomError(
        500,
        `Internal Server Error - Action not recognized. Allowed values are 'Create' or 'Update'.`
      );
  }
};
