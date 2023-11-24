import {
  Dialog,
  DialogContent,
  DialogTrigger,
} from '@/core/components/ui/Dialog';
import WalletList from './WalletList';

const WalletSelectorModal: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  return (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>

      <DialogContent>
        <WalletList />
      </DialogContent>
    </Dialog>
  );
};

export default WalletSelectorModal;
