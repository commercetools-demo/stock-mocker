import { Request, Response } from 'express';
import { apiSuccess } from '../api/success.api';
import CustomError from '../errors/custom.error';
import { cartController } from './cart.controller';
import { logger } from '../utils/logger.utils';
import { orderController } from './orders.controller';

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

  // Identify the type of resource in order to redirect
  // to the correct controller
  switch (resource.typeId) {
    case 'cart':
      try {
        logger.info(`Processing cart ${action} action for cart ID: ${resource.obj?.id}`);
        
        const data = await cartController(action, resource);

        if (data && data.actions && data.actions.length > 0) {
          logger.info(`Cart ${action} processed successfully with ${data.actions?.length || 0} update actions`);
          apiSuccess(200, data.actions, response);
          return;
        }

        logger.error(`Cart controller returned invalid response: ${JSON.stringify(data)}`);
        apiSuccess(200, [], response);
      } catch (error) {
        if (error instanceof CustomError) {
          throw error; // Re-throw custom errors
        }
        
        if (error instanceof Error) {
          logger.error(`Unexpected error in cart controller: ${error.message}`);
          throw new CustomError(500, `Internal server error: ${error.message}`);
        }
        
        logger.error('Unknown error in cart controller');
        throw new CustomError(500, 'Unknown internal server error');
      }

    case 'payment':
      logger.info('Payment resource type not implemented yet');
      // Payment controller logic would go here
      apiSuccess(200, [], response);

    case 'order':
      try {
        const data = await orderController(action, resource);

        if (data && data.statusCode === 200) {
          apiSuccess(200, data.actions, response);
          return;
        }

        apiSuccess(200, [], response);

      } catch (error) {
        if (error instanceof CustomError) {
          throw error; // Re-throw custom errors
        }
        
        if (error instanceof Error) {
          logger.error(`Unexpected error in order controller: ${error.message}`);
          throw new CustomError(500, `Internal server error: ${error.message}`);
        }
        
        logger.error('Unknown error in order controller');
        throw new CustomError(500, 'Unknown internal server error');

      }
    default:
      logger.error(`Unrecognized resource type: ${resource.typeId}`);
      apiSuccess(200, [], response);
  }
};
