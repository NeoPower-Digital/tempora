'use client';

import { Button } from '@/core/components/ui/Button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/core/components/ui/Form';
import { Input } from '@/core/components/ui/Input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/core/components/ui/Select';
import { ChainConfiguration } from '@/lib/hooks/useChainsConfig';
import { PaymentToken } from '@/lib/models/payment-token.model';
import { SchedulePaymentType } from '@/lib/models/schedule-payment.model';
import { isValidAddress } from '@/lib/utils/address';
import { zodResolver } from '@hookform/resolvers/zod';
import { fromUnixTime, getUnixTime } from 'date-fns';
import { useEffect, useState } from 'react';
import { useFieldArray, useForm } from 'react-hook-form';
import { z } from 'zod';
import RecurringField from './RecurringField';

const formSchema = z.object({
  recipient: z.string().refine((value) => isValidAddress(value), {
    message: 'Recipient address should be a valid address',
  }),
  tokenAddress: z.string(),
  amountByTx: z.coerce.number().gt(0),
  type: z.enum([SchedulePaymentType.Recurring, SchedulePaymentType.Fixed]),
  executionDates: z.array(z.object({ date: z.date() })),
  interval: z.coerce.number().min(1).optional(),
});

export type CreatePaymentFormValues = z.infer<typeof formSchema>;

interface CreatePaymentFormProps {
  // eslint-disable-next-line no-unused-vars
  onSubmit: (values: CreatePaymentFormValues) => void;
  initialValue?: CreatePaymentFormValues;
  paymentTokens?: PaymentToken[];
  originConfig?: ChainConfiguration;
  // eslint-disable-next-line no-unused-vars
  getSelectedToken: (selectedAddress: string) => PaymentToken | undefined;
}

const TIME_SLOT_IN_SECONDS = 600;

const calculateInitialDate = (): Date => {
  const currentDateInSeconds = getUnixTime(new Date());
  const initialDate =
    currentDateInSeconds -
    (currentDateInSeconds % TIME_SLOT_IN_SECONDS) +
    TIME_SLOT_IN_SECONDS;

  return fromUnixTime(initialDate);
};

const CreatePaymentForm: React.FC<CreatePaymentFormProps> = ({
  onSubmit,
  initialValue,
  paymentTokens,
  originConfig,
  getSelectedToken,
}) => {
  const [tokenSelectedIsNative, setTokenSelectedIsNative] = useState<boolean>();

  const initialDate = calculateInitialDate();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: initialValue || {
      recipient: '',
      tokenAddress: paymentTokens?.[0]?.address ?? '0',
      amountByTx: 0,
      executionDates: [
        {
          date: initialDate,
        },
      ],
      type: SchedulePaymentType.Fixed,
      interval: 1,
    },
  });

  const {
    fields: dateFields,
    append,
    remove,
  } = useFieldArray({
    name: 'executionDates',
    control: form.control,
  });

  useEffect(() => {
    const selectedToken = getSelectedToken(form.watch('tokenAddress'));

    setTokenSelectedIsNative(selectedToken?.isNative);

    if (!selectedToken?.isNative) {
      form.setValue('type', SchedulePaymentType.Fixed);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.watch('tokenAddress')]);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <FormField
          control={form.control}
          name="recipient"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Recipient {originConfig?.chain.name} Address
              </FormLabel>

              <FormControl>
                <Input {...field} autoComplete="off" />
              </FormControl>

              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="tokenAddress"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Payment Token</FormLabel>

              <FormControl>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>

                  <SelectContent>
                    {paymentTokens?.map(({ name, address }) => (
                      <SelectItem key={name} value={address}>
                        {name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormControl>

              <FormMessage />
            </FormItem>
          )}
        />

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
                    {getSelectedToken(form.watch('tokenAddress'))?.name}
                  </span>
                </div>
              </FormControl>

              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Recurrence Type</FormLabel>

              <FormControl>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  value={field.value}
                  disabled={!tokenSelectedIsNative}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>

                  <SelectContent>
                    {Object.values(SchedulePaymentType).map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormControl>

              <FormMessage />
            </FormItem>
          )}
        />

        <RecurringField
          form={form}
          append={append}
          remove={remove}
          dateFields={
            form.watch('type') === SchedulePaymentType.Recurring
              ? [dateFields[0]]
              : dateFields
          }
          currentDate={initialDate}
        />

        {form.watch('type') === SchedulePaymentType.Recurring && (
          <FormField
            control={form.control}
            name="interval"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Interval (hours)</FormLabel>

                <FormControl>
                  <Input {...field} type="number" />
                </FormControl>

                <FormMessage />
              </FormItem>
            )}
          />
        )}

        <Button type="submit" className="w-full">
          Continue
        </Button>
      </form>
    </Form>
  );
};

export default CreatePaymentForm;
