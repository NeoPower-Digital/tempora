import psp22ContractMetadata from '@lib/contracts/psp22_contract_metadata.json';
import {
  useBalance,
  useCall,
  useContract,
  useInstalledWallets,
  useUninstalledWallets,
  useWallet as useinkUseWallet,
} from 'useink';

/**
 * Hook to obtain the PSP22 token balance of a specific account.
 *
 * It uses the `useContract` and `useCall` hooks from **useink**.
 */
const usePsp22Balance = () => {
  const psp22Contract = useContract(
    process.env.NEXT_PUBLIC_PSP22_TOKEN_ADDRESS,
    psp22ContractMetadata
  );

  return useCall<string>(psp22Contract, 'psp22::balanceOf');
};

/**
 * Hook to encapsulate the UI from the specific library implementation.
 *
 * It combines the functionality of **useink** `useWallet`, `useBalance` and `usePsp22Balance`.
 *
 * @returns an object with properties and methods related to wallet functionality.
 */
const useWallet = () => {
  return {
    ...useinkUseWallet(),
    useBalance,
    usePsp22Balance,
  };
};

export const useAllWallets = () => {
  return {
    installedWallets: useInstalledWallets(),
    uninstalledWallets: useUninstalledWallets(),
  };
};

export default useWallet;
