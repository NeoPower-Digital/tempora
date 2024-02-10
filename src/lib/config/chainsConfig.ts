import Environments from '@/core/models/environment';
import { BN } from '@polkadot/util';
import {
  Chain,
  Custom,
  RococoTuringTestnet,
  ShidenKusama,
  Turing,
} from 'useink/chains';
import { RelayChain } from '../constants/chains.const';
import Weight from '../models/weight.model';

export type XcmConfiguration = {
  xcmInstructionsCount: number;
  xcmInstructionWeight: Weight;
};

export type AugmentedChain = Chain & {
  prefix: number;
  relayChain: string;
  decimals: number;
  xcmConfiguration: XcmConfiguration;
};

// CONFIGURABLE
/* Setup custom chain not listed in useink
   See https://use.ink/frontend/configuration#adding-a-custom-chain-config on how to setup a custom chain
*/
const ShibuyaDevChain: typeof Custom = {
  ...Custom,
  id: 'custom',
  name: 'Shibuya',
  paraId: 2000,
  relay: { id: RelayChain.Rococo },
  rpcs: ['ws://127.0.0.1:9948'],
};

const TuringDevChain: typeof Custom = {
  ...Custom,
  id: 'custom',
  name: 'Turing Dev',
  paraId: 2114,
  relay: { id: RelayChain.Rococo },
  rpcs: ['ws://127.0.0.1:9946'],
};

const RocstarChain: typeof Custom = {
  ...Custom,
  id: 'custom',
  name: 'Rocstar',
  paraId: 2006,
  relay: { id: RelayChain.Rococo },
  rpcs: ['wss://rocstar.astar.network'],
};

const getChainConfig = (
  chain: Chain,
  prefix: number,
  relayChain: string,
  decimals: number,
  xcmInstructionsCount: number,
  xcmInstructionWeight: Weight
): AugmentedChain => ({
  ...chain,
  prefix,
  relayChain,
  decimals,
  xcmConfiguration: {
    xcmInstructionsCount,
    xcmInstructionWeight,
  },
});

// CONFIGURABLE
/**
 * Origin Default Weight value
 *
 * **Configurable in** `chainsConfig.ts`
 *
 * @default
 * Weight(BN(1000000000), BN(65536))
 */
const originDefaultWeight = new Weight(new BN('1000000000'), new BN(65536));

// CONFIGURABLE
/**
 * Target Default Weight value
 *
 * **Configurable in** `chainsConfig.ts`
 *
 * @default
 * Weight(BN('1000000000'), BN(0))
 */
const targetDefaultWeight = new Weight(new BN('1000000000'), new BN(0));

// CONFIGURABLE
/**
 * Origin Chain configuration used accross the application.
 *
 * **Configurable in** `chainsConfig.ts`
 *
 * @see https://github.com/paritytech/ss58-registry/blob/main/ss58-registry.json for parachain prefixes
 *
 * @constant
 */
const originChains = {
  [Environments.Development]: getChainConfig(
    ShibuyaDevChain,
    5,
    RelayChain.Local,
    18,
    6,
    originDefaultWeight
  ),
  [Environments.Testing]: getChainConfig(
    RocstarChain,
    5,
    RelayChain.Rococo,
    18,
    6,
    originDefaultWeight
  ),
  [Environments.Kusama]: getChainConfig(
    ShidenKusama,
    5,
    RelayChain.Kusama,
    18,
    6,
    originDefaultWeight
  ),
} as const;

// CONFIGURABLE
/**
 * Target Chain configuration used accross the application.
 *
 * **Configurable in** `chainsConfig.ts`
 *
 * @see https://github.com/paritytech/ss58-registry/blob/main/ss58-registry.json for parachain prefixes
 *
 * @constant
 */
const targetChains = {
  [Environments.Development]: getChainConfig(
    TuringDevChain,
    51,
    RelayChain.Local,
    10,
    4,
    targetDefaultWeight
  ),
  [Environments.Testing]: getChainConfig(
    RococoTuringTestnet,
    51,
    RelayChain.Rococo,
    10,
    4,
    targetDefaultWeight
  ),
  [Environments.Kusama]: getChainConfig(
    Turing,
    51,
    RelayChain.Kusama,
    10,
    4,
    targetDefaultWeight
  ),
} as const;

export { originChains, targetChains };
