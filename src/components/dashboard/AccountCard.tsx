import { Button } from '@/core/components/ui/Button';
import { Card, CardHeader, CardTitle } from '@/core/components/ui/Card';
import { Skeleton } from '@/core/components/ui/Skeleton';
import { formatAddress } from '@/lib/utils/address';
import { Check, Copy } from 'lucide-react';
import { useState } from 'react';

interface AccountCardProps {
  name: string;
  address: string;
  isLoading?: boolean;
  balance?: string;
  balanceLoading?: boolean;
}

const AccountCard: React.FC<AccountCardProps> = ({
  name,
  address,
  isLoading = false,
  balance,
  balanceLoading,
}) => {
  const [copied, setCopied] = useState(false);

  const copyAddressToClipboard = () => {
    navigator.clipboard.writeText(address);

    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Card className="flex-1">
      <CardHeader>
        <CardTitle>{name}</CardTitle>

        {isLoading || balanceLoading ? (
          <>
            <Skeleton className="h-4 w-[250px]" />
            <Skeleton className="h-4 w-[250px]" />
          </>
        ) : (
          <div className="font-mono text-muted-foreground">
            <div className="flex items-center gap-2">
              {formatAddress(address) || 'No address found'}

              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={copyAddressToClipboard}
              >
                {copied ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>

            {balance}
          </div>
        )}
      </CardHeader>
    </Card>
  );
};

export default AccountCard;
