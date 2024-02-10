import useFeeEstimation, { FeeEstimation } from '@/lib/hooks/useFeeEstimation';
import { renderHook } from '@testing-library/react';
import { SubmittableExtrinsic } from 'useink/core';
import { describe, expect, expectTypeOf, it, vi } from 'vitest';
import { polkadotjsHelperMocks } from './mocks/polkadotjsHelper.mock';
import { createUseWalletMocks } from './mocks/useWallet.mock';
import getRecoilProvider, {
  mockChainsConfigInitialState,
} from './providers/recoilProvider.mock';

vi.mock('@/lib/helpers/polkadotjs.helper');
vi.mock('@/lib/hooks/useWallet');

const {
  mockGetExtrinsicWeight,
  mockQueryWeightToFee,
  mockGetAssetMetadata,
  mockXcmLocationToAssetIdNumber,
} = polkadotjsHelperMocks();

createUseWalletMocks();

describe('useFeeEstimation', () => {
  it('should get origin extrinsic fee estimation, when called with an extrinsic', async () => {
    // Arrange
    const { result } = renderHook(() => useFeeEstimation(), {
      wrapper: getRecoilProvider(undefined, mockChainsConfigInitialState),
    });

    // Act
    const received = await result.current.getOriginExtrinsicFeeEstimation(
      {} as SubmittableExtrinsic<'promise'>
    );

    // Assert
    expect(mockGetExtrinsicWeight).toHaveBeenCalled();
    expect(mockQueryWeightToFee).toHaveBeenCalled();
    expectTypeOf(received).toEqualTypeOf<FeeEstimation>();
  });

  it('should get target extrinsic fee estimation, when called with an extrinsic', async () => {
    // Arrange
    const { result } = renderHook(() => useFeeEstimation(), {
      wrapper: getRecoilProvider(undefined, mockChainsConfigInitialState),
    });

    // Act
    const received = await result.current.getTargetExtrinsicFeeEstimation(
      {} as SubmittableExtrinsic<'promise'>
    );

    // Assert
    expect(mockGetExtrinsicWeight).toHaveBeenCalled();
    expect(mockXcmLocationToAssetIdNumber).toHaveBeenCalled();
    expect(mockGetAssetMetadata).toHaveBeenCalled();
    expectTypeOf(received).toEqualTypeOf<FeeEstimation>();
  });
});
