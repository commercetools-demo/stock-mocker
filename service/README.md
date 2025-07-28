# Cart Discount API Extension for commercetools

This service implements a commercetools API Extension that automatically creates random discounts (0-10%) for newly added line items in shopping carts.

## Overview

This API extension is triggered when a Cart resource is updated in commercetools. It detects newly added line items and applies random percentage discounts between 0% and 10% to each new item.

## Features

- **Automatic Discount Application**: Automatically applies discounts when new line items are added to carts
- **Random Discount Percentages**: Generates random discounts between 0% and 10% for each line item
- **Recent Item Detection**: Only applies discounts to items added within the last 5 minutes
- **Comprehensive Logging**: Full logging for monitoring and debugging
- **Error Handling**: Robust error handling with proper HTTP status codes
- **Input Validation**: Validates cart data and line item information

## How It Works

1. **Trigger**: The API extension is called when a Cart is created or updated in commercetools
2. **Detection**: The service identifies line items that were added recently (within 5 minutes)
3. **Discount Generation**: For each new line item, a random percentage (0-10%) is generated
4. **Direct Discount Application**: The service returns `setDirectDiscounts` update actions to apply the discounts
5. **Cart Update**: commercetools applies the discount actions to the cart

## API Extension Configuration

To set up this API extension in commercetools, create an extension with the following configuration:

```json
{
  "key": "cart-promotion-extension",
  "destination": {
    "type": "HTTP",
    "url": "https://your-gcp-function-url"
  },
  "triggers": [
    {
      "resourceTypeId": "cart",
      "actions": ["Update"]
    }
  ],
  "timeoutInMs": 2000
}
```

## Deployment

This service is designed to be deployed as a Google Cloud Function. The deployment is handled through the existing build process:

```bash
npm run gcp-build
```

## Configuration

The service uses the existing commercetools client configuration from `src/utils/config.utils.ts`. Ensure the following environment variables are set:

- `CTP_CLIENT_ID`: commercetools client ID
- `CTP_CLIENT_SECRET`: commercetools client secret  
- `CTP_PROJECT_KEY`: commercetools project key
- `CTP_SCOPE`: commercetools OAuth scope
- `CTP_REGION`: commercetools API region

## Code Structure

### Core Files

- `src/controllers/cart.controller.ts`: Main controller handling cart create/update actions
- `src/utils/cart-discount.utils.ts`: Utility functions for discount logic
- `src/interfaces/resource.interface.ts`: TypeScript interfaces for API extension data
- `src/controllers/service.controller.ts`: Main service endpoint handling incoming requests

### Key Functions

#### `createDiscountsForNewLineItems(lineItems: LineItem[]): UpdateAction[]`
Creates direct discount update actions for newly added line items.

#### `generateRandomDiscountPercentage(): number`
Generates a random discount percentage between 0-10% (as permyriad).

#### `isLineItemRecentlyAdded(lineItem: LineItem): boolean`
Determines if a line item was added within the last 5 minutes.

#### `validateLineItem(lineItem: LineItem): boolean`
Validates line item data before processing.

## Example Response

When new line items are detected, the service returns update actions like:

```json
{
  "actions": [
    {
      "action": "setDirectDiscounts",
      "discounts": [
        {
          "value": {
            "type": "relative",
            "permyriad": 500
          },
          "target": {
            "type": "lineItems", 
            "predicate": "lineItem.id = \"line-item-123\""
          }
        }
      ]
    }
  ]
}
```

This example applies a 5% discount (500 permyriad) to the line item with ID "line-item-123".

## Logging

The service provides comprehensive logging:

- **Info**: Normal operation flow and discount applications
- **Warn**: Non-critical issues like missing timestamps
- **Error**: Critical errors and validation failures
- **Debug**: Detailed information for troubleshooting

## Error Handling

The service handles various error scenarios:

- **400 Bad Request**: Invalid input data or missing required fields
- **500 Internal Server Error**: Unexpected errors during processing
- **Validation Errors**: Returned as extension errors to commercetools

## Testing

The service can be tested by:

1. Adding line items to a cart in commercetools
2. Checking the logs for discount application
3. Verifying that direct discounts appear on the cart
4. Confirming random percentages are applied (0-10%)

## Limitations

- Only detects "new" items based on addedAt timestamp (last 5 minutes)
- Applies discounts using direct discounts (not persistent cart discount resources)
- Random percentage generation is not cryptographically secure
- Does not handle cart discount conflicts or stacking rules

## Support

For issues or questions about this API extension, check the logs for detailed error information and ensure all required environment variables are properly configured. 