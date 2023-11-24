import { ApiPromise } from '@polkadot/api';
import { XcmV3MultiLocation } from '@polkadot/types/lookup';
import { BN } from '@polkadot/util';
import { OakSchedulePaymentConfiguration } from '../models/schedule-payment.model';
import Weight from '../models/weight.model';

/**
 * Schedules an XCMP task through a proxy using the automationTime module in the provided API.
 *
 * @param api - The API Promise for interacting with OAK Network.
 * @param schedule - The schedule configuration for the task.
 * @param destination - The destination of the XCM message for the task in XCMV3Multilocation format.
 * @param scheduleFee - The schedule fee for the task in XCMV3Multilocation format.
 * @param executionFee - The execution fee for the task in XCMV3Multilocation format.
 * @param encodedCall - The encoded call data for the task in a `0x{string}` format.
 * @param encodedCallWeight - The weight of the encoded call data.
 * @param overallWeight - The overall weight of the task.
 * @param scheduleAs - The identifier for scheduling the task.
 * @returns An extrinsic representing the scheduled XCMP task through a proxy.
 */
export const scheduleXcmpTaskThroughProxy = (
  api: ApiPromise,
  schedule: OakSchedulePaymentConfiguration['schedule'],
  destination: { V3: XcmV3MultiLocation },
  scheduleFee: { V3: XcmV3MultiLocation },
  executionFee: { assetLocation: { V3: XcmV3MultiLocation }; amount: BN },
  encodedCall: `0x${string}`,
  encodedCallWeight: Weight,
  overallWeight: Weight,
  scheduleAs: string
) => {
  return api.tx.automationTime.scheduleXcmpTaskThroughProxy(
    schedule,
    destination,
    scheduleFee,
    executionFee,
    encodedCall,
    encodedCallWeight,
    overallWeight,
    scheduleAs
  );
};
