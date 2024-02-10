import { PaymentToken } from '../models/payment-token.model';

const nusd = {
  name: process.env.NEXT_PUBLIC_PSP22_TOKEN_NAME,
  address: process.env.NEXT_PUBLIC_PSP22_TOKEN_ADDRESS,
  decimals: process.env.NEXT_PUBLIC_PSP22_TOKEN_DECIMALS,
  isNative: false,
};

export const paymentTokens: PaymentToken[] = [nusd];
