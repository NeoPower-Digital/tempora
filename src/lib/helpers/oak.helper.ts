/* eslint-disable no-unused-vars */
import { ApiPromise } from '@polkadot/api';
import { XcmV3MultiLocation } from '@polkadot/types/lookup';
import { BN } from '@polkadot/util';
import { OakSchedulePaymentConfiguration } from '../models/schedule-payment.model';
import Weight from '../models/weight.model';

/**
 * Constant with the possible Instruction Sequences of Oak `automationTime.scheduleXcmpTask` function
 */
export enum SCHEDULE_XCMP_TASK_INSTRUCTION_SEQUENCE {
  REMOTE_DERIVATIVE_ACCOUNT = 'PayThroughRemoteDerivativeAccount',
  SOVEREIGN_ACCOUNT = 'PayThroughSovereignAccount',
}

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
  schedule: OakSchedulePaymentConfiguration['scheduleForOak'],
  destination: { V3: XcmV3MultiLocation },
  scheduleFee: { V3: XcmV3MultiLocation },
  executionFee: { assetLocation: { V3: XcmV3MultiLocation }; amount: BN },
  encodedCall: `0x${string}`,
  encodedCallWeight: Weight,
  overallWeight: Weight,
  scheduleAs: string
) => {
  return api.tx.automationTime.scheduleXcmpTask(
    schedule,
    destination,
    scheduleFee,
    executionFee,
    encodedCall,
    encodedCallWeight,
    overallWeight,
    SCHEDULE_XCMP_TASK_INSTRUCTION_SEQUENCE.REMOTE_DERIVATIVE_ACCOUNT,
    scheduleAs
  );
};

/**
 * Constructs an extrinsic to cancel a task with a specified schedule as the sender.
 *
 * @param api - The initialized API instance.
 * @param accountAddress - The address of the account that owns the task.
 * @param taskId - The ID of the task to be canceled.
 * @returns The extrinsic to cancel the task with the specified schedule as the sender.
 */
export const cancelTaskWithScheduleAs = (
  api: ApiPromise,
  accountAddress: string,
  taskId: string
) => {
  return api.tx.automationTime.cancelTaskWithScheduleAs(accountAddress, taskId);
};
