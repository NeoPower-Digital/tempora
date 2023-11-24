import useProxyAccounts from '@/lib/hooks/useProxyAccounts';
import { BN } from '@polkadot/util';
import { ContractSubmittableResult } from 'useink/core';
import { MockedFunction, vi } from 'vitest';

// https://vitest.dev/api/vi#vi-spyon
export const createUseProxyAccountMocks = () => {
  const mockUseProxyAccounts = useProxyAccounts as MockedFunction<
    typeof useProxyAccounts
  >;

  const mockCalculateTotalTopUpBalances = vi.fn().mockReturnValue({
    originTopUpBalance: new BN(1),
    targetTopUpBalance: new BN(1),
  });

  const mockTopUpProxyAccounts = vi
    .fn()
    .mockReturnValue(
      new Promise((resolve) => resolve({} as ContractSubmittableResult))
    );

  mockUseProxyAccounts.mockReturnValue({
    calculateProxies: vi.fn().mockReturnValue({}),
    proxiesExist: vi
      .fn()
      .mockReturnValue(
        new Promise((resolve) =>
          resolve({ originExists: true, targetExists: true })
        )
      ),
    getProxiesBalances: vi
      .fn()
      .mockReturnValue(new Promise((resolve) => resolve({}))),
    createAccounts: vi
      .fn()
      .mockReturnValue(
        new Promise((resolve) => resolve({} as ContractSubmittableResult[]))
      ),
    topUpProxyAccounts: mockTopUpProxyAccounts,
    calculateTopUpBalance: vi.fn().mockReturnValue(new BN(1)),
    calculateTotalTopUpBalances: mockCalculateTotalTopUpBalances,
    PROXY_ACCOUNT_MIN_TRANSFER_BALANCE: new BN(1),
  });

  return {
    mockUseProxyAccounts,
    mockCalculateTotalTopUpBalances,
    mockTopUpProxyAccounts,
  };
};
