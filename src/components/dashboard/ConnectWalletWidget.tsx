import { Button } from '@/core/components/ui/Button';
import { Skeleton } from '@/core/components/ui/Skeleton';
import { getFormattedBalance } from '@/lib/helpers/polkadotjs.helper';
import useWallet from '@/lib/hooks/useWallet';
import chainsConfigState from '@/lib/state/chainsConfig.atom';
import { LogOut } from 'lucide-react';
import { useRecoilValue } from 'recoil';
import AccountSelection from '../wallets/AccountSelection';
import WalletSelectorModal from '../wallets/WalletSelectorModal';

interface ConnectWalletWidgetProps {}

const ConnectWalletWidget: React.FC<ConnectWalletWidgetProps> = () => {
  const { originConfig } = useRecoilValue(chainsConfigState);
  const { account, disconnect, useBalance } = useWallet();

  const originBalance = useBalance(account, originConfig.chain.id);

  const originFormattedBalance = getFormattedBalance(
    originConfig.getApi(),
    originBalance?.freeBalance
  );

  return account ? (
    <>
      <div className="flex gap-4 mb-4">
        <AccountSelection />

        <Button
          variant="destructive"
          onClick={() => disconnect()}
          className="gap-2"
        >
          <LogOut size={16} /> Disconnect
        </Button>
      </div>

      {originFormattedBalance !== '-' ? (
        <p className="font-mono">{originFormattedBalance}</p>
      ) : (
        <Skeleton className="h-4 w-[250px]" />
      )}
    </>
  ) : (
    <WalletSelectorModal>
      <Button>Connect Wallet</Button>
    </WalletSelectorModal>
  );
};

export default ConnectWalletWidget;
