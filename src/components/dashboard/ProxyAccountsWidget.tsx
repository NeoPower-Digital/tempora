import { Button } from '@/core/components/ui/Button';
import { getFormattedBalance } from '@/lib/helpers/polkadotjs.helper';
import useProxyAccounts from '@/lib/hooks/useProxyAccounts';
import useWallet from '@/lib/hooks/useWallet';
import chainsConfigState, {
  chainsApiReady,
} from '@/lib/state/chainsConfig.atom';
import proxyAccountsState, {
  proxiesAddressCalculated,
} from '@/lib/state/proxyAccounts.atom';
import { BN } from '@polkadot/util';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CheckCircle, Info, Unplug } from 'lucide-react';
import { useRecoilValue } from 'recoil';
import AccountCard from './AccountCard';

interface ProxyAccountsWidgetProps {}

const ProxyAccountsWidget: React.FC<ProxyAccountsWidgetProps> = () => {
  const { originConfig, targetConfig } = useRecoilValue(chainsConfigState);
  const apisReady = useRecoilValue(chainsApiReady);
  const { account } = useWallet();
  const queryClient = useQueryClient();

  const {
    originProxyFreeBalance,
    targetProxyFreeBalance,
    originProxyAddress,
    targetProxyAddress,
  } = useRecoilValue(proxyAccountsState);
  const proxiesCalculated = useRecoilValue(proxiesAddressCalculated);

  const { createAccounts, proxiesExist } = useProxyAccounts();

  // Check if proxy accounts exist
  const { data: proxiesExistData, isLoading: proxiesExistsIsLoading } =
    useQuery({
      queryKey: ['proxiesExist', originProxyAddress, targetProxyAddress],
      queryFn: proxiesExist,
      enabled: apisReady && proxiesCalculated,
    });

  // If proxy accounts don't exist, create them
  const { mutate: createAccountsMutate, isPending: creatingAccounts } =
    useMutation({
      mutationFn: () =>
        createAccounts(
          proxiesExistData!.originExists,
          proxiesExistData!.targetExists
        ),
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: ['proxiesExist', originProxyAddress, targetProxyAddress],
        });
      },
    });

  const originBalance = getFormattedBalance(
    originConfig.getApi(),
    new BN(originProxyFreeBalance!)
  );
  const targetBalance = getFormattedBalance(
    originConfig.getApi(),
    new BN(targetProxyFreeBalance!)
  );

  const proxysExist =
    proxiesExistData?.originExists && proxiesExistData?.targetExists;

  if (!account) {
    return (
      <div className="flex items-center gap-2">
        <Info />
        <p>Connect your wallet to see your proxy accounts.</p>
      </div>
    );
  }

  if (!apisReady) {
    return (
      <div className="flex items-center gap-2">
        <Info />
        <p>Waiting for API to be ready...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center gap-4 mb-4">
        <AccountCard
          name={originConfig?.chain.name}
          address={originProxyAddress}
          isLoading={proxiesExistsIsLoading}
          balance={
            proxiesExistData?.originExists ? originBalance : 'Not created yet'
          }
        />

        {proxysExist ? <CheckCircle /> : <Unplug />}

        <AccountCard
          name={targetConfig?.chain.name}
          address={targetProxyAddress}
          isLoading={proxiesExistsIsLoading}
          balance={
            proxiesExistData?.targetExists ? targetBalance : 'Not created yet'
          }
        />
      </div>

      {!proxysExist && (
        <div>
          <p className="mb-2">
            Sign both TXs to create your proxy accounts for {account?.name}:
          </p>

          <Button
            onClick={() => createAccountsMutate()}
            disabled={creatingAccounts}
          >
            {creatingAccounts ? 'Creating accounts...' : 'Create Accounts'}
          </Button>
        </div>
      )}
    </div>
  );
};

export default ProxyAccountsWidget;
