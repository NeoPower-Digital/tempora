import { CreatePaymentFormValues } from '@/components/new-recurring-payment/CreatePaymentForm';
import { hoursToSeconds } from 'date-fns';
import { dateToUnixtime } from '../utils/datetime';

export type OakSchedulePayment =
  | { Fixed: OakFixedPayment }
  | { Recurring: OakRecurringPayment };

export interface OakSchedulePaymentConfiguration
  extends CreatePaymentFormValues {
  schedule: OakSchedulePayment;
}

export class OakRecurringPayment {
  nextExecutionTime: number;
  frequency: number;

  constructor(startDateTime: { date: Date }, interval: number) {
    this.nextExecutionTime = dateToUnixtime(startDateTime.date);
    this.frequency = hoursToSeconds(interval);
  }
}

export class OakFixedPayment {
  executionTimes: number[];

  constructor(executionDates: { date: Date }[]) {
    this.executionTimes = executionDates.map((executionTime) =>
      dateToUnixtime(executionTime.date)
    );
  }
}

/* eslint-disable no-unused-vars */
export enum SchedulePaymentType {
  Recurring = 'Recurring',
  Fixed = 'Fixed',
}
