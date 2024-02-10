import {
  getExecuteContractExtrinsic,
  queryContract,
} from '@/lib/helpers/polkadotjs.contracts.helper';
import { SubmittableExtrinsic } from '@polkadot/api/types';
import { Compact, u64 } from '@polkadot/types';
import { ContractExecResultResult } from '@polkadot/types/interfaces';
import { BN } from '@polkadot/util';
import { MockedFunction } from 'vitest';

export const contractHelperMocks = () => {
  const defaultCompactU64: Compact<u64> = {
    unwrap: () => 1 as unknown as u64,
  };

  const mockQueryContract = queryContract as MockedFunction<
    typeof queryContract
  >;
  const mockGetExecuteContractExtrinsic =
    getExecuteContractExtrinsic as MockedFunction<
      typeof getExecuteContractExtrinsic
    >;

  mockQueryContract.mockReturnValue(
    new Promise((resolve) =>
      resolve({
        gasConsumed: {
          proofSize: defaultCompactU64,
          refTime: defaultCompactU64,
        },
        gasRequired: {
          proofSize: defaultCompactU64,
          refTime: defaultCompactU64,
        },
        storageDeposit: new BN(1),
        debugMessage: new Text(''),
        result: {} as ContractExecResultResult,
      })
    )
  );

  mockGetExecuteContractExtrinsic.mockReturnValue(
    {} as SubmittableExtrinsic<'promise'>
  );

  return {
    mockQueryContract,
    mockGetExecuteContractExtrinsic,
  };
};
