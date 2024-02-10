'use client';

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/core/components/ui/Accordion';
import { Button } from '@/core/components/ui/Button';
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/core/components/ui/Card';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/core/components/ui/Dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/core/components/ui/Form';
import { Input } from '@/core/components/ui/Input';
import { Skeleton } from '@/core/components/ui/Skeleton';
import { toast } from '@/core/components/ui/useToast';
import { paymentTokens } from '@/lib/config/tokensConfig';
import {
  getFormattedBalance,
  getTokenSymbol,
} from '@/lib/helpers/polkadotjs.helper';
import useSchedulePayment from '@/lib/hooks/useSchedulePayment';
import { ScheduleConfiguration } from '@/lib/models/schedule-configuration.model';
import chainsConfigState from '@/lib/state/chainsConfig.atom';
import { formatAddress } from '@/lib/utils/address';
import {
  convertWithScientificNotation,
  convertWithScientificNotationWithoutFlooring,
} from '@/lib/utils/balance';
import { secondsToHours, unixTimeToDate } from '@/lib/utils/datetime';
import { zodResolver } from '@hookform/resolvers/zod';
import { BN } from '@polkadot/util';
import { useMutation } from '@tanstack/react-query';
import { format } from 'date-fns';
import { Check, Hourglass, Pencil, Trash, X } from 'lucide-react';
import { FC } from 'react';
import { useForm } from 'react-hook-form';
import { useRecoilValue } from 'recoil';
import { planckToDecimal } from 'useink/utils';
import * as z from 'zod';

const PaymentCard: FC<{
  scheduleConfiguration: ScheduleConfiguration;
  paymentExecutions: number[];
  address: string;
  showActions?: boolean;
}> = ({ scheduleConfiguration, paymentExecutions, address, showActions }) => {
  const { originConfig } = useRecoilValue(chainsConfigState);
  let {
    id: scheduleHash,
    taskId,
    amount,
    enabled,
    interval,
    executionTimes,
    startTime,
    tokenAddress,
  } = scheduleConfiguration;

  const paymentToken = paymentTokens.find(
    (paymentToken) => paymentToken.address === tokenAddress
  );

  const decimals = paymentToken?.decimals || originConfig.decimals || 18;

  const getFormattedBalanceByToken = (
    tokenAddress: string,
    amount: BN
  ): string => {
    if (!tokenAddress)
      return getFormattedBalance(originConfig.getApi()!, amount);

    const formattedValue = planckToDecimal(amount, {
      decimals: paymentToken!.decimals,
    })!.toFixed(4);

    return `${formattedValue} ${paymentToken!.name}`;
  };

  amount = amount.replaceAll(',', '');
  const amountFormatted = getFormattedBalanceByToken(
    tokenAddress,
    new BN(amount)
  );

  const { deleteScheduledPayment, updateScheduledPayment } =
    useSchedulePayment();

  const {
    mutate: deleteScheduledPaymentMutation,
    isPending: isDeletingScheduledPayment,
  } = useMutation({
    mutationFn: async () => {
      return await deleteScheduledPayment(scheduleHash, taskId);
    },
    onError: (error) => {
      toast({
        title: 'Error - Delete Scheduled Payment',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const {
    mutate: updateScheduledPaymentMutation,
    isPending: isUpdatingScheduledPayment,
  } = useMutation({
    mutationFn: async ({ amountByTx }: UpdatePaymentFormValues) => {
      return await updateScheduledPayment(
        {
          ...scheduleConfiguration,
          amount: convertWithScientificNotation(
            amountByTx,
            decimals
          ).toString(),
        },
        amount,
        decimals
      );
    },
    onError: (error) => {
      toast({
        title: 'Error - Update Scheduled Payment',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const hasPaymentFinised =
    !interval && executionTimes?.length === paymentExecutions?.length;

  return (
    <Card className="w-[350px]">
      <CardHeader>
        <CardTitle className="flex justify-between">
          <p className="flex items-center gap-3">
            {amountFormatted}
            {showActions && enabled && !hasPaymentFinised && (
              <>
                {isUpdatingScheduledPayment ? (
                  <Skeleton className="w-[0.75em] h-[0.75em]" />
                ) : (
                  <UpdatePaymentDialog
                    onUpdate={(values) =>
                      updateScheduledPaymentMutation(values)
                    }
                    initialAmount={convertWithScientificNotationWithoutFlooring(
                      +amount,
                      (paymentToken?.decimals || originConfig.decimals || 18) *
                        -1
                    )}
                    paymentTokenName={
                      paymentToken?.name ||
                      getTokenSymbol(originConfig.getApi()!)
                    }
                  />
                )}

                {isDeletingScheduledPayment ? (
                  <Skeleton className="w-[0.75em] h-[0.75em]" />
                ) : (
                  <DeletePaymentDialog
                    onDelete={() => deleteScheduledPaymentMutation()}
                  />
                )}
              </>
            )}
          </p>
          {enabled ? (
            hasPaymentFinised ? (
              <Check className="text-green-600" />
            ) : (
              <Hourglass />
            )
          ) : (
            <X className="text-red-600" />
          )}
        </CardTitle>

        <CardDescription>{formatAddress(address)}</CardDescription>
      </CardHeader>

      <CardFooter>
        {interval ? (
          <div>
            <p className="text-gray-400">{`Every ${secondsToHours(
              interval
            )} hours 
            `}</p>
            <p className="text-gray-400">{`From ${format(
              unixTimeToDate(startTime!),
              'PPP HH:mm'
            )}`}</p>
          </div>
        ) : (executionTimes?.length || 0) > 1 ? (
          <FixedDatesAcordion executionTimes={executionTimes} />
        ) : (
          <p className="text-gray-400 pb-6">
            {format(unixTimeToDate(executionTimes![0]), 'PPP HH:mm') || ' '}
          </p>
        )}
      </CardFooter>
    </Card>
  );
};

const FixedDatesAcordion: FC<{ executionTimes?: number[] }> = ({
  executionTimes,
}) => (
  <Accordion type="single" collapsible className="w-full">
    <AccordionItem value="fixed-dates" className="border-b-0">
      <AccordionTrigger className="hover:no-underline pb-2">
        <p className="text-gray-400">
          {format(unixTimeToDate(executionTimes![0]), 'PPP HH:mm') || ' '}
        </p>
      </AccordionTrigger>
      <AccordionContent>
        {executionTimes?.slice(1).map((value, index) => (
          <p className="text-gray-400" key={index}>
            {format(unixTimeToDate(value), 'PPP HH:mm') || ' '}
          </p>
        ))}
      </AccordionContent>
    </AccordionItem>
  </Accordion>
);

const DeletePaymentDialog: FC<{ onDelete: () => void }> = ({ onDelete }) => (
  <Dialog>
    <DialogTrigger>
      <Trash
        className="hover:scale-110 cursor-pointer hover:text-red-600"
        size={'.75em'}
      />
    </DialogTrigger>

    <DialogContent>
      <DialogHeader>
        <DialogTitle>Delete Automated Payment</DialogTitle>

        <DialogDescription>
          This action cannot be undone. Are you sure you want to delete this
          payment?
        </DialogDescription>
      </DialogHeader>

      <DialogFooter>
        <DialogClose>
          <Button onClick={onDelete} variant="destructive">
            Delete
          </Button>
        </DialogClose>
      </DialogFooter>
    </DialogContent>
  </Dialog>
);

const formSchema = z.object({
  amountByTx: z.coerce.number().gt(0),
});

export type UpdatePaymentFormValues = z.infer<typeof formSchema>;

const UpdatePaymentDialog: FC<{
  // eslint-disable-next-line no-unused-vars
  onUpdate: (values: UpdatePaymentFormValues) => void;
  initialAmount: number;
  paymentTokenName: string;
}> = ({ onUpdate, initialAmount, paymentTokenName }) => {
  const form = useForm<UpdatePaymentFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      amountByTx: initialAmount,
    },
  });

  return (
    <Dialog>
      <DialogTrigger>
        <Pencil
          className="hover:scale-110 cursor-pointer hover:text-blue-400"
          size={'.75em'}
        />
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>Update Automated Payment</DialogTitle>
          <DialogDescription>
            Make changes to your Scheduled Payment here. Click Update to save
            them.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onUpdate)} className="space-y-8">
            <FormField
              control={form.control}
              name="amountByTx"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Amount (for each TX)</FormLabel>

                  <FormControl>
                    <div className="flex items-center gap-2">
                      <Input {...field} type="number" />

                      <span className="text-muted-foreground">
                        {paymentTokenName}
                      </span>
                    </div>
                  </FormControl>

                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogClose>
              <Button type="submit" variant="default">
                Update
              </Button>
            </DialogClose>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default PaymentCard;
