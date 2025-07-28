import { UpdateAction } from '@commercetools/sdk-client-v2';

export interface ResponseInterfaceSuccess {
  actions: Array<UpdateAction>;
}

export interface ResponseInterfaceError {
  errors: Array<{
    code: string;
    message: string;
    localizedMessage?: {
      [locale: string]: string;
    };
    extensionExtraInfo?: {
      [key: string]: any;
    };
  }>;
}

// For API extensions that need to create cart discounts
export interface CartDiscountDraft {
  name: {
    [locale: string]: string;
  };
  description?: {
    [locale: string]: string;
  };
  value: {
    type: 'relative';
    permyriad: number; // 1000 = 10%
  };
  cartPredicate: string;
  target: {
    type: 'lineItems';
    predicate: string;
  };
  sortOrder: string;
  isActive: boolean;
}
