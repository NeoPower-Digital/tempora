'use client';

import { Card } from '@/core/components/ui/Card';
import {
  TEMPORA_CONTRACT_ADDRESS,
  TEMPORA_CONTRACT_MESSAGES,
} from '@/lib/hooks/useContract';
import useWallet from '@/lib/hooks/useWallet';
import { ScheduleConfiguration } from '@/lib/models/schedule-configuration.model';
import chainsConfigState from '@/lib/state/chainsConfig.atom';
import contractMetadata from '@lib/contracts/tempora_contract_metadata.json';
import { AlertCircle } from 'lucide-react';
import { FC, useEffect } from 'react';
import { useRecoilValue } from 'recoil';
import { useCall, useContract } from 'useink';
import { pickDecoded } from 'useink/utils';
import PaymentCard from './PaymentCard';

interface ScheduleConfigurationsResult {
  Ok?: {
    scheduleConfiguration: ScheduleConfiguration;
    paymentExecutions: number[];
  }[];
  Err?: {};
}

const MyPaymentsContainer: FC<{}> = () => {
  const contract = useContract(TEMPORA_CONTRACT_ADDRESS, contractMetadata);
  const getScheduleConfigurations = useCall<ScheduleConfigurationsResult>(
    contract,
    TEMPORA_CONTRACT_MESSAGES.GET_SCHEDULES
  );
  const { account } = useWallet();
  const { originConfig } = useRecoilValue(chainsConfigState);

  useEffect(() => {
    if (!account) return;

    getScheduleConfigurations.send();
  }, [account, getScheduleConfigurations]);

  const originAddress = originConfig.getParachainAddress(
    account?.address || ''
  );

  const incomingPayments = (
    pickDecoded(
      getScheduleConfigurations?.result
    ) as ScheduleConfigurationsResult['Ok']
  )?.filter(
    ({ scheduleConfiguration }) =>
      scheduleConfiguration.recipient === originAddress
  );

  const outgoingPayments = (
    pickDecoded(
      getScheduleConfigurations?.result
    ) as ScheduleConfigurationsResult['Ok']
  )?.filter(
    ({ scheduleConfiguration }) =>
      scheduleConfiguration.sender === originAddress
  );

  return (
    <>
      {incomingPayments?.length === 0 && outgoingPayments?.length === 0 ? (
        <div className="flex justify-center items-center">
          <Card className="flex flex-col justify-center items-center p-6 gap-4">
            <AlertCircle size={32} />
            <p className="text-lg text-center">No payments to show</p>
          </Card>
        </div>
      ) : (
        <div className="flex gap-6">
          {incomingPayments?.length ? (
            <div>
              <p className="text-2xl font-bold text-center">Incoming</p>
              <div className="flex flex-1 gap-4 flex-col mt-4 h-[675px] overflow-auto">
                {incomingPayments?.map(
                  ({ scheduleConfiguration, paymentExecutions }, index) => {
                    return (
                      <PaymentCard
                        key={index}
                        scheduleConfiguration={scheduleConfiguration}
                        paymentExecutions={paymentExecutions}
                        address={scheduleConfiguration.sender}
                      />
                    );
                  }
                )}
              </div>
            </div>
          ) : (
            <></>
          )}
          {outgoingPayments?.length ? (
            <div>
              <p className="text-2xl font-bold text-center">Outgoing</p>
              <div className="flex-1 flex gap-4 flex-col mt-4 h-[675px] overflow-auto">
                {outgoingPayments?.map(
                  ({ scheduleConfiguration, paymentExecutions }, index) => {
                    return (
                      <PaymentCard
                        key={index}
                        scheduleConfiguration={scheduleConfiguration}
                        paymentExecutions={paymentExecutions}
                        address={scheduleConfiguration.recipient}
                        showActions={true}
                      />
                    );
                  }
                )}
              </div>
            </div>
          ) : (
            <></>
          )}
        </div>
      )}
    </>
  );
};

export default MyPaymentsContainer;
