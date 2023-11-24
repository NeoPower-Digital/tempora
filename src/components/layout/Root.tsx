/* eslint-disable react-hooks/exhaustive-deps */
import useProxyAccounts from '@/lib/hooks/useProxyAccounts';
import useWallet from '@/lib/hooks/useWallet';
import { chainsApiReady } from '@/lib/state/chainsConfig.atom';
import proxyAccountsState, {
  proxiesAddressCalculated,
} from '@/lib/state/proxyAccounts.atom';
import { useQuery } from '@tanstack/react-query';
import { FC, useEffect } from 'react';
import { useRecoilValue } from 'recoil';

const Root: FC<{ children: React.ReactNode }> = ({ children }) => {
  const { originProxyAddress, targetProxyAddress } =
    useRecoilValue(proxyAccountsState);
  const proxiesCalculated = useRecoilValue(proxiesAddressCalculated);

  const apisReady = useRecoilValue(chainsApiReady);

  const { account } = useWallet();

  const { getProxiesBalances, proxiesExist, calculateProxies } =
    useProxyAccounts();

  // Check if proxy accounts exist
  const { data: proxiesExistData } = useQuery({
    queryKey: ['proxiesExist', originProxyAddress, targetProxyAddress],
    queryFn: proxiesExist,
    enabled: apisReady && proxiesCalculated,
  });

  useEffect(() => {
    if (!account || !apisReady) return;

    calculateProxies();
  }, [account, apisReady]);

  useEffect(() => {
    if (proxiesExistData?.originExists && proxiesExistData.targetExists)
      getProxiesBalances();
  }, [getProxiesBalances, originProxyAddress, targetProxyAddress]);

  return (
    <div className="container mt-10 flex flex-col items-center">{children}</div>
  );
};

export default Root;
