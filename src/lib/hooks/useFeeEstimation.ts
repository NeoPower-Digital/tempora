import {
  getAssetMetadata,
  getExtrinsicWeight,
  getXcmExtrinsicTotalWeight,
  queryWeightToFee,
  xcmLocationToAssetIdNumber,
} from '@/lib/helpers/polkadotjs.helper';
import { u128 } from '@polkadot/types';
import { BN } from '@polkadot/util';
import { useRecoilValue } from 'recoil';
import { ISubmittableResult, SubmittableExtrinsic } from 'useink/core';
import Weight from '../models/weight.model';
import chainsConfigState from '../state/chainsConfig.atom';
import useWallet from './useWallet';

export interface FeeEstimation {
  extrinsicWeight: Weight;
  totalXcmExtrinsicWeight: Weight;
  totalXcmExtrinsicFee: BN;
}

/**
 * Hook for estimating fees for origin and target chain extrinsics.
 *
 * @returns methods to obtain fees estimation in both origin and target chains
 */
const useFeeEstimation = () => {
  const { account } = useWallet();
  const { originConfig, targetConfig } = useRecoilValue(chainsConfigState);

  /**
   * Retrieves fee estimation details for an extrinsic in the origin parachain, including weights and fees.
   *
   * @param extrinsic - The extrinsic for fee estimation
   * @returns Fee estimation details for the origin chain
   */
  const getOriginExtrinsicFeeEstimation = async (
    extrinsic: SubmittableExtrinsic<'promise', ISubmittableResult>
  ): Promise<FeeEstimation> => {
    const extrinsicWeight = await getExtrinsicWeight(extrinsic, account!);

    const totalXcmWeight = getXcmExtrinsicTotalWeight(
      extrinsicWeight,
      originConfig.chain.xcmConfiguration.xcmInstructionWeight,
      targetConfig.chain.xcmConfiguration.xcmInstructionsCount
    );

    const totalXcmFee = await queryWeightToFee(
      originConfig.getApi()!,
      totalXcmWeight
    );

    /**
     * !TODO: Move this constant out of this function
     Correction factor to take into account a surplus in the fee in case the 
     weight of the extrinsic in the network increments at the moment of the tx 
    
     @constant
     */
    const correctionFactor = 1.5;

    return {
      extrinsicWeight: extrinsicWeight.muln(correctionFactor),
      totalXcmExtrinsicWeight: totalXcmWeight.muln(correctionFactor),
      totalXcmExtrinsicFee: totalXcmFee.muln(correctionFactor),
    };
  };

  /**
   * Retrieves fee estimation details for an extrinsic in the target parachain, including weights and fees.
   *
   * @param extrinsic - The extrinsic for fee estimation
   * @returns Fee estimation details for the target chain
   */
  const getTargetExtrinsicFeeEstimation = async (
    extrinsic: SubmittableExtrinsic<'promise', ISubmittableResult>
  ): Promise<FeeEstimation> => {
    const extrinsicWeight = await getExtrinsicWeight(extrinsic, account!);

    const totalXcmWeight = getXcmExtrinsicTotalWeight(
      extrinsicWeight,
      targetConfig.chain.xcmConfiguration.xcmInstructionWeight,
      originConfig.chain.xcmConfiguration.xcmInstructionsCount
    );

    const feeAssetId = await xcmLocationToAssetIdNumber(
      targetConfig.getApi()!,
      originConfig.getDefaultAsset()
    );

    const feeAssetMetadata = await getAssetMetadata(
      targetConfig.getApi()!,
      feeAssetId
    );

    const feePerSecond =
      feeAssetMetadata.additional.feePerSecond.unwrap() as u128;

    const totalXcmFee = totalXcmWeight.refTime
      .mul(new BN(feePerSecond.toString()))
      // Picoseconds to seconds
      .div(new BN(1e12));

    return {
      extrinsicWeight: extrinsicWeight,
      totalXcmExtrinsicWeight: totalXcmWeight,
      totalXcmExtrinsicFee: totalXcmFee,
    };
  };

  return {
    getOriginExtrinsicFeeEstimation,
    getTargetExtrinsicFeeEstimation,
  };
};

export default useFeeEstimation;
