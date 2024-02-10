import useContract from '@/lib/hooks/useContract';
import { SubmittableExtrinsic } from '@polkadot/api/types';
import { MockedFunction, vi } from 'vitest';

export const createUseContractMocks = () => {
  const mockUseContract = useContract as MockedFunction<typeof useContract>;

  const mockGetSaveScheduleExtrinsic = vi
    .fn()
    .mockReturnValue(
      new Promise((resolve) => resolve({} as SubmittableExtrinsic<'promise'>))
    );

  const mockGetTriggerPaymentExtrinsic = vi
    .fn()
    .mockReturnValue(
      new Promise((resolve) => resolve({} as SubmittableExtrinsic<'promise'>))
    );

  mockUseContract.mockReturnValue({
    getSaveScheduleExtrinsic: mockGetSaveScheduleExtrinsic,
    getTriggerPaymentExtrinsic: mockGetTriggerPaymentExtrinsic,
  });

  return {
    mockUseContract,
    mockGetSaveScheduleExtrinsic,
    mockGetTriggerPaymentExtrinsic,
  };
};
