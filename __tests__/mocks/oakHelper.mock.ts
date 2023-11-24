import { scheduleXcmpTaskThroughProxy } from '@/lib/helpers/oak.helper';
import { SubmittableExtrinsic } from 'useink/core';
import { MockedFunction } from 'vitest';

export const oakHelperMocks = () => {
  const mockScheduleXcmpTaskThroughProxy =
    scheduleXcmpTaskThroughProxy as MockedFunction<
      typeof scheduleXcmpTaskThroughProxy
    >;

  mockScheduleXcmpTaskThroughProxy.mockReturnValue({
    method: { toHex: () => '0x1' },
  } as unknown as SubmittableExtrinsic<'promise'>);

  return {
    mockScheduleXcmpTaskThroughProxy,
  };
};
