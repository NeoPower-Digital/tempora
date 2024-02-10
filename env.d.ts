/* eslint-disable no-unused-vars */
namespace NodeJS {
  interface ProcessEnv {
    NEXT_PUBLIC_CHAIN_ENVIRONMENT: 'kusama' | 'testing' | 'dev';
    NEXT_PUBLIC_CONTRACT_ADDRESS: string;
    NEXT_PUBLIC_PSP22_TOKEN_NAME: string;
    NEXT_PUBLIC_PSP22_TOKEN_ADDRESS: string;
    NEXT_PUBLIC_PSP22_TOKEN_DECIMALS: number;
  }
}
