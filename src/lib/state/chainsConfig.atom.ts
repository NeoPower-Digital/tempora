import { XcmV3MultiLocation } from '@polkadot/types/lookup';
import { BN } from '@polkadot/util';
import { atom, selector } from 'recoil';
import { AugmentedChain } from '../config/chainsConfig';
import { ChainConfiguration } from '../hooks/useChainsConfig';

const defaultValue: ChainConfiguration = {
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

const chainsConfigState = atom<{
  originConfig: ChainConfiguration;
  targetConfig: ChainConfiguration;
}>({
  key: 'chainsConfigState',
  default: {
    originConfig: defaultValue,
    targetConfig: defaultValue,
  },
});

export const chainsApiReady = selector<boolean>({
  key: 'chainsApiReady',
  get: ({ get }) => {
    const { originConfig, targetConfig } = get(chainsConfigState);
    return !!originConfig.getApi() && !!targetConfig.getApi();
  },
});

export default chainsConfigState;
