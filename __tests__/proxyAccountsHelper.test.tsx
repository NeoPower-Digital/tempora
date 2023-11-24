import { AugmentedChain, XcmConfiguration } from '@/lib/config/chainsConfig';
import { RelayChain } from '@/lib/constants/chains.const';
import { XCM_LOCATION } from '@/lib/constants/xcm.const';
import {
  createProxyAccount,
  getCrossChainTransferParameters,
  getDerivativeAccountV3,
  validateProxyAccount,
} from '@/lib/helpers/proxyAccounts.helper';
import { ApiPromise } from '@polkadot/api';
import { beforeEach } from 'node:test';
import { Astar } from 'useink/chains';
import { SubmittableExtrinsic, WalletAccount } from 'useink/core';
import { describe, expect, it, vi } from 'vitest';
import { polkadotjsHelperMocks } from './mocks/polkadotjsHelper.mock';

vi.mock('@/lib/helpers/polkadotjs.helper');

const { mockSignAndSendPromise } = polkadotjsHelperMocks();

const mockProxyAccountAddress =
  '9oGoHPrAWE3Q7CfgokHWAs1hZKZ6RNoQHzmfrVcy2QKsF7n';

const mockApi = (proxyAccountAddress: string = mockProxyAccountAddress) =>
  ({
    query: {
      proxy: {
        proxies: () => [[{ proxyType: 'Any', delegate: proxyAccountAddress }]],
      },
    },
    tx: {
      proxy: {
        addProxy: () => ({}) as SubmittableExtrinsic<'promise'>,
      },
    },
  }) as unknown as ApiPromise;

const mockAccount: WalletAccount = {
  address: '0x123456',
  source: 'Source test',
};

describe('proxyAccountsHelper', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('validateProxyAcocunt', () => {
    it('should validate existing proxy account, when the account exists', async () => {
      // Act
      const result = await validateProxyAccount(
        '',
        mockProxyAccountAddress,
        mockApi()
      );

      // Assert
      expect(result).toBe(true);
    });

    it('should validate non existing proxy account, when the account does not exist', async () => {
      // Act
      const result = await validateProxyAccount('', '', mockApi());

      // Assert
      expect(result).toBe(false);
    });
  });

  it('should createProxyAccount, when called', async () => {
    // Act
    await createProxyAccount(mockAccount, mockApi(), mockProxyAccountAddress);

    // Assert
    expect(mockSignAndSendPromise).toHaveBeenCalledTimes(1);
    expect(mockSignAndSendPromise).toHaveBeenCalledWith({}, mockAccount);
  });

  it('should getDerivativeAccountV3 and be deterministic, when called with a known account', () => {
    // Arrange
    const mockChain: AugmentedChain = {
      ...Astar,
      prefix: 1,
      relayChain: RelayChain.Kusama,
      xcmConfiguration: {} as XcmConfiguration,
    };

    // Act
    const result = getDerivativeAccountV3(
      mockAccount,
      mockChain.paraId!,
      mockChain.prefix
    );

    // Assert
    expect(result).toBe(mockProxyAccountAddress);
  });

  it('should getCrossChainTransferParameters with xcm locations, when called with known parameters', () => {
    // Arrange
    const expected = [
      {
        V3: XCM_LOCATION.CONCRETE_FUNGIBLE_ASSET(XCM_LOCATION.HERE(), 1),
      },
      {
        V3: XCM_LOCATION.ACCOUNT_X2(1, '0x8000'),
      },
    ];

    // Act
    const result = getCrossChainTransferParameters(1, '0x8000', 1);

    // Assert
    expect(result).toEqual(expected);
  });
});
