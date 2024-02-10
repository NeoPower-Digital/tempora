import { planckToDecimal } from 'useink/utils';
import { paymentTokens } from '../config/tokensConfig';
import { unixTimeToDate } from '../utils/datetime';
import {
  OakFixedPayment,
  OakRecurringPayment,
  OakSchedulePaymentConfiguration,
  SchedulePaymentType,
} from './schedule-payment.model';

/**
 * Represents the configuration of a scheduled payment task.
 */
export interface ScheduleConfiguration {
  id: `0x${string}`;
  taskId: string;
  sender: string;
  recipient: string;
  amount: string;
  tokenAddress: string;
  startTime?: number;
  interval?: number;
  executionTimes?: number[];
  enabled: boolean;
}

export const getOakConfigurationFromSchedule = (
  {
    recipient,
    amount,
    tokenAddress,
    interval,
    executionTimes,
    startTime,
  }: ScheduleConfiguration,
  tokenDecimals: number
): OakSchedulePaymentConfiguration => {
  const paymentToken = paymentTokens.find(
    (token) => token.address === tokenAddress
  ) || { isNative: true, decimals: tokenDecimals, name: '', address: '' };

  const amountWithoutDecimals = planckToDecimal(amount.replaceAll(',', ''), {
    decimals: tokenDecimals,
  })!;

  return {
    values: {
      recipient,
      tokenAddress,
      amountByTx: +amountWithoutDecimals,
      type: interval
        ? SchedulePaymentType.Recurring
        : SchedulePaymentType.Fixed,
      executionDates: executionTimes!.map((executionTime) => ({
        date: unixTimeToDate(+executionTime.toString().replaceAll(',', '')),
      })),
      interval: interval,
    },
    paymentToken,
    schedule: getOakSchedule(startTime, interval, executionTimes),
    scheduleForOak:
      interval && startTime
        ? {
            Recurring: getOakSchedule(
              startTime,
              interval,
              executionTimes
            ) as OakRecurringPayment,
          }
        : {
            Fixed: getOakSchedule(
              startTime,
              interval,
              executionTimes
            ) as OakFixedPayment,
          },
  };
};

/**
 * Generates an Oak schedule based on provided parameters.
 *
 * @param startTime - The start time of the schedule (optional).
 * @param interval - The interval between payments in milliseconds (optional).
 * @param executionTimes - An array of specific execution times for payments (optional).
 *
 * @returns The Oak schedule payment configuration.
 */
const getOakSchedule = (
  startTime?: number,
  interval?: number,
  executionTimes?: number[]
) =>
  interval && startTime
    ? new OakRecurringPayment(
        { date: unixTimeToDate(+startTime.toString().replaceAll(',', '')) },
        interval!
      )
    : new OakFixedPayment(
        executionTimes!.map((executionTime) => ({
          date: unixTimeToDate(+executionTime.toString().replaceAll(',', '')),
        }))
      );
