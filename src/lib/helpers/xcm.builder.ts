import { XcmV3MultiLocation } from '@polkadot/types/lookup';
import { BN } from '@polkadot/util';
import { SubmittableExtrinsic } from 'useink/core';
import { XCM_LOCATION } from '../constants/xcm.const';
import Weight from '../models/weight.model';

/**
 * Enumerates the types of weight limits for transactions.
 */
/* eslint-disable no-unused-vars */
export enum WeightLimitType {
  Limited,
  Unlimited,
}

/**
 * Helper class for building XCM messages
 */
export class XcmBuilder {
  private xcmMessage: any;

  private withdrawAssetsArray: ReturnType<
    typeof XCM_LOCATION.CONCRETE_FUNGIBLE_ASSET
  >[];
  private buyExecutionObject?: {
    BuyExecution: {
      fees: ReturnType<typeof XCM_LOCATION.CONCRETE_FUNGIBLE_ASSET>;
      weightLimit: {
        [key in keyof typeof WeightLimitType]?: Weight;
      };
    };
  };
  private transactObject?: {
    Transact: ReturnType<typeof XCM_LOCATION.TRANSACT>;
  };
  private refundSurplusObject?: { RefundSurplus: string };
  private depositAssetObject?: {
    DepositAsset: ReturnType<typeof XCM_LOCATION.DEPOSIT_ASSET>;
  };

  constructor() {
    this.xcmMessage = {
      V3: [],
    };
    this.withdrawAssetsArray = [];
  }

  /**
   * Builds the XCM message
   * @returns The XCM message
   */
  public build() {
    this.xcmMessage.V3.push({ WithdrawAsset: this.withdrawAssetsArray });

    if (this.buyExecutionObject) {
      this.xcmMessage.V3.push(this.buyExecutionObject);
    }

    if (this.transactObject) {
      this.xcmMessage.V3.push(this.transactObject);
    }

    if (this.refundSurplusObject) {
      this.xcmMessage.V3.push(this.refundSurplusObject);
    }

    if (this.depositAssetObject) {
      this.xcmMessage.V3.push(this.depositAssetObject);
    }

    return this.xcmMessage;
  }

  /**
   * Adds an Asset to the WithdrawAsset instruction of the XCM message
   * @param assetLocation - The location of the asset to withdraw
   * @param assetsAmount - The amount of assets to withdraw
   * @returns XcmBuilder instance
   */
  public addWithdrawAsset(assetLocation: XcmV3MultiLocation, assetsAmount: BN) {
    this.withdrawAssetsArray.push(
      XCM_LOCATION.CONCRETE_FUNGIBLE_ASSET(assetLocation, assetsAmount)
    );

    return this;
  }

  /**
   * Adds a BuyExecution instruction to the XCM message
   * @param assetLocation - The location of the asset to buy
   * @param assetsAmount - The amount of assets to buy
   * @param weightLimitType - The type of weight limit
   * @param weightLimit - The weight amount
   * @returns XcmBuilder instance
   */
  public addBuyExecution(
    assetLocation: XcmV3MultiLocation,
    assetsAmount: BN,
    weightLimitType: WeightLimitType,
    weightLimit: Weight
  ) {
    this.buyExecutionObject = {
      BuyExecution: {
        fees: XCM_LOCATION.CONCRETE_FUNGIBLE_ASSET(assetLocation, assetsAmount),
        weightLimit: {
          [WeightLimitType[weightLimitType]]: weightLimit,
        },
      },
    };

    return this;
  }

  /**
   * Adds a Transact instruction to the XCM message
   * @param weight - The weight amount
   * @param extrinsic - The extrinsic to transact
   * @returns XcmBuilder instance
   */
  public addTransact(
    weight: Weight,
    extrinsic: SubmittableExtrinsic<'promise'>
  ) {
    this.transactObject = {
      Transact: XCM_LOCATION.TRANSACT(weight, extrinsic),
    };

    return this;
  }

  /**
   * Adds a RefundSurplus instruction to the XCM message
   * @returns XcmBuilder instance
   */
  public addRefundSurplus() {
    this.refundSurplusObject = { RefundSurplus: '' };

    return this;
  }

  /**
   * Adds a DepositAsset instruction to the XCM message
   * @param accountAddress - The address of the account to deposit the asset
   * @returns XcmBuilder instance
   */
  public addDepositAsset(accountAddress: string) {
    this.depositAssetObject = {
      DepositAsset: XCM_LOCATION.DEPOSIT_ASSET(accountAddress),
    };

    return this;
  }
}
