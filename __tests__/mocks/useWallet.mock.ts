import useWallet from '@/lib/hooks/useWallet';
import { WalletAccount } from 'useink/core';
import { MockedFunction, vi } from 'vitest';

export const mockUseWalletDefaultValue = {
  useBalance: vi.fn().mockResolvedValue(1000),
  account: {
    address: '0x123456',
    source: 'Source test',
  } as WalletAccount,
  formatBalance: vi.fn(),
  accounts: [],
  connect: vi.fn(),
  disconnect: vi.fn(),
  isConnected: true,
  setAccount: vi.fn(),
  getWallets: vi.fn(),
  getWalletBySource: vi.fn(),
};

export const createUseWalletMocks = () => {
  const mockUseWallet = useWallet as MockedFunction<typeof useWallet>;

  mockUseWallet.mockReturnValue(mockUseWalletDefaultValue);

  return { mockUseWallet };
};
