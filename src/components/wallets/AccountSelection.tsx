import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/core/components/ui/Select';
import useWallet from '@/lib/hooks/useWallet';
import { formatAddress } from '@/lib/utils/address';

const AccountSelection: React.FC<{}> = () => {
  const { account, accounts, setAccount } = useWallet();

  return (
    <Select
      defaultValue={account?.address}
      onValueChange={(value) =>
        setAccount(accounts?.find((acc) => acc.address === value)!)
      }
    >
      <SelectTrigger>
        <SelectValue placeholder="Select Account" />
      </SelectTrigger>

      <SelectContent>
        {accounts?.map(({ address, name }) => (
          <SelectItem key={address} value={address}>
            {`${name || 'Account'} - ${formatAddress(address)}`}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

export default AccountSelection;
