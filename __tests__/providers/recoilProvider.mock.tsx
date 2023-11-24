import { AugmentedChain } from '@/lib/config/chainsConfig';
import { ChainConfiguration } from '@/lib/hooks/useChainsConfig';
import chainsConfigState from '@/lib/state/chainsConfig.atom';
import proxyAccountsState, {
  ProxyAccountsState,
} from '@/lib/state/proxyAccounts.atom';
import { XcmV3MultiLocation } from '@polkadot/types/lookup';
import { BN } from '@polkadot/util';
import { FC } from 'react';
import { RecoilRoot } from 'recoil';

const getRecoilProvider = (
  proxyAccountsInitialState?: ProxyAccountsState,
  chainsConfigInitialState?: {
    originConfig: ChainConfiguration;
    targetConfig: ChainConfiguration;
  }
) => {
  const RecoilProvider: FC<{
    children: React.ReactNode;
  }> = ({ children }) => (
    <RecoilRoot
      initializeState={({ set }) => {
        if (proxyAccountsInitialState)
          set(proxyAccountsState, proxyAccountsInitialState);

        if (chainsConfigInitialState)
          set(chainsConfigState, chainsConfigInitialState);
      }}
    >
      {children}
    </RecoilRoot>
  );

  return RecoilProvider;
};

const chainDefaultValue = {
  chain: {
    xcmConfiguration: {
      xcmInstructionWeight: {
        proofSize: new BN(1),
        refTime: new BN(1),
      },
    },
  } as AugmentedChain,
  decimals: 12,
  getDefaultAsset: () => ({}) as XcmV3MultiLocation,
  getParachainAddress: () => '',
  getApi: () => undefined,
};

export const mockChainsConfigInitialState = {
  originConfig: chainDefaultValue,
  targetConfig: chainDefaultValue,
};

export default getRecoilProvider;
