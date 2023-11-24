import { Button } from '@/core/components/ui/Button';
import { DialogClose } from '@/core/components/ui/Dialog';
import { Separator } from '@/core/components/ui/Separator';
import useWallet, { useAllWallets } from '@/lib/hooks/useWallet';
import { Download, LogIn } from 'lucide-react';
import Image from 'next/image';

const WalletList: React.FC<{}> = () => {
  const { installedWallets, uninstalledWallets } = useAllWallets();
  const { connect } = useWallet();

  return (
    <div>
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <LogIn />
          <p>Installed:</p>
        </div>

        {installedWallets.map(({ logo, extensionName, title }, index) => (
          <DialogClose key={index} asChild>
            <Button className="gap-2" onClick={() => connect(extensionName)}>
              <Image src={logo.src} alt={logo.alt} width={30} height={30} />

              {title}
            </Button>
          </DialogClose>
        ))}
      </div>

      <Separator className="my-6" title="or" />

      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <Download />
          <p>Download:</p>
        </div>

        {uninstalledWallets.map(({ logo, installUrl, title }, index) => (
          <Button
            key={index}
            className="gap-2"
            onClick={() => window.open(installUrl, '_blank')}
          >
            <Image src={logo.src} alt={logo.alt} width={30} height={30} />

            {title}
          </Button>
        ))}
      </div>
    </div>
  );
};

export default WalletList;
