import {
  useBalance,
  useInstalledWallets,
  useUninstalledWallets,
  useWallet as useinkUseWallet,
} from 'useink';

/**
 * Hook to encapsulate the UI from the specific library implementation.
 *
 * It combines the functionality of **useink** `useWallet` and `useBalance`.
 *
 * @returns an object with properties and methods related to wallet functionality.
 */
const useWallet = () => {
  return {
    ...useinkUseWallet(),
    useBalance,
  };
};

export const useAllWallets = () => {
  return {
    installedWallets: useInstalledWallets(),
    uninstalledWallets: useUninstalledWallets(),
  };
};

export default useWallet;
