import { getParachainAddress } from '@/lib/utils/address';
import {
  rpc as oakRpc,
  runtime as oakRuntime,
  types as oakTypes,
} from '@oak-network/types';
import { ApiPromise } from '@polkadot/api';
import { XcmV3MultiLocation } from '@polkadot/types/lookup';
import { useEffect } from 'react';
import { useSetRecoilState } from 'recoil';
import { useChainDecimals } from 'useink';
import { Chain } from 'useink/chains';
import {
  AugmentedChain,
  originChains,
  targetChains,
} from '../config/chainsConfig';
import { XCM_LOCATION } from '../constants/xcm.const';
import chainsConfigState from '../state/chainsConfig.atom';
import getApi from '../utils/api';

export interface ChainConfiguration {
  chain: AugmentedChain;
  decimals?: number;
  getDefaultAsset: () => XcmV3MultiLocation;
  // eslint-disable-next-line no-unused-vars
  getParachainAddress: (address: string) => string;
  getApi: () => ApiPromise | undefined;
}

/**
 * Configures globally the origin and target chains configuration, making it available
 * in chainsConfigState atom state. Also gets the async properties needed
 *
 * @returns origin chain configuration
 */
const useChainsConfig = () => {
  const environment = process.env.NEXT_PUBLIC_CHAIN_ENVIRONMENT;

  const originChain = originChains[environment];
  const targetChain = targetChains[environment];

  const setChainsConfigState = useSetRecoilState(chainsConfigState);

  const originConfig = {
    ...useGetCommonChainConfigs(originChain),
  };

  const targetConfig = {
    ...useGetCommonChainConfigs(targetChain),
  };

  useEffect(() => {
    setChainsConfigState((current) => ({
      originConfig: {
        ...current.originConfig,
        ...originConfig,
      },
      targetConfig: {
        ...current.targetConfig,
        ...targetConfig,
      },
    }));

    /**
     * Load async properties to avoid awaiting them across the app
     */
    const loadAsyncProperties = async () => {
      const originApi = await getApi(originChain.rpcs[0]);
      const targetApi = await getApi(
        targetChain.rpcs[0],
        oakRpc,
        oakTypes,
        oakRuntime
      );

      setChainsConfigState((current) => ({
        originConfig: {
          ...current.originConfig,
          getApi: () => originApi,
          getDefaultAsset: () =>
            getDefaultAssetLocation(originChain, originApi),
        },
        targetConfig: {
          ...current.targetConfig,
          getApi: () => targetApi,
        },
      }));
    };

    loadAsyncProperties();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return originChain;
};

const useGetCommonChainConfigs = (chain: AugmentedChain) => ({
  chain,
  getParachainAddress: (address?: string) =>
    getParachainAddress(address, chain),
  decimals: useChainDecimals(chain.id) || chain.decimals,
});

const getDefaultAssetLocation = (
  chain: Chain,
  api: ApiPromise
): XcmV3MultiLocation => {
  return api.createType(
    'XcmV3MultiLocation',
    XCM_LOCATION.PARACHAIN(chain.paraId)
  );
};

export default useChainsConfig;
