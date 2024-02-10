import { AugmentedChain } from '@/lib/config/chainsConfig';
import { XCM_LOCATION } from '@/lib/constants/xcm.const';
import { signAndSendPromise } from '@/lib/helpers/polkadotjs.helper';
import Keyring from '@polkadot/keyring';
import { TypeRegistry } from '@polkadot/types';
import { PalletProxyProxyDefinition } from '@polkadot/types/lookup';
import { AnyNumber } from '@polkadot/types/types';
import { blake2AsU8a, decodeAddress } from '@polkadot/util-crypto';
import { ApiPromise, WalletAccount } from 'useink/core';

/**
 * Calculates proxy accounts for a given origin and target chain.
 *
 * @remarks
 * We use XCM V3 derivation function
 *
 * @param originChain - The origin chain details obtained from `chainsConfig` atom state.
 * @param targetChain - The target chain details obtained from `chainsConfig` atom state.
 * @param account - The connected and active account.
 * @param targetApi - The target chain api.
 *
 * @returns An object containing the origin and target proxy addresses.
 */
export const calculateProxyAccounts = (
  originChain: AugmentedChain,
  targetChain: AugmentedChain,
  account: WalletAccount
) => {
  return {
    originProxyAddress: getDerivativeAccount(
      account,
      targetChain.paraId!,
      originChain.prefix
    ),
    targetProxyAddress: getDerivativeAccount(
      account,
      originChain.paraId!,
      targetChain.prefix
    ),
  };
};

/**
 * Validates a proxy account against a given address on the parachain.
 *
 * @param addressOnParachain - The address on the parachain to search for derivated proxies.
 * @param proxyAccountAddress - The proxy account address to validate.
 * @param api - The api of the chain.
 * @returns A boolean indicating whether the proxy account is already created.
 */
export const validateProxyAccount = async (
  addressOnParachain: string,
  proxyAccountAddress: string,
  api: ApiPromise
) => {
  const proxies = await api.query.proxy.proxies(addressOnParachain);

  const proxyAccounts = proxies[0];

  return proxyAccounts.some(
    (pa: PalletProxyProxyDefinition) =>
      // TODO Investigate if an specific permission exists instead of Any to call a contract
      pa.proxyType.toString() === 'Any' &&
      pa.delegate.toString() == proxyAccountAddress
  );
};

/**
 * Creates a proxy account with the specified permissions for a given account using the provided API.
 *
 * @param account - The wallet account used to sign the creation of the proxy account.
 * @param api - The api of the chain.
 * @param proxyAccountAddress - The address of the proxy account to be created.
 * @param proxyAccountType - The permissions allowed for the proxy account (default is 'Any').
 * @returns A promise that resolves when the proxy account creation is complete.
 */
export const createProxyAccount = async (
  account: WalletAccount,
  api: ApiPromise,
  proxyAccountAddress: string,
  proxyAccountType: 'Any' | 'NonTransfer' | 'Governance' | 'Staking' = 'Any'
) => {
  const addProxyExtrinsinc = api.tx.proxy.addProxy(
    proxyAccountAddress,
    proxyAccountType,
    0
  );

  return await signAndSendPromise(addProxyExtrinsinc, account);
};

/**
 * Generates a derivative account address for a given account and destination parachain using XCM V3.
 *
 * @param account - The wallet account for which the derivative account is generated.
 * @param destinationParachainId - The ID of the destination parachain.
 * @param chainPrefix - The prefix of the destination chain.
 * @returns The generated derivative account address.
 */
export const getDerivativeAccount = (
  account: WalletAccount,
  destinationParachainId: number,
  chainPrefix: number
): string => {
  const keyring = new Keyring({ type: 'sr25519' });

  // TODO Will need to consider EVM Accounts with 20 bytes
  const accountType = 'AccountId32';
  const decodedAddress = decodeAddress(account.address);

  const registry = new TypeRegistry();
  const toHash = new Uint8Array([
    // TODO Export to constant to consider ParentChain and ChildChain
    ...new TextEncoder().encode('SiblingChain'),
    ...registry.createType('Compact<u32>', destinationParachainId).toU8a(),
    ...registry
      .createType('Compact<u32>', accountType.length + decodedAddress.length)
      .toU8a(),
    ...new TextEncoder().encode(accountType),
    ...decodedAddress,
  ]);

  const proxyAccountId32 = blake2AsU8a(toHash).slice(0, 32);

  return keyring.encodeAddress(proxyAccountId32, chainPrefix);
};

/**
 * Generates cross-chain transfer parameters for a given amount, decoded account address, and target parachain ID.
 *
 * @param amountToTransfer - The amount to be transferred.
 * @param decodedAccountAddress - The decoded account address for the transfer.
 * @param targetParachainId - The ID of the target parachain.
 * @returns An array of transfer parameters for cross-chain transfer.
 */
export const getCrossChainTransferParameters = (
  amountToTransfer: AnyNumber,
  decodedAccountAddress: Uint8Array,
  targetParachainId: number
) => {
  return [
    {
      V3: XCM_LOCATION.CONCRETE_FUNGIBLE_ASSET(
        XCM_LOCATION.HERE(),
        amountToTransfer
      ),
    },
    {
      V3: XCM_LOCATION.ACCOUNT_X2(targetParachainId, decodedAccountAddress),
    },
  ] as const;
};
