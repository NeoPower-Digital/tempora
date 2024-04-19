import { Button } from '@/core/components/ui/Button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/core/components/ui/Popover';
import { Skeleton } from '@/core/components/ui/Skeleton';
import { useToast } from '@/core/components/ui/useToast';
import { getFormattedBalance } from '@/lib/helpers/polkadotjs.helper';
import useSchedulePayment from '@/lib/hooks/useSchedulePayment';
import {
  OakSchedulePaymentConfiguration,
  SchedulePaymentType,
} from '@/lib/models/schedule-payment.model';
import chainsConfigState from '@/lib/state/chainsConfig.atom';
import { formatAddress } from '@/lib/utils/address';
import { BN } from '@polkadot/util';
import { useQuery } from '@tanstack/react-query';
import {
  Calendar,
  Clock,
  Coins,
  Info,
  Loader2,
  Repeat,
  User,
  Wallet,
} from 'lucide-react';
import { useRecoilValue } from 'recoil';
import { NewPaymentSummary } from '../../../app/new-recurring-payment/page';

interface CreatePaymentSummaryProps {
  configuration: OakSchedulePaymentConfiguration;
  selectedTokenName?: string;
  // eslint-disable-next-line no-unused-vars
  createPayment: (newPaymentSummary: NewPaymentSummary) => void;
  isCreatingPayment: boolean;
  isToppingUpAccounts: boolean;
}

const CreatePaymentSummary: React.FC<CreatePaymentSummaryProps> = ({
  configuration: newPaymentConfiguration,
  selectedTokenName,
  createPayment,
  isCreatingPayment,
  isToppingUpAccounts,
}) => {
  const { generateExtrinsicsAndEstimate } = useSchedulePayment();
  const { originConfig, targetConfig } = useRecoilValue(chainsConfigState);
  const { toast } = useToast();

  const topUpMessage = [
    'To pay for fees we need to top up your proxy accounts for you.',
    'If your proxy accounts balance is enough, we will not top up the account in this transaction.',
    'If your balance is not enough, we will top up the remaining amount, taking into account the implicit transfer fees.',
  ];

  const { data: newPaymentSummary, isLoading } = useQuery({
    queryKey: ['createPaymentSummary', JSON.stringify(newPaymentConfiguration)],
    queryFn: async () => {
      try {
        return await generateExtrinsicsAndEstimate(newPaymentConfiguration);
      } catch (error) {
        toast({
          title: 'Error - Payment Scheduling',
          description: 'Error',
          variant: 'destructive',
        });

        throw error;
      }
    },
  });

  const { recipient, amountByTx, type, executionDates, interval } =
    newPaymentConfiguration!.values;

  const paymentData: Array<{
    icon: React.ReactElement;
    label: string | React.ReactElement;
    value: string | React.ReactElement;
  }> = [
    {
      icon: <User />,
      label: 'Recipient',
      value: (
        <Popover>
          <PopoverTrigger className="border-b-2 border-dashed">
            {formatAddress(recipient)}
          </PopoverTrigger>

          <PopoverContent className="w-full">{recipient}</PopoverContent>
        </Popover>
      ),
    },
    {
      icon: <Coins />,
      label: 'Amount',
      value: `${amountByTx} ${selectedTokenName}`,
    },
    {
      icon: <Repeat />,
      label: 'Payment Type',
      value: type,
    },
  ];

  if (type === SchedulePaymentType.Recurring) {
    paymentData.push({
      icon: <Calendar />,
      label: 'Start Date',
      value: executionDates[0].date.toLocaleString(),
    });

    paymentData.push({
      icon: <Clock />,
      label: 'Interval',
      value: `${interval} hour${interval! > 1 ? 's' : ''}`,
    });
  }

  if (type === SchedulePaymentType.Fixed) {
    paymentData.push({
      icon: <Calendar />,
      label: 'Execution Dates',
      value: (
        <div>
          {executionDates.map(({ date }, index) => (
            <p key={index}>{date.toLocaleString()}</p>
          ))}
        </div>
      ),
    });
  }

  const skeleton = <Skeleton className="h-4 w-[100px]" />;

  paymentData.push(
    {
      icon: <Coins />,
      label: 'Estimated Fees',
      value: isLoading
        ? skeleton
        : getFormattedBalance(
            originConfig.getApi(),
            newPaymentSummary?.originFeeEstimation.add(
              newPaymentSummary?.targetFeeEstimation?.totalXcmExtrinsicFee
            )
          ),
    },
    {
      icon: <Wallet />,
      label: (
        <div className="flex items-center gap-2">
          <p>Top Up</p>
          <Popover>
            <PopoverTrigger className="border-b-2 border-dashed">
              <Info size={16} />
            </PopoverTrigger>

            <PopoverContent className="w-[450px]">
              <ul>
                {topUpMessage.map((value) => (
                  <li key={value}>{value}</li>
                ))}
              </ul>
            </PopoverContent>
          </Popover>
        </div>
      ),
      value: isLoading
        ? skeleton
        : `${originConfig.chain.name}: ${getFormattedBalance(
            originConfig.getApi(),
            newPaymentSummary?.originTopUpBalance || new BN(0)
          )}`,
    },
    {
      icon: <div />,
      label: '',
      value: isLoading
        ? skeleton
        : `${targetConfig.chain.name}: ${getFormattedBalance(
            originConfig.getApi(),
            newPaymentSummary?.targetTopUpBalance || new BN(0)
          )}`,
    }
  );

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        {paymentData.map(({ icon, label, value }, index) => (
          <div key={index} className="flex justify-between w-full items-start">
            <div className="flex items-center gap-4">
              {icon} {label}
              {label ? ':' : ''}
            </div>

            <div className="text-muted-foreground">{value}</div>
          </div>
        ))}
      </div>

      <Button
        className="w-full"
        onClick={() => createPayment(newPaymentSummary!)}
        disabled={isToppingUpAccounts || isCreatingPayment}
      >
        {(isToppingUpAccounts || isCreatingPayment) && (
          <Loader2 className="mr-2 animate-spin" size={16} />
        )}
        {isToppingUpAccounts
          ? 'Preparing Proxy Accounts...'
          : isCreatingPayment
          ? 'Creating and saving Payment...'
          : 'Create Payment'}
      </Button>
    </div>
  );
};

export default CreatePaymentSummary;
