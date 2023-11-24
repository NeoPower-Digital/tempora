import { XCM_LOCATION } from '@/lib/constants/xcm.const';
import {
  calculateProxyAccounts,
  createProxyAccount,
  getCrossChainTransferParameters,
  validateProxyAccount,
} from '@/lib/helpers/proxyAccounts.helper';
import { decodeAddress } from '@polkadot/util-crypto';
import { ContractSubmittableResult } from 'useink/core';
import { MockedFunction } from 'vitest';

export const proxyAccountsHelperMocks = () => {
  const mockCalculateProxyAccounts = calculateProxyAccounts as MockedFunction<
    typeof calculateProxyAccounts
  >;
  const mockValidateProxyAccount = validateProxyAccount as MockedFunction<
    typeof validateProxyAccount
  >;
  const mockCreateProxyAccount = createProxyAccount as MockedFunction<
    typeof createProxyAccount
  >;
  const mockGetCrossChainTransferParameters =
    getCrossChainTransferParameters as MockedFunction<
      typeof getCrossChainTransferParameters
    >;

  mockCalculateProxyAccounts.mockReturnValue({
    originProxyAddress: '0x888',
    targetProxyAddress: '0x111',
  });

  mockValidateProxyAccount.mockReturnValue(
    new Promise((resolve) => {
      resolve(true);
    })
  );

  mockCreateProxyAccount.mockReturnValue(
    new Promise((resolve) => {
      resolve({} as ContractSubmittableResult);
    })
  );

  mockGetCrossChainTransferParameters.mockReturnValue([
    { V3: XCM_LOCATION.CONCRETE_FUNGIBLE_ASSET(XCM_LOCATION.HERE(), 1) },
    { V3: XCM_LOCATION.ACCOUNT_X2(1, decodeAddress('0x8000')) },
  ]);

  return {
    mockValidateProxyAccount,
    mockCalculateProxyAccounts,
    mockCreateProxyAccount,
    mockGetCrossChainTransferParameters,
  };
};
