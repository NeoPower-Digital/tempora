import {
  getExecuteContractExtrinsic,
  queryContract,
} from '@/lib/helpers/polkadotjs.contracts.helper';
import Weight from '@/lib/models/weight.model';
import BN from 'bn.js';
import {
  ContractExecResult,
  ISubmittableResult,
  SubmittableExtrinsic,
} from 'useink/core';
import { MockedFunction } from 'vitest';

export const polkadotjsContractsHelperMocks = () => {
  const getExecuteContractExtrinsicMock =
    getExecuteContractExtrinsic as MockedFunction<
      typeof getExecuteContractExtrinsic
    >;
  const queryContractMock = queryContract as MockedFunction<
    typeof queryContract
  >;

  getExecuteContractExtrinsicMock.mockReturnValue(
    {} as SubmittableExtrinsic<'promise', ISubmittableResult>
  );

  queryContractMock.mockReturnValue(
    new Promise((resolve) =>
      resolve({
        gasRequired: new Weight(new BN(0), new BN(0)),
      } as unknown as ContractExecResult)
    )
  );

  return {
    queryContractMock,
    getExecuteContractExtrinsicMock,
  };
};
