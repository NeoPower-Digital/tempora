'use client';

import CreatePaymentForm, {
  CreatePaymentFormValues,
} from '@/components/new-recurring-payment/CreatePaymentForm';
import CreatePaymentSummary from '@/components/new-recurring-payment/CreatePaymentSummary';
import { Button } from '@/core/components/ui/Button';
import { Card, CardHeader } from '@/core/components/ui/Card';
import { Skeleton } from '@/core/components/ui/Skeleton';
import { useToast } from '@/core/components/ui/useToast';
import { paymentTokens as otherPaymentTokens } from '@/lib/config/tokensConfig';
import { getTokenSymbol } from '@/lib/helpers/polkadotjs.helper';
import { FeeEstimation } from '@/lib/hooks/useFeeEstimation';
import useProxyAccounts from '@/lib/hooks/useProxyAccounts';
import useSchedulePayment from '@/lib/hooks/useSchedulePayment';
import useWallet from '@/lib/hooks/useWallet';
import { PaymentToken } from '@/lib/models/payment-token.model';
import { OakSchedulePaymentConfiguration } from '@/lib/models/schedule-payment.model';
import chainsConfigState, {
  chainsApiReady,
} from '@/lib/state/chainsConfig.atom';
import proxyAccountsState, {
  proxiesAddressCalculated,
} from '@/lib/state/proxyAccounts.atom';
import { BN } from '@polkadot/util';
import { useMutation, useQuery } from '@tanstack/react-query';
import { ArrowLeft, Check, Coins } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useRecoilValue } from 'recoil';
import { ISubmittableResult, SubmittableExtrinsic } from 'useink/core';

export interface NewPaymentSummary {
  taskScheduleExtrinsic: SubmittableExtrinsic<'promise', ISubmittableResult>;
  originFeeEstimation: BN;
  targetFeeEstimation: FeeEstimation;
  iterationsToCoverFeeOnOrigin: number;
  originTopUpBalance?: BN;
  targetTopUpBalance?: BN;
  getActionsOnTaskScheduled: (
    // eslint-disable-next-line no-unused-vars
    taskId: string
  ) => Promise<SubmittableExtrinsic<'promise', ISubmittableResult>[]>;
}

const SuccessSection: React.FC = () => {
  const router = useRouter();

  const goToMyPayments = () => {
    router.push('/my-payments');
  };

  return (
    <div className="flex flex-col items-center">
      <Check className="text-green-500 w-12 h-12" />
      <h3 className="text-xl font-bold">Payment Scheduled</h3>
      <p className="text-muted-foreground">
        Your payment has been scheduled correctly.
      </p>

      <Button onClick={goToMyPayments} className="flex items-center gap-2 mt-8">
        <Coins />
        Visualize your incoming and outgoing payments
      </Button>
    </div>
  );
};

export default function NewRecurringPayment() {
  const { topUpAccounts, createAndSaveScheduledPayment } = useSchedulePayment();
  const { toast } = useToast();
  const { account } = useWallet();
  const { proxiesExist } = useProxyAccounts();

  const { originProxyAddress, targetProxyAddress } =
    useRecoilValue(proxyAccountsState);
  const proxiesCalculated = useRecoilValue(proxiesAddressCalculated);
  const apisReady = useRecoilValue(chainsApiReady);
  const { originConfig } = useRecoilValue(chainsConfigState);

  const [isSummary, setIsSummary] = useState(false);
  const [newPaymentConfiguration, setNewPaymentConfiguration] =
    useState<OakSchedulePaymentConfiguration>();
  const [paymentTokens, setPaymentTokens] = useState<PaymentToken[]>();

  const { data: proxiesExistData, isLoading: proxiesExistsIsLoading } =
    useQuery({
      queryKey: ['proxiesExist', originProxyAddress, targetProxyAddress],
      queryFn: proxiesExist,
      enabled: apisReady && proxiesCalculated,
    });
  const proxysExist =
    proxiesExistData?.originExists && proxiesExistData?.targetExists;

  const {
    mutate: mutateCreatePayment,
    isPending: isCreatingPayment,
    isSuccess: createPaymentIsSuccess,
  } = useMutation({
    mutationFn: (newPaymentSummary: NewPaymentSummary) => {
      const {
        targetFeeEstimation,
        taskScheduleExtrinsic,
        getActionsOnTaskScheduled,
      } = newPaymentSummary;

      return createAndSaveScheduledPayment(
        targetFeeEstimation,
        taskScheduleExtrinsic,
        getActionsOnTaskScheduled
      );
    },
    onError: (error) => {
      toast({
        title: 'Error - Payment Creation',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const { mutate: mutateTopUpAccounts, isPending: isToppingUpAccounts } =
    useMutation({
      mutationFn: (newPaymentSummary: NewPaymentSummary) => {
        const { originTopUpBalance, targetTopUpBalance } = newPaymentSummary;

        return topUpAccounts(originTopUpBalance, targetTopUpBalance);
      },
      onSuccess: (_data, variables) => {
        mutateCreatePayment(variables);
      },
      onError: (error) => {
        toast({
          title: 'Error - Schedule Save and Accounts Topping Up',
          description: error.message,
          variant: 'destructive',
        });
      },
    });

  const createPayment = (newPaymentSummary: NewPaymentSummary) => {
    mutateTopUpAccounts(newPaymentSummary);
  };

  const submitForm = (values: CreatePaymentFormValues): void => {
    const selectedToken = getSelectedToken(values.tokenAddress);
    setNewPaymentConfiguration(
      new OakSchedulePaymentConfiguration(values, selectedToken!)
    );
    setIsSummary(true);
  };

  const getSelectedToken = (
    selectedAddress?: string
  ): PaymentToken | undefined =>
    paymentTokens?.find((token) => token.address === selectedAddress);

  const isLoading =
    (proxiesExistsIsLoading || !(apisReady && proxiesCalculated)) && account;

  useEffect(() => {
    if (!originConfig) return;

    const nativeToken: PaymentToken = {
      name: getTokenSymbol(originConfig.getApi()!),
      address: '0',
      decimals: originConfig.decimals!,
      isNative: true,
    };

    setPaymentTokens([nativeToken, ...(otherPaymentTokens ?? [])]);
  }, [originConfig]);

  const summarySection = createPaymentIsSuccess ? (
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
        selectedTokenName={
          getSelectedToken(newPaymentConfiguration?.values.tokenAddress)?.name
        }
        createPayment={(newPaymentSummary) => createPayment(newPaymentSummary)}
        isCreatingPayment={isCreatingPayment}
        isToppingUpAccounts={isToppingUpAccounts}
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
                    onSubmit={submitForm}
                    initialValue={newPaymentConfiguration?.values}
                    paymentTokens={paymentTokens}
                    originConfig={originConfig}
                    getSelectedToken={getSelectedToken}
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
