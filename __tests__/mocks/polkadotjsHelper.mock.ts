import {
  batchTransactions,
  crossChainTransfer,
  extrinsicViaProxy,
  getAssetMetadata,
  getDefaultAssetBalance,
  getExtrinsicWeight,
  getTokenBalanceOfAccount,
  queryWeightToFee,
  sendXcm,
  signAndSendPromise,
  transfer,
  xcmLocationToAssetIdNumber,
} from '@/lib/helpers/polkadotjs.helper';
import Weight from '@/lib/models/weight.model';
import { u128 } from '@polkadot/types';
import { BN } from '@polkadot/util';
import { ContractSubmittableResult, SubmittableExtrinsic } from 'useink/core';
import { MockedFunction } from 'vitest';

export const polkadotjsHelperMocks = () => {
  const mockGetDefaultAssetBalance = getDefaultAssetBalance as MockedFunction<
    typeof getDefaultAssetBalance
  >;
  const mockXcmLocationToAssetIdNumber =
    xcmLocationToAssetIdNumber as MockedFunction<
      typeof xcmLocationToAssetIdNumber
    >;
  const mockGetTokenBalanceOfAccount =
    getTokenBalanceOfAccount as MockedFunction<typeof getTokenBalanceOfAccount>;
  const mockTransfer = transfer as MockedFunction<typeof transfer>;
  const mockCrossChainTransfer = crossChainTransfer as MockedFunction<
    typeof crossChainTransfer
  >;

  const mockSignAndSendPromise = signAndSendPromise as MockedFunction<
    typeof signAndSendPromise
  >;
  const mockBatchTransactions = batchTransactions as MockedFunction<
    typeof batchTransactions
  >;
  const mockGetExtrinsicWeight = getExtrinsicWeight as MockedFunction<
    typeof getExtrinsicWeight
  >;
  const mockGetAssetMetadata = getAssetMetadata as MockedFunction<
    typeof getAssetMetadata
  >;
  const mockExtrinsicViaProxy = extrinsicViaProxy as MockedFunction<
    typeof extrinsicViaProxy
  >;
  const mockQueryWeightToFee = queryWeightToFee as MockedFunction<
    typeof queryWeightToFee
  >;
  const mockSendXcm = sendXcm as MockedFunction<typeof sendXcm>;

  mockGetDefaultAssetBalance.mockReturnValue(
    new Promise((resolve) => resolve({ free: 1 as unknown as u128 }))
  );

  mockXcmLocationToAssetIdNumber.mockReturnValue(
    new Promise((resolve) => resolve(new BN(1)))
  );

  mockGetTokenBalanceOfAccount.mockReturnValue(
    new Promise((resolve) => resolve({ free: 1 as unknown as u128 }))
  );
  mockTransfer.mockReturnValue({} as SubmittableExtrinsic<'promise'>);

  mockCrossChainTransfer.mockReturnValue({} as SubmittableExtrinsic<'promise'>);

  mockSignAndSendPromise.mockReturnValue(
    new Promise((resolve) => resolve({} as ContractSubmittableResult))
  );
  mockBatchTransactions.mockReturnValue({} as SubmittableExtrinsic<'promise'>);

  const defaultWeight = new Weight(new BN(1), new BN(1));
  mockGetExtrinsicWeight.mockReturnValue(
    new Promise((resolve) => resolve(defaultWeight))
  );
  mockGetAssetMetadata.mockReturnValue(
    new Promise((resolve) =>
      resolve({
        additional: {
          feePerSecond: { unwrap: () => new BN(1) as unknown as u128 },
        },
      })
    )
  );
  mockExtrinsicViaProxy.mockReturnValue({
    method: { toHex: () => '0x1' },
  } as unknown as SubmittableExtrinsic<'promise'>);
  mockQueryWeightToFee.mockReturnValue(
    new Promise((resolve) => resolve(new BN(1)))
  );
  mockSendXcm.mockReturnValue({} as SubmittableExtrinsic<'promise'>);

  return {
    mockGetDefaultAssetBalance,
    mockXcmLocationToAssetIdNumber,
    mockGetTokenBalanceOfAccount,
    mockTransfer,
    mockCrossChainTransfer,
    mockSignAndSendPromise,
    mockBatchTransactions,
    mockGetExtrinsicWeight,
    mockGetAssetMetadata,
    mockExtrinsicViaProxy,
    mockQueryWeightToFee,
    mockSendXcm,
  };
};
