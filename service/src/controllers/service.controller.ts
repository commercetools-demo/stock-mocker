import { Request, Response } from 'express';
import { apiSuccess } from '../api/success.api';
import CustomError from '../errors/custom.error';
import { cartController } from './cart.controller';
import { logger } from '../utils/logger.utils';
import { orderController } from './orders.controller';

/**
 * Handles cart resource processing
 */
const handleCartResource = async (action: string, resource: any) => {
  logger.info(`Processing cart ${action} action for cart ID: ${resource.obj?.id}`);
  
  const data = await cartController(action, resource);

  if (data && data.actions && data.actions.length > 0) {
    logger.info(`Cart ${action} processed successfully with ${data.actions?.length || 0} update actions`);
    return data.actions;
  }

  logger.error(`Cart controller returned invalid response: ${JSON.stringify(data)}`);
  return [];
};

/**
 * Handles order resource processing
 */
const handleOrderResource = async (action: string, resource: any) => {
  const data = await orderController(action, resource);

  if (data && data.statusCode === 200) {
    return data.actions;
  }

  return [];
};

/**
 * Handles payment resource processing
 */
const handlePaymentResource = async (action: string, resource: any) => {
  logger.info('Payment resource type not implemented yet');
  // Payment controller logic would go here
  return [];
};

/**
 * Generic error handler for controller operations
 */
const handleControllerError = (error: unknown, resourceType: string): never => {
  if (error instanceof CustomError) {
    throw error;
  }
  
  if (error instanceof Error) {
    logger.error(`Unexpected error in ${resourceType} controller: ${error.message}`);
    throw new CustomError(500, `Internal server error: ${error.message}`);
  }
  
  logger.error(`Unknown error in ${resourceType} controller`);
  throw new CustomError(500, 'Unknown internal server error');
};

/**
 * Processes resource based on type
 */
const processResourceByType = async (action: string, resource: any): Promise<any[]> => {
  try {
    switch (resource.typeId) {
      case 'cart':
        return await handleCartResource(action, resource);
      
      case 'payment':
        return await handlePaymentResource(action, resource);
      
      case 'order':
        return await handleOrderResource(action, resource);
      
      default:
        logger.error(`Unrecognized resource type: ${resource.typeId}`);
        return [];
    }
  } catch (error) {
    handleControllerError(error, resource.typeId);
    return []; // This line will never be reached due to handleControllerError throwing, but satisfies TypeScript
  }
};

/**
 * Exposed service endpoint.
 * - Receives a POST request, parses the action and the controller
 * and returns it to the correct controller. We should be use 3. `Cart`, `Order` and `Payments`
 *
 * @param {Request} request The express request
 * @param {Response} response The express response
 * @returns
 */
export const post = async (request: Request, response: Response) => {
  // Deserialize the action and resource from the body
  const { action, resource } = request.body;

  logger.info(`Received API extension request - Action: ${action}, Resource Type: ${resource?.typeId}`);

  if (!action || !resource) {
    logger.error('Bad request - Missing body parameters');
    throw new CustomError(400, 'Bad request - Missing body parameters.');
  }

  const actions = await processResourceByType(action, resource);
  apiSuccess(200, actions, response);
};
