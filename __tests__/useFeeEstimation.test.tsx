import useFeeEstimation from '@/lib/hooks/useFeeEstimation';
import Weight from '@/lib/models/weight.model';
import { BN } from '@polkadot/util';
import { renderHook } from '@testing-library/react';
import { RecoilRoot } from 'recoil';
import { SubmittableExtrinsic } from 'useink/core';
import { describe, expect, it, vi } from 'vitest';
import { polkadotjsHelperMocks } from './mocks/polkadotjsHelper.mock';
import { createUseWalletMocks } from './mocks/useWallet.mock';

vi.mock('@/lib/helpers/polkadotjs.helper');
vi.mock('@/lib/hooks/useWallet');

const {
  mockGetExtrinsicWeight,
  mockGetXcmExtrinsicTotalWeight,
  mockQueryWeightToFee,
  mockGetAssetMetadata,
  mockXcmLocationToAssetIdNumber,
} = polkadotjsHelperMocks();

createUseWalletMocks();

describe('useFeeEstimation', () => {
  it('should get origin extrinsic fee estimation, when called with an extrinsic', async () => {
    // Arrange
    const { result } = renderHook(() => useFeeEstimation(), {
      wrapper: RecoilRoot,
    });

    const expectedValue = new BN(1.1);
    const expected = {
      extrinsicWeight: new Weight(expectedValue, expectedValue),
      totalXcmExtrinsicWeight: new Weight(expectedValue, expectedValue),
      totalXcmExtrinsicFee: expectedValue,
    };

    // Act
    const received = await result.current.getOriginExtrinsicFeeEstimation(
      {} as SubmittableExtrinsic<'promise'>
    );

    // Assert
    expect(received).toEqual(expected);
    expect(mockGetExtrinsicWeight).toHaveBeenCalled();
    expect(mockGetXcmExtrinsicTotalWeight).toHaveBeenCalled();
    expect(mockQueryWeightToFee).toHaveBeenCalled();
  });

  it('should get target extrinsic fee estimation, when called with an extrinsic', async () => {
    // Arrange
    const { result } = renderHook(() => useFeeEstimation(), {
      wrapper: RecoilRoot,
    });

    const expectedValue = new BN(1.1);
    const expected = {
      extrinsicWeight: new Weight(expectedValue, expectedValue),
      totalXcmExtrinsicWeight: new Weight(expectedValue, expectedValue),
      totalXcmExtrinsicFee: new BN(0),
    };

    // Act
    const received = await result.current.getTargetExtrinsicFeeEstimation(
      {} as SubmittableExtrinsic<'promise'>
    );

    // Assert
    expect(received).toEqual(expected);
    expect(mockGetExtrinsicWeight).toHaveBeenCalled();
    expect(mockGetXcmExtrinsicTotalWeight).toHaveBeenCalled();
    expect(mockXcmLocationToAssetIdNumber).toHaveBeenCalled();
    expect(mockGetAssetMetadata).toHaveBeenCalled();
  });
});
