'use client';

import useWallet from '@/lib/hooks/useWallet';
import chainsConfigState from '@/lib/state/chainsConfig.atom';
import { CheckCircle, Unplug } from 'lucide-react';
import { useRecoilValue } from 'recoil';
import AccountCard from './AccountCard';

const AccountsWidget: React.FC<{}> = () => {
  const { account } = useWallet();
  const { originConfig, targetConfig } = useRecoilValue(chainsConfigState);
  const isConnected = !!account;

  const fullOriginAddress = originConfig?.getParachainAddress(
    account?.address || ''
  );
  const originAddress = account ? fullOriginAddress : 'Connect your wallet';

  const fullTargetAddress = targetConfig?.getParachainAddress(
    account?.address || ''
  );
  const targetAddress = account ? fullTargetAddress : 'Connect your wallet';

  return (
    <div className="flex items-center gap-4">
      <AccountCard name={originConfig?.chain.name} address={originAddress} />

      {isConnected ? <CheckCircle /> : <Unplug />}

      <AccountCard name={targetConfig?.chain.name} address={targetAddress} />
    </div>
  );
};

export default AccountsWidget;
