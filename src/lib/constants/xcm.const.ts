import { AnyNumber } from '@polkadot/types/types';
import { decodeAddress } from '@polkadot/util-crypto';
import { ISubmittableResult, SubmittableExtrinsic } from 'useink/core';
import Weight from '../models/weight.model';

// https://github.com/paritytech/xcm-format#7-universal-consensus-location-identifiers
/**
 * Encapsulation of XCM common locations
 * @constant
 */
export const XCM_LOCATION = {
  ACCOUNT_X1: (accountAddress: string, accountNetwork?: number) => ({
    parents: 1,
    interior: {
      X1: {
        AccountId32: {
          id: decodeAddress(accountAddress),
          network: accountNetwork,
        },
      },
    },
  }),
  ACCOUNT_X2: (
    paraId: number = 0,
    decodedAccountAddress: Uint8Array,
    accountNetwork?: string
  ) => ({
    parents: 1,
    interior: {
      X2: [
        XCM_LOCATION.PARACHAIN(paraId).interior.X1,
        {
          AccountId32: {
            id: decodedAccountAddress,
            network: accountNetwork,
          },
        },
      ],
    },
  }),
  PARACHAIN: (paraId: number = 0) => ({
    parents: 1,
    interior: { X1: { Parachain: paraId } },
  }),
  CONCRETE_FUNGIBLE_ASSET: (assetLocation: any, amount: AnyNumber) => ({
    id: { Concrete: assetLocation },
    fun: {
      Fungible: amount,
    },
  }),
  HERE: () => ({ parents: 0, interior: 'Here' }),
  TRANSACT: (
    weight: Weight,
    extrinsic: SubmittableExtrinsic<'promise', ISubmittableResult>
  ) => ({
    originKind: 'SovereignAccount',
    requireWeightAtMost: weight,
    call: { encoded: extrinsic.method.toHex() },
  }),
  DEPOSIT_ASSET: (address: string) => ({
    assets: { Wild: { AllCounted: 1 } },
    maxAssets: 1,
    beneficiary: XCM_LOCATION.ACCOUNT_X1(address),
  }),
};
