import {
  getAssetMetadata,
  getExtrinsicWeight,
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
  Correction factor to take into account a surplus in the fee in case the 
  weight of the extrinsic in the network increments at the moment of the tx 
   
  @constant
*/
const CORRECTION_FACTOR = 1.5;

/**
 * Hook for estimating fees for origin and target chain extrinsics.
 *
 * @returns methods to obtain fees estimation in both origin and target chains
 */
const useFeeEstimation = () => {
  const { account } = useWallet();
  const { originConfig, targetConfig } = useRecoilValue(chainsConfigState);

  /**
   * Calculates the total weight for an XCM extrinsic based on individual weights and instruction count.
   *
   * @param extrinsicWeight - The weight of the base extrinsic.
   * @param xcmInstructionWeight - The weight of a single XCM instruction.
   * @param xcmInstructionsCount - The number of XCM instructions in the extrinsic.
   * @returns The total weight of the XCM extrinsic.
   */
  const getXcmExtrinsicTotalWeight = (
    extrinsicWeight: Weight,
    xcmInstructionWeight: Weight,
    xcmInstructionsCount: number
  ): Weight => {
    const xcmTotalInstructionsWeight =
      xcmInstructionWeight.muln(xcmInstructionsCount);

    return extrinsicWeight.add(xcmTotalInstructionsWeight);
  };

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

    return {
      extrinsicWeight: extrinsicWeight.muln(CORRECTION_FACTOR),
      totalXcmExtrinsicWeight: totalXcmWeight.muln(CORRECTION_FACTOR),
      totalXcmExtrinsicFee: totalXcmFee.muln(CORRECTION_FACTOR),
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
    getXcmExtrinsicTotalWeight,
    getOriginExtrinsicFeeEstimation,
    getTargetExtrinsicFeeEstimation,
  };
};

export default useFeeEstimation;
