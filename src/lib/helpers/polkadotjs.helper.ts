import '@polkadot/api-augment';

import { ApiPromise } from '@polkadot/api';
import { XcmV3MultiLocation } from '@polkadot/types/lookup';
import { AnyNumber } from '@polkadot/types/types';
import { BN } from '@polkadot/util';
import {
  Balance,
  ContractSubmittableResult,
  ISubmittableResult,
  SubmittableExtrinsic,
  WalletAccount,
} from 'useink/core';
import { planckToDecimalFormatted } from 'useink/utils';
import { XCM_LOCATION } from '../constants/xcm.const';
import Weight from '../models/weight.model';

/**
 * Creates a transfer transaction using the balances module in the provided API.
 *
 * @param api - The API Promise for interacting with the blockchain.
 * @param destiny - The destination address for the transfer.
 * @param amount - The amount to be transferred.
 * @returns A transfer extrinsic.
 */
export const transfer = (
  api: ApiPromise,
  destiny: string,
  amount: AnyNumber
) => {
  return api.tx.balances.transfer(destiny, amount);
};

/**
 * Initiates a crosschain transfer transaction using the xTokens module in the provided API.
 *
 * @param api - The API Promise for interacting with the blockchain.
 * @param asset - The asset information for the crosschain transfer.  Use `XCM_LOCATION.CONCRETE_FUNGIBLE_ASSET` to create this parameter
 * @param destiny - The destination location for the crosschain transfer. Use `XCM_LOCATION.ACCOUNT_X2` to create this parameter
 * @returns A crosschain transfer extrinsic.
 */
export const crossChainTransfer = (
  api: ApiPromise,
  asset: { V3: ReturnType<typeof XCM_LOCATION.CONCRETE_FUNGIBLE_ASSET> },
  destiny: {
    V3: ReturnType<typeof XCM_LOCATION.ACCOUNT_X2>;
  }
): SubmittableExtrinsic<'promise', ISubmittableResult> => {
  const DESTINY_WEIGHT_LIMIT = 'Unlimited';

  return api.tx.xTokens.transferMultiasset(
    asset,
    destiny,
    DESTINY_WEIGHT_LIMIT
  );
};

/**
 * Signs and sends a SubmittableExtrinsic using the provided account and returns a
 * promise that resolves or rejects based on the transaction result.
 *
 * @param extrinsic - The extrinsic to sign and send.
 * @param account - The wallet account used to sign the extrinsic.
 * @returns A promise that resolves with the transaction result or rejects in case of an error.
 */
export const signAndSendPromise = (
  extrinsic: SubmittableExtrinsic<'promise', ISubmittableResult>,
  account: WalletAccount
) => {
  const RESOLVE_PROMISE_STATES = ['Finalized'];
  const REJECT_PROMISE_STATES = ['Retracted', 'Dropped', 'Invalid'];

  return new Promise<ContractSubmittableResult>((resolve, reject) => {
    extrinsic
      .signAndSend(
        account.address,
        {
          signer: account.wallet?.extension?.signer,
        },
        (result: ContractSubmittableResult) => {
          const someExtrinsicFailed = result.events.some(
            (event) => event.event.method === 'ExtrinsicFailed'
          );

          if (RESOLVE_PROMISE_STATES.includes(result.status.type))
            resolve(result);

          if (
            REJECT_PROMISE_STATES.includes(result.status.type) ||
            someExtrinsicFailed
          )
            reject(result);
        }
      )
      .catch((reason) => {
        console.error(reason);
        reject(reason);
      });
  });
};

/**
 * Creates a batch transaction using the utility module in the provided API.
 *
 * @param api - The API Promise for interacting with the blockchain.
 * @param extrinsics - An array of extrinsics to include in the batch.
 * @returns A batch transaction as a SubmittableExtrinsic.
 */
export const batchTransactions = (
  api: ApiPromise,
  extrinsics: SubmittableExtrinsic<'promise', ISubmittableResult>[]
) => {
  return api.tx.utility.batchAll(extrinsics);
};

/**
 * Retrieves the asset ID number associated with a given XCM V3 multi-location
 * using the assetRegistry query in the provided API.
 *
 * @param api - The API Promise for interacting with the blockchain.
 * @param location - The XCM V3 multilocation for which to retrieve the asset ID number.
 * @returns The asset ID number associated with the provided location.
 */
export const xcmLocationToAssetIdNumber = async (
  api: ApiPromise,
  location: XcmV3MultiLocation
) => {
  const assetIdu32 = (
    await api.query.assetRegistry.locationToAssetId(location)
  ).unwrapOrDefault();
  return new BN(assetIdu32);
};
/**
 * Formats the given balance into a human-readable string with the associated chain token.
 *
 * @param api - The API Promise for interacting with the blockchain.
 * @param balance - The balance to be formatted.
 * @returns The formatted balance as a string or '-' if the balance or API is undefined.
 */
export const getFormattedBalance = (
  api: ApiPromise | undefined,
  balance?: Balance | BN | undefined
) => {
  if (!balance || !api) return '-';

  const significantFigures = balance.isZero() ? 0 : 4;

  return (
    planckToDecimalFormatted(balance.toString(), {
      api,
      significantFigures,
    }) || '-'
  );
};

/**
 * Formats the given amount into a human-readable string with the associated chain token.
 *
 * @param api - The API Promise for interacting with the blockchain.
 * @param amount - The amount to be formatted.
 * @returns The formatted amount as a string including the chain token.
 */
export const getFormattedTokenAmount = (
  api: ApiPromise,
  amount: string | number
) => {
  return `${amount} ${getTokenSymbol(api)}`;
};

/**
 * Retrieves the chain token symbol from the provided API.
 *
 * @param api - The API Promise for interacting with the blockchain.
 * @returns The chain token symbol.
 */
export const getTokenSymbol = (api: ApiPromise) => {
  return api?.registry.chainTokens[0] || '';
};

/**
 * Retrieves the token balance of a specified account for a given asset ID using the tokens module query.
 *
 * @param api - The API Promise for interacting with the blockchain.
 * @param address - The address of the account for which to retrieve the token balance.
 * @param assetId - The asset ID for which to retrieve the token balance.
 * @returns The token balance of the specified account and asset ID.
 */
export const getTokenBalanceOfAccount = (
  api: ApiPromise,
  address: string,
  assetId: number
) => api.query.tokens.accounts(address, assetId);

/**
 * Retrieves the default asset balance of a specified account using the system module query.
 *
 * @param api - The API Promise for interacting with the blockchain.
 * @param address - The address of the account for which to retrieve the default asset balance.
 * @returns The default asset balance of the specified account.
 */
export const getDefaultAssetBalance = async (
  api: ApiPromise,
  address: string
) => (await api.query.system.account(address)).data;

/**
 * Retrieves the extrinsic weight for a given SubmittableExtrinsic using the paymentInfo function.
 *
 * @param extrinsic - The SubmittableExtrinsic for which to retrieve the weight.
 * @param account - The wallet account initiating the extrinsic.
 * @returns The weight of the given extrinsic as a Weight.
 */
export const getExtrinsicWeight = async (
  extrinsic: SubmittableExtrinsic<'promise', ISubmittableResult>,
  account: WalletAccount
): Promise<Weight> => {
  const { proofSize, refTime } = (await extrinsic.paymentInfo(account!.address))
    .weight;

  return new Weight(
    new BN(refTime.unwrap().toString()),
    new BN(proofSize.unwrap().toString())
  );
};

/**
 * Retrieves the asset metadata for a specified asset ID using the assetRegistry query.
 *
 * @param api - The API Promise for interacting with the blockchain.
 * @param assetId - The asset ID for which to retrieve metadata.
 * @returns The metadata of the specified asset.
 */
export const getAssetMetadata = async (api: ApiPromise, assetId: BN) => {
  return (
    (await api.query.assetRegistry.metadata(assetId)) as any
  ).unwrapOrDefault();
};

/**
 * Creates an extrinsic to be executed via a proxy.
 *
 * @param api - The API Promise for interacting with the blockchain.
 * @param address - The address of the proxy account.
 * @param extrinsic - The SubmittableExtrinsic to be executed via the proxy.
 * @returns An extrinsic representing the proxy execution.
 */
export const extrinsicViaProxy = (
  api: ApiPromise,
  address: string,
  extrinsic: SubmittableExtrinsic<'promise', ISubmittableResult>
): SubmittableExtrinsic<'promise', ISubmittableResult> => {
  return api.tx.proxy.proxy(address, 'Any', extrinsic);
};

/**
 * Queries the weight-to-fee conversion for a given weight using the transactionPaymentApi.
 *
 * @param api - The API Promise for interacting with the blockchain.
 * @param weight - The weight for which to query the fee conversion.
 * @returns The fee conversion result.
 */
export const queryWeightToFee = async (api: ApiPromise, weight: Weight) => {
  const fee = await api.call.transactionPaymentApi.queryWeightToFee(weight);
  return new BN(fee.toString());
};

/**
 * Sends an XCM message to a specified destination using the polkadotXcm module.
 *
 * @param api - The API Promise for interacting with the blockchain.
 * @param destiny - The destination of the XCM message.
 * @param xcmMessage - The XCM message to be sent.
 * @returns An extrinsic representing the XCM message send.
 */
export const sendXcm = (
  api: ApiPromise,
  destiny: { V3: any },
  xcmMessage: any
) => {
  return api.tx.polkadotXcm.send(destiny, xcmMessage);
};
