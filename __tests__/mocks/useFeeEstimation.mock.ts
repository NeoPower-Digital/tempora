import useFeeEstimation from '@/lib/hooks/useFeeEstimation';
import Weight from '@/lib/models/weight.model';
import { BN } from '@polkadot/util';
import { MockedFunction, vi } from 'vitest';

export const createUseFeeEstimationMocks = () => {
  const mockUseFeeEstimation = useFeeEstimation as MockedFunction<
    typeof useFeeEstimation
  >;

  const defaultValue = new BN(1);

  const mockGetOriginExtrinsicFeeEstimation = vi.fn().mockReturnValue(
    new Promise((resolve) =>
      resolve({
        extrinsicWeight: new Weight(new BN(1), new BN(1)),
        totalXcmExtrinsicWeight: new Weight(new BN(1), new BN(1)),
        totalXcmExtrinsicFee: new BN(1),
      })
    )
  );

  const mockGetTargetExtrinsicFeeEstimation = vi.fn().mockReturnValue(
    new Promise((resolve) =>
      resolve({
        extrinsicWeight: new Weight(defaultValue, defaultValue),
        totalXcmExtrinsicWeight: new Weight(defaultValue, defaultValue),
        totalXcmExtrinsicFee: defaultValue,
      })
    )
  );

  mockUseFeeEstimation.mockReturnValue({
    getOriginExtrinsicFeeEstimation: mockGetOriginExtrinsicFeeEstimation,
    getTargetExtrinsicFeeEstimation: mockGetTargetExtrinsicFeeEstimation,
  });

  return {
    mockUseFeeEstimation,
    mockGetOriginExtrinsicFeeEstimation,
    mockGetTargetExtrinsicFeeEstimation,
  };
};
