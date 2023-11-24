import { BN } from '@polkadot/util';

/**
 * Returns the result of doing `base*(10^power)`
 */
export const convertWithScientificNotation = (base: number, power: number) =>
  new BN(base).mul(new BN(10).pow(new BN(power)));
