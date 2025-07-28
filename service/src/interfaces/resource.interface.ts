// Interface for commercetools API Extension input
export interface Resource {
  typeId: string;
  obj: {
    id: string;
    version: number;
    lineItems: LineItem[];
    customLineItems: CustomLineItem[];
    totalPrice: {
      currencyCode: string;
      centAmount: number;
    };
    [key: string]: any;
  };
}

export interface LineItem {
  id: string;
  productId: string;
  name: {
    [locale: string]: string;
  };
  variant: {
    id: number;
    sku?: string;
  };
  price: {
    value: {
      currencyCode: string;
      centAmount: number;
    };
  };
  quantity: number;
  totalPrice: {
    currencyCode: string;
    centAmount: number;
  };
  addedAt: string;
  [key: string]: any;
}

export interface CustomLineItem {
  id: string;
  name: {
    [locale: string]: string;
  };
  quantity: number;
  money: {
    currencyCode: string;
    centAmount: number;
  };
  totalPrice: {
    currencyCode: string;
    centAmount: number;
  };
  [key: string]: any;
}

export interface ApiExtensionAction {
  action: string;
  resource: Resource;
}

// Direct discount update action for immediate application
export interface DirectDiscountUpdateAction {
  action: 'setDirectDiscounts';
  discounts: Array<{
    value: {
      type: 'relative';
      permyriad: number;
    };
    target?: {
      type: 'lineItems';
      predicate: string;
    };
  }>;
}
