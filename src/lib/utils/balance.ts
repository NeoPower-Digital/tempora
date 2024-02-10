import { BN } from '@polkadot/util';

/**
 * Returns the result of doing `base*(10^power)`
 */
export const convertWithScientificNotation = (base: number, power: number) =>
  new BN(BigInt(Math.floor(base * Math.pow(10, power))).toString());

/**
 * Converts a number from scientific notation to a regular number without flooring.
 *
 * @param base - The base number of the scientific notation.
 * @param power - The power of 10 in the scientific notation.
 * @returns The converted number without flooring.
 */
export const convertWithScientificNotationWithoutFlooring = (
  base: number,
  power: number
) => +(base * Math.pow(10, power)).toPrecision(6);
