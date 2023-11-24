'use client';

import { Card, CardContent, CardHeader } from '@/core/components/ui/Card';
import AccountsWidget from './AccountsWidget';
import ConnectWalletWidget from './ConnectWalletWidget';
import ProxyAccountsWidget from './ProxyAccountsWidget';

const SetupSection: React.FC<{}> = () => {
  const steps = [
    {
      title: '👛 Connect your wallet',
      content: <ConnectWalletWidget />,
    },
    {
      title: '👥 Accounts',
      content: <AccountsWidget />,
    },
    {
      title: '🤖 Proxy accounts',
      content: <ProxyAccountsWidget />,
    },
  ];

  return (
    <div className="flex flex-col gap-4">
      {steps.map(({ title, content }, index) => (
        <Card key={index}>
          <CardHeader className="text-xl font-bold">{title}</CardHeader>

          <CardContent>{content}</CardContent>
        </Card>
      ))}
    </div>
  );
};

export default SetupSection;
