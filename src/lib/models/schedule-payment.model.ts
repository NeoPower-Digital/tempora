import { CreatePaymentFormValues } from '@/components/new-recurring-payment/CreatePaymentForm';
import { BN } from '@polkadot/util';
import { hoursToSeconds } from 'date-fns';
import { dateToUnixtime } from '../utils/datetime';
import { PaymentToken } from './payment-token.model';

/**
 * Represents a type that can be either a fixed or recurring Oak payment.
 */
export type OakSchedulePayment =
  | { Fixed: OakFixedPayment }
  | { Recurring: OakRecurringPayment };

/**
 * Represents a configuration for an Oak schedule payment.
 */
export class OakSchedulePaymentConfiguration {
  /**
   * The values for creating the payment.
   */
  values: CreatePaymentFormValues;
  paymentToken: PaymentToken;
  schedule: OakFixedPayment | OakRecurringPayment;

  constructor(values: CreatePaymentFormValues, paymentToken: PaymentToken) {
    this.values = values;
    this.paymentToken = paymentToken;

    this.schedule =
      values.type === SchedulePaymentType.Fixed
        ? new OakFixedPayment(values.executionDates)
        : new OakRecurringPayment(values.executionDates[0], values.interval!);
  }

  /**
   * Gets the schedule for Oak in the appropriate format.
   *
   * @returns The schedule for Oak payment.
   */
  get scheduleForOak(): OakSchedulePayment {
    return this.values.type === SchedulePaymentType.Fixed
      ? { Fixed: this.schedule as OakFixedPayment }
      : { Recurring: this.schedule as OakRecurringPayment };
  }
}

/**
 * An abstract class representing an Oak payment.
 */
abstract class OakPayment {
  /**
   * Gets the schedule values for the payment.
   *
   * @returns The schedule values for the payment.
   */
  abstract getScheduleValues(): {
    startTime?: BN;
    interval?: BN;
    executionTimes?: BN[];
  };
}

/**
 * Represents a recurring Oak payment.
 */
export class OakRecurringPayment extends OakPayment {
  /**
   * The next execution time for the payment.
   */
  nextExecutionTime: number;

  /**
   * The frequency of the payment.
   */
  frequency: number;

  /**
   * Constructs a recurring Oak payment.
   *
   * @param startDateTime - The start date and time for the payment.
   * @param interval - The interval between payments.
   */
  constructor(startDateTime: { date: Date }, interval: number) {
    super();
    this.nextExecutionTime = dateToUnixtime(startDateTime.date);
    this.frequency = hoursToSeconds(interval);
  }

  /**
   * Gets the schedule values for the recurring payment.
   *
   * @returns The schedule values for the recurring payment.
   */
  getScheduleValues() {
    return {
      startTime: new BN(this.nextExecutionTime),
      interval: new BN(this.frequency),
      executionTimes: undefined,
    };
  }
}

/**
 * Represents a fixed Oak payment.
 */
export class OakFixedPayment extends OakPayment {
  /**
   * The execution times for the payment.
   */
  executionTimes: number[];

  /**
   * Constructs a fixed Oak payment.
   *
   * @param executionDates - The execution dates for the payment.
   */
  constructor(executionDates: { date: Date }[]) {
    super();
    this.executionTimes = executionDates.map((executionTime) =>
      dateToUnixtime(executionTime.date)
    );
  }

  /**
   * Gets the schedule values for the fixed payment.
   *
   * @returns The schedule values for the fixed payment.
   */
  getScheduleValues() {
    return {
      startTime: undefined,
      interval: undefined,
      executionTimes: this.executionTimes.map(
        (executionTime) => new BN(executionTime)
      ),
    };
  }
}

/**
 * Enumerates the types of Oak schedule payments.
 */
/* eslint-disable no-unused-vars */
export enum SchedulePaymentType {
  Fixed = 'Fixed',
  Recurring = 'Recurring',
}
