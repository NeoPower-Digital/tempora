import useProxyAccounts from '@/lib/hooks/useProxyAccounts';
import { ProxyAccountsState } from '@/lib/state/proxyAccounts.atom';
import { ApiPromise } from '@polkadot/api';
import { BN } from '@polkadot/util';
import { renderHook } from '@testing-library/react';
import { RecoilRoot } from 'recoil';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { polkadotjsHelperMocks } from './mocks/polkadotjsHelper.mock';
import { proxyAccountsHelperMocks } from './mocks/proxyAccountsHelper.mock';
import {
  createUseWalletMocks,
  mockUseWalletDefaultValue,
} from './mocks/useWallet.mock';
import getRecoilProvider, {
  mockChainsConfigInitialState,
} from './providers/recoilProvider.mock';

vi.mock('@/lib/hooks/useWallet');
vi.mock('@/lib/helpers/proxyAccounts.helper');
vi.mock('@/lib/helpers/polkadotjs.helper');

const {
  mockCalculateProxyAccounts,
  mockCreateProxyAccount,
  mockValidateProxyAccount,
} = proxyAccountsHelperMocks();

const {
  mockCrossChainTransfer,
  mockGetDefaultAssetBalance,
  mockGetTokenBalanceOfAccount,
  mockSignAndSendPromise,
  mockTransfer,
  mockXcmLocationToAssetIdNumber,
} = polkadotjsHelperMocks();

const { mockUseWallet } = createUseWalletMocks();

const defaultProxyAccountsState: ProxyAccountsState = {
  originProxyAddress: '',
  targetProxyAddress: '',
  originProxyFreeBalance: '0',
  targetProxyFreeBalance: '0',
};

describe('useProxyAccounts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('calculateProxies', () => {
    it('should calculate proxy accounts, when an account has been connected', () => {
      // Arrange
      const { result } = renderHook(() => useProxyAccounts(), {
        wrapper: getRecoilProvider(undefined, {
          ...mockChainsConfigInitialState,
          targetConfig: {
            ...mockChainsConfigInitialState.targetConfig,
            getApi: () => ({}) as ApiPromise,
          },
        }),
      });

      // Act
      result.current.calculateProxies();

      // Assert
      expect(mockCalculateProxyAccounts).toHaveBeenCalledTimes(1);
    });

    it('should not calculate proxy accounts, when no account has been connected', () => {
      // Arrange
      mockUseWallet.mockReturnValueOnce({
        ...mockUseWalletDefaultValue,
        account: undefined,
      });

      const { result } = renderHook(() => useProxyAccounts(), {
        wrapper: RecoilRoot,
      });

      // Act
      result.current.calculateProxies();

      // Assert
      expect(mockCalculateProxyAccounts).toHaveBeenCalledTimes(0);
    });
  });

  describe('proxiesExists', () => {
    it('should validate existing proxies, when both accounts exist', async () => {
      // Arrange
      const { result } = renderHook(() => useProxyAccounts(), {
        wrapper: RecoilRoot,
      });

      // Act
      const [originExists, targetExists] = [true, true];
      const proxiesExist = await result.current.proxiesExist();

      // Assert
      expect(mockValidateProxyAccount).toHaveBeenCalledTimes(2);
      expect(proxiesExist).toEqual({ originExists, targetExists });
    });

    it('should validate existing proxies, when only origin account exists', async () => {
      // Arrange
      const { result } = renderHook(() => useProxyAccounts(), {
        wrapper: RecoilRoot,
      });

      const [originExists, targetExists] = [true, false];
      mockValidateProxyAccount
        .mockReturnValueOnce(new Promise((resolve) => resolve(originExists)))
        .mockReturnValueOnce(new Promise((resolve) => resolve(targetExists)));

      // Act
      const proxiesExist = await result.current.proxiesExist();

      // Assert
      expect(mockValidateProxyAccount).toHaveBeenCalledTimes(2);
      expect(proxiesExist).toEqual({ originExists, targetExists });
    });

    it('should validate existing proxies, when only target account exists', async () => {
      // Arrange
      const { result } = renderHook(() => useProxyAccounts(), {
        wrapper: RecoilRoot,
      });

      const [originExists, targetExists] = [false, true];
      mockValidateProxyAccount
        .mockReturnValueOnce(new Promise((resolve) => resolve(originExists)))
        .mockReturnValueOnce(new Promise((resolve) => resolve(targetExists)));

      // Act
      const proxiesExist = await result.current.proxiesExist();

      // Assert
      expect(mockValidateProxyAccount).toHaveBeenCalledTimes(2);
      expect(proxiesExist).toEqual({ originExists, targetExists });
    });

    it('should validate non existing proxies, when no account exists', async () => {
      // Arrange
      const { result } = renderHook(() => useProxyAccounts(), {
        wrapper: RecoilRoot,
      });

      mockValidateProxyAccount.mockReturnValue(
        new Promise((resolve) => resolve(false))
      );

      // Act
      const [originExists, targetExists] = [false, false];
      const proxiesExist = await result.current.proxiesExist();

      // Assert
      expect(mockValidateProxyAccount).toHaveBeenCalledTimes(2);
      expect(proxiesExist).toEqual({ originExists, targetExists });
    });
  });

  describe('getProxiesBalances', () => {
    it('should get balances, when called', async () => {
      // Arrange
      const { result } = renderHook(() => useProxyAccounts(), {
        wrapper: RecoilRoot,
      });

      // Act
      await result.current.getProxiesBalances();

      // Assert
      expect(mockGetDefaultAssetBalance).toHaveBeenCalledTimes(1);
      expect(mockXcmLocationToAssetIdNumber).toHaveBeenCalledTimes(1);
      expect(mockGetTokenBalanceOfAccount).toHaveBeenCalledTimes(1);
    });
  });

  describe('createAccounts', () => {
    it('should create both accounts, when no proxy account exists', async () => {
      // Arrange
      const { result } = renderHook(() => useProxyAccounts(), {
        wrapper: RecoilRoot,
      });

      // Act
      const [originExists, targetExists] = [false, false];
      await result.current.createAccounts(originExists, targetExists);

      // Assert
      expect(mockCreateProxyAccount).toHaveBeenCalledTimes(2);
    });

    it('should create one account, when only origin exists', async () => {
      // Arrange
      const { result } = renderHook(() => useProxyAccounts(), {
        wrapper: RecoilRoot,
      });

      // Act
      const [originExists, targetExists] = [true, false];
      await result.current.createAccounts(originExists, targetExists);

      // Assert
      expect(mockCreateProxyAccount).toHaveBeenCalledTimes(1);
    });

    it('should create one account, when only target exists', async () => {
      // Arrange
      const { result } = renderHook(() => useProxyAccounts(), {
        wrapper: RecoilRoot,
      });

      // Act
      const [originExists, targetExists] = [false, true];
      await result.current.createAccounts(originExists, targetExists);

      // Assert
      expect(mockCreateProxyAccount).toHaveBeenCalledTimes(1);
    });

    it('should not create any account, when both proxy accounts exist', async () => {
      // Arrange
      const { result } = renderHook(() => useProxyAccounts(), {
        wrapper: RecoilRoot,
      });

      // Act
      const [originExists, targetExists] = [true, true];
      await result.current.createAccounts(originExists, targetExists);

      // Assert
      expect(mockCreateProxyAccount).toHaveBeenCalledTimes(0);
    });
  });

  describe('calculateTopUpBalance', () => {
    it('should return the initial balance, when the current balance is zero and the initial balance is greater than the required balance for fee', () => {
      // Arrange
      const { result } = renderHook(() => useProxyAccounts(), {
        wrapper: RecoilRoot,
      });

      const requiredBalanceForFee = new BN(1);
      const currentBalance = new BN(0).toString();
      const initialBalance = new BN(10);

      // Act
      const topUpBalance = result.current.calculateTopUpBalance(
        requiredBalanceForFee,
        currentBalance,
        initialBalance
      );

      // Assert
      expect(topUpBalance).toEqual(initialBalance);
    });

    it('should return the required balance for fee, when the current balance is zero and the initial balance is smaller than the required balance for fee', () => {
      // Arrange
      const { result } = renderHook(() => useProxyAccounts(), {
        wrapper: RecoilRoot,
      });

      const requiredBalanceForFee = new BN(10);
      const currentBalance = new BN(0).toString();
      const initialBalance = new BN(1);

      // Act
      const topUpBalance = result.current.calculateTopUpBalance(
        requiredBalanceForFee,
        currentBalance,
        initialBalance
      );

      // Assert
      expect(topUpBalance).toEqual(requiredBalanceForFee);
    });

    it('should return the minimum transfer balance for proxy accounts, when the current balance is different than zero and smaller than the required balance for fee, and the difference between the required balance for fee and the current balance is smaller than the minimum transfer balance for proxy accounts', () => {
      // Arrange
      const { result } = renderHook(() => useProxyAccounts(), {
        wrapper: RecoilRoot,
      });

      const requiredBalanceForFee = new BN(Math.pow(10, 10) * 2);
      const currentBalance = new BN(Math.pow(10, 10)).toString();
      const initialBalance = new BN(0);

      // Act
      const topUpBalance = result.current.calculateTopUpBalance(
        requiredBalanceForFee,
        currentBalance,
        initialBalance
      );

      // Assert
      expect(
        topUpBalance!.eq(result.current.PROXY_ACCOUNT_MIN_TRANSFER_BALANCE)
      );
    });

    it('should return the difference between the required balance for fee and the current balance, when the current balance is different than zero and smaller than the required balance for fee, and the difference between the required balance for fee and the current balance is greater than the minimum transfer balance for proxy accounts', () => {
      // Arrange
      const { result } = renderHook(() => useProxyAccounts(), {
        wrapper: RecoilRoot,
      });

      const requiredBalanceForFee = new BN(Math.pow(10, 11));
      const currentBalance = new BN(Math.pow(10, 10)).toString();
      const initialBalance = new BN(0);

      // Act
      const topUpBalance = result.current.calculateTopUpBalance(
        requiredBalanceForFee,
        currentBalance,
        initialBalance
      );

      const difference = requiredBalanceForFee.sub(new BN(currentBalance));

      // Assert
      expect(topUpBalance!.eq(difference));
    });

    it('should return undefined, when the current balance is different than zero and greater than the required balance for fee', () => {
      // Arrange
      const { result } = renderHook(() => useProxyAccounts(), {
        wrapper: RecoilRoot,
      });

      const requiredBalanceForFee = new BN(Math.pow(10, 10));
      const currentBalance = new BN(Math.pow(10, 11)).toString();
      const initialBalance = new BN(0);

      // Act
      const topUpBalance = result.current.calculateTopUpBalance(
        requiredBalanceForFee,
        currentBalance,
        initialBalance
      );

      // Assert
      expect(topUpBalance).toBeUndefined();
    });
  });

  describe('topUpProxyAccounts', () => {
    it('should topup both proxy accounts, when receive concrete balances for both chains', async () => {
      // Arrange
      const { result } = renderHook(() => useProxyAccounts(), {
        wrapper: getRecoilProvider({
          ...defaultProxyAccountsState,
          originProxyAddress: '0x1000',
          targetProxyAddress: '0x1000',
        }),
      });

      // Act
      const [originTopUpBalance, targetTopUpBalance] = [new BN(1), new BN(1)];
      const topUpProxyAccountsExtrinsicsResult =
        await result.current.getTopUpProxyAccountsExtrinsics(
          originTopUpBalance,
          targetTopUpBalance
        );

      // Assert
      expect(mockTransfer).toHaveBeenCalledTimes(1);
      expect(mockCrossChainTransfer).toHaveBeenCalledTimes(1);
      expect(topUpProxyAccountsExtrinsicsResult).toHaveLength(2);
    });

    it('should topup origin proxy account, when receive only balance for origin chain', async () => {
      // Arrange
      const { result } = renderHook(() => useProxyAccounts(), {
        wrapper: getRecoilProvider({
          ...defaultProxyAccountsState,
          originProxyAddress: '0x1000',
        }),
      });

      // Act
      const [originTopUpBalance, targetTopUpBalance] = [new BN(1), undefined];
      const topUpProxyAccountsExtrinsicsResult =
        await result.current.getTopUpProxyAccountsExtrinsics(
          originTopUpBalance,
          targetTopUpBalance
        );

      // Assert
      expect(mockTransfer).toHaveBeenCalledTimes(1);
      expect(mockCrossChainTransfer).toHaveBeenCalledTimes(0);
      expect(topUpProxyAccountsExtrinsicsResult).toHaveLength(1);
    });

    it('should topup target proxy account, when receive only balance for target chain', async () => {
      // Arrange
      const { result } = renderHook(() => useProxyAccounts(), {
        wrapper: getRecoilProvider({
          ...defaultProxyAccountsState,
          targetProxyAddress: '0x1000',
        }),
      });

      // Act
      const [originTopUpBalance, targetTopUpBalance] = [undefined, new BN(1)];
      const topUpProxyAccountsExtrinsicsResult =
        await result.current.getTopUpProxyAccountsExtrinsics(
          originTopUpBalance,
          targetTopUpBalance
        );

      // Assert
      expect(mockTransfer).toHaveBeenCalledTimes(0);
      expect(mockCrossChainTransfer).toHaveBeenCalledTimes(1);
      expect(topUpProxyAccountsExtrinsicsResult).toHaveLength(1);
    });

    it('should not topup proxy accounts, when receive both balances with undefined values', async () => {
      // Arrange
      const { result } = renderHook(() => useProxyAccounts(), {
        wrapper: getRecoilProvider({
          ...defaultProxyAccountsState,
          originProxyAddress: '0x1000',
          targetProxyAddress: '0x1000',
        }),
      });

      // Act
      const [originTopUpBalance, targetTopUpBalance] = [undefined, undefined];
      const topUpProxyAccountsExtrinsicsResult =
        await result.current.getTopUpProxyAccountsExtrinsics(
          originTopUpBalance,
          targetTopUpBalance
        );

      // Assert
      expect(mockTransfer).toHaveBeenCalledTimes(0);
      expect(mockCrossChainTransfer).toHaveBeenCalledTimes(0);
      expect(topUpProxyAccountsExtrinsicsResult).toHaveLength(0);
    });
  });
});
