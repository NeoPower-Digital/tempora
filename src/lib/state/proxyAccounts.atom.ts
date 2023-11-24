import { atom, selector } from 'recoil';

export interface ProxyAccountsState {
  originProxyAddress: string;
  targetProxyAddress: string;
  originProxyFreeBalance?: string;
  targetProxyFreeBalance?: string;
}

const proxyAccountsState = atom<ProxyAccountsState>({
  key: 'proxyAccountsState',
  default: {
    originProxyAddress: '',
    targetProxyAddress: '',
  },
});

export const proxiesAddressCalculated = selector<boolean>({
  key: 'proxiesAddressCalculated',
  get: ({ get }) => {
    const { originProxyAddress, targetProxyAddress } = get(proxyAccountsState);
    return !!originProxyAddress && !!targetProxyAddress;
  },
});

export default proxyAccountsState;
