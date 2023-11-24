'use client';

import CreatePaymentForm, {
  CreatePaymentFormValues,
} from '@/components/new-recurring-payment/CreatePaymentForm';
import CreatePaymentSummary from '@/components/new-recurring-payment/CreatePaymentSummary';
import { Button } from '@/core/components/ui/Button';
import { Card, CardHeader } from '@/core/components/ui/Card';
import { Skeleton } from '@/core/components/ui/Skeleton';
import { useToast } from '@/core/components/ui/useToast';
import { getTokenSymbol } from '@/lib/helpers/polkadotjs.helper';
import { FeeEstimation } from '@/lib/hooks/useFeeEstimation';
import useProxyAccounts from '@/lib/hooks/useProxyAccounts';
import useSchedulePayment from '@/lib/hooks/useSchedulePayment';
import useWallet from '@/lib/hooks/useWallet';
import {
  OakFixedPayment,
  OakRecurringPayment,
  OakSchedulePayment,
  OakSchedulePaymentConfiguration,
  SchedulePaymentType,
} from '@/lib/models/schedule-payment.model';
import chainsConfigState, {
  chainsApiReady,
} from '@/lib/state/chainsConfig.atom';
import proxyAccountsState, {
  proxiesAddressCalculated,
} from '@/lib/state/proxyAccounts.atom';
import { BN } from '@polkadot/util';
import { useMutation, useQuery } from '@tanstack/react-query';
import { ArrowLeft, Check } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { useRecoilValue } from 'recoil';
import { ISubmittableResult, SubmittableExtrinsic } from 'useink/core';

export interface NewPaymentSummary {
  taskScheduleExtrinsic:
    | SubmittableExtrinsic<'promise', ISubmittableResult>
    | undefined;
  originFeeEstimation: FeeEstimation;
  targetFeeEstimation: FeeEstimation;
  iterationsToCoverFeeOnOrigin: number;
  originTopUpBalance?: BN;
  targetTopUpBalance?: BN;
}

const SuccessSection: React.FC = () => (
  <div className="flex flex-col items-center">
    <Check className="text-green-500 w-12 h-12" />
    <h3 className="text-xl font-bold">Payment Scheduled</h3>
    <p className="text-muted-foreground">
      Your payment has been scheduled correctly.
    </p>

    <Link href="/" className="flex items-center gap-2 mt-8">
      <ArrowLeft />
      Go to Home
    </Link>
  </div>
);

export default function NewRecurringPayment() {
  const { createScheduledPayment } = useSchedulePayment();
  const { toast } = useToast();

  const { account } = useWallet();
  const { originProxyAddress, targetProxyAddress } =
    useRecoilValue(proxyAccountsState);
  const proxiesCalculated = useRecoilValue(proxiesAddressCalculated);
  const apisReady = useRecoilValue(chainsApiReady);
  const { originConfig } = useRecoilValue(chainsConfigState);

  const [isSummary, setIsSummary] = useState(false);
  const [newPaymentConfiguration, setNewPaymentConfiguration] =
    useState<OakSchedulePaymentConfiguration>();

  const { proxiesExist } = useProxyAccounts();
  const { data: proxiesExistData, isLoading: proxiesExistsIsLoading } =
    useQuery({
      queryKey: ['proxiesExist', originProxyAddress, targetProxyAddress],
      queryFn: proxiesExist,
      enabled: apisReady && proxiesCalculated,
    });
  const proxysExist =
    proxiesExistData?.originExists && proxiesExistData?.targetExists;

  const { mutate, isPending, isSuccess } = useMutation({
    mutationFn: (newPaymentSummary: NewPaymentSummary) =>
      createScheduledPayment(newPaymentSummary),
    onError: (error) => {
      toast({
        title: 'Error - Payment Scheduling',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const createPayment = (newPaymentSummary: NewPaymentSummary) => {
    mutate(newPaymentSummary);
  };

  const submitForm = (values: CreatePaymentFormValues): void => {
    const schedule: OakSchedulePayment =
      values.type === SchedulePaymentType.Recurring
        ? {
            Recurring: new OakRecurringPayment(
              values.executionDates[0],
              values.interval!
            ),
          }
        : { Fixed: new OakFixedPayment(values.executionDates) };

    setNewPaymentConfiguration({
      ...values,
      schedule,
    });

    setIsSummary(true);
  };

  const isLoading =
    (proxiesExistsIsLoading || !(apisReady && proxiesCalculated)) && account;

  const summarySection = isSuccess ? (
    <SuccessSection />
  ) : (
    <>
      <div
        className="flex items-center gap-2 cursor-pointer mb-6 w-fit"
        onClick={() => setIsSummary(false)}
      >
        <ArrowLeft size={32} />
        <p className="font-bold">Back to Create Payment</p>
      </div>
      <CreatePaymentSummary
        configuration={newPaymentConfiguration!}
        createPayment={createPayment}
        isCreatingPayment={isPending}
      />
    </>
  );

  return (
    <>
      <h2 className="text-3xl font-bold mb-2">Recurring Payments</h2>
      <p>Create recurring transfers from one wallet to another</p>

      {isLoading ? (
        <Skeleton className="mt-8 h-6 w-[300px]" />
      ) : (
        <>
          {proxysExist ? (
            <Card className="w-full max-w-2xl mt-8">
              <CardHeader>
                {isSummary ? (
                  summarySection
                ) : (
                  <CreatePaymentForm
                    paymentToken={getTokenSymbol(originConfig.getApi()!)}
                    onSubmit={submitForm}
                    initialValue={newPaymentConfiguration}
                  />
                )}
              </CardHeader>
            </Card>
          ) : (
            <Link href="/" className="flex items-center gap-2 mt-8">
              <Button>Go back home and create proxy accounts</Button>
            </Link>
          )}
        </>
      )}
    </>
  );
}
