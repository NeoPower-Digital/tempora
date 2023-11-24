import { AugmentedChain } from '@/lib/config/chainsConfig';
import { hexToU8a, isHex } from '@polkadot/util';
import { decodeAddress, encodeAddress } from '@polkadot/util-crypto';

/**
 * Checks if the provided address is valid.
 *
 * @param address - The address to be checked.
 *
 * @returns True if the address is valid, false otherwise.
 */
export const isValidAddress = (address: string) => {
  try {
    encodeAddress(isHex(address) ? hexToU8a(address) : decodeAddress(address));

    return true;
  } catch {
    return false;
  }
};

/**
 * Formats an address to a human readable format
 *
 * @param address
 * @returns formatted address with the first and last 6 chars
 */
export const formatAddress = (address: string): string => {
  if (!isValidAddress(address)) return address;

  return `${address.slice(0, 6)}...${address.slice(-6)}`;
};

/**
 * Encode address with the parachain prefix
 *
 * @param substrateAddress
 * @param parachain
 * @returns Address in the format of the parachain.
 *          In case of an error, the substrate address without encoding.
 */
export const getParachainAddress = (
  substrateAddress: string = '',
  parachain: AugmentedChain
) => {
  if (!substrateAddress || !isValidAddress(substrateAddress))
    return substrateAddress;

  const publicKey = decodeAddress(substrateAddress);

  try {
    return encodeAddress(publicKey, parachain.prefix);
  } catch {
    // It will fail when it's an Ethereum address
    return substrateAddress;
  }
};
