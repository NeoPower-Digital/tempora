import {
  batchTransactions,
  crossChainTransfer,
  getDefaultAssetBalance,
  getTokenBalanceOfAccount,
  signAndSendPromise,
  transfer,
  xcmLocationToAssetIdNumber,
} from '@/lib/helpers/polkadotjs.helper';
import {
  calculateProxyAccounts,
  createProxyAccount,
  getCrossChainTransferParameters,
  validateProxyAccount,
} from '@/lib/helpers/proxyAccounts.helper';
import chainsConfigState from '@/lib/state/chainsConfig.atom';
import proxyAccountsState from '@/lib/state/proxyAccounts.atom';
import { BN } from '@polkadot/util';
import { decodeAddress } from '@polkadot/util-crypto';
import { useRecoilState, useRecoilValue } from 'recoil';
import { convertWithScientificNotation } from '../utils/balance';
import useWallet from './useWallet';
/**
 * Initial balance needed for a proxy account in the origin chain
 * @constant
 */
export const ORIGIN_INITIAL_BALANCE = convertWithScientificNotation(1, 15);

/**
 * Initial balance needed for a proxy account in the target chain
 * @constant
 */
export const TARGET_INITIAL_BALANCE = convertWithScientificNotation(1, 17);

/**
 * Minimum balance needed to make a transfer to a proxy account
 */
export const PROXY_ACCOUNT_MIN_TRANSFER_BALANCE = convertWithScientificNotation(
  1,
  10
);

/**
 * Hook for managing proxy accounts and related operations
 *
 * @returns
 * - calculateProxies - Calculates proxy addresses derived from the connected account address.
 * - proxiesExist - Validates if origin and target proxy accounts exist.
 * - getProxiesBalances -  Updates the balances of origin and target proxy accounts.
 * - createAccounts - Creates proxy accounts for origin and/or target chains.
 * - topUpProxyAccounts - Tops up the balances of proxy accounts on the origin and/or
 *                        target chains to meet specified minimum balances.
 */
const useProxyAccounts = () => {
  const [proxyAccounts, setProxyAccountsState] =
    useRecoilState(proxyAccountsState);

  const { originConfig, targetConfig } = useRecoilValue(chainsConfigState);
  const { account } = useWallet();

  /**
   * Calculates both origin and target proxy addresses derived from
   * the connected account address, then it saves these addresses in `proxyAccounts` atom state
   *
   * @remarks
   * For the origin address we use derivation function V3, while for target address
   * we use derivation function V2
   *
   * @requires
   * - A connected `account`
   * - *Target* api is setted in `chainsConfig` atom state
   */
  const calculateProxies = () => {
    if (!account || !targetConfig.getApi()) return;

    const calculatedProxyAddresses = calculateProxyAccounts(
      originConfig.chain,
      targetConfig.chain,
      account,
      targetConfig.getApi()!
    );

    setProxyAccountsState({ ...calculatedProxyAddresses });
  };

  /**
   * Validates if origin and target proxy accounts exist
   *
   * @requires
   * - *Origin* and *Target* apis setted in `chainsConfig` atom state
   *
   * @returns a promise that resolves in an object that indicates if both origin and target proxy accounts exist
   */
  const proxiesExist = async () => {
    const result = {
      originExists: await validateProxyAccount(
        originConfig.getParachainAddress(account!.address),
        proxyAccounts.originProxyAddress,
        originConfig.getApi()!
      ),
      targetExists: await validateProxyAccount(
        targetConfig.getParachainAddress(account!.address),
        proxyAccounts.targetProxyAddress,
        targetConfig.getApi()!
      ),
    };

    return result;
  };

  /**
   * Updates the balances of origin and target proxy accounts in `proxyAccounts` atom state
   *
   * @requires
   * - **Execute `calculateProxies` before using this function**
   * - Proxy addresses calculated and saved in `proxyAccounts` atom state.
   * - *Origin* and *Target* apis setted in `chainsConfig` atom state
   * - Origin config `getDefaultAsset` is configured
   */
  const getProxiesBalances = async () => {
    const originAccountBalance = await getDefaultAssetBalance(
      originConfig.getApi()!,
      proxyAccounts.originProxyAddress
    );

    const originTokenOnTargetChain = (
      await xcmLocationToAssetIdNumber(
        targetConfig.getApi()!,
        originConfig.getDefaultAsset()
      )
    ).toNumber();

    const targetAccountBalance = await getTokenBalanceOfAccount(
      targetConfig.getApi()!,
      proxyAccounts.targetProxyAddress,
      originTokenOnTargetChain
    );

    setProxyAccountsState((current) => ({
      ...current,
      originProxyFreeBalance: originAccountBalance.free.toString(),
      targetProxyFreeBalance: targetAccountBalance.free.toString(),
    }));
  };

  /**
   * Creates proxy accounts for origin and/or target chains, considering if it is needed.
   *
   * If a proxy account already exists on a chain, the corresponding creation is not executed.
   *
   * @param originExists - Indicates whether a proxy account already exists on the origin chain
   * @param targetExists - Indicates whether a proxy account already exists on the target chain
   *
   * @requires
   * - Proxy addresses calculated and saved in `proxyAccounts` atom state.
   * - *Origin* and *Target* apis setted in `chainsConfig` atom state
   *
   * @returns an array of promises that contain one or two promises that create a proxy account
   */
  const createAccounts = async (
    originExists: boolean,
    targetExists: boolean
  ) => {
    const promisesToExecute = [];

    if (!originExists)
      promisesToExecute.push(
        createProxyAccount(
          account!,
          originConfig.getApi()!,
          proxyAccounts.originProxyAddress
        )
      );

    if (!targetExists)
      promisesToExecute.push(
        createProxyAccount(
          account!,
          targetConfig.getApi()!,
          proxyAccounts.targetProxyAddress
        )
      );

    // TODO This shows both modal to approve transactions at the same time.
    // If we want to do one at a time we have to await every call to createProxyAccount and avoid promiseAll
    return Promise.all(promisesToExecute);
  };

  /**
   * Calculates the balance for topping-up a proxy account based on the required fee for the scheduled payment.
   *
   * @param balanceForFee - The desired balance to cover fees for the proxy account.
   * @param currentBalanceStr - The current balance of the proxy account.
   * @param initialBalance - The initial balance that a proxy account must have.
   *
   * @returns The balance to top-up the proxy account.
   */
  const calculateTopUpBalance = (
    balanceForFee: BN,
    currentBalanceStr: string,
    initialBalance: BN
  ) => {
    const currentBalance = new BN(currentBalanceStr);
    let topUpBalance: BN | undefined;

    if (currentBalance.isZero()) {
      topUpBalance = initialBalance.lt(balanceForFee)
        ? balanceForFee
        : initialBalance;
    } else if (currentBalance.lt(balanceForFee)) {
      const balanceDifference = balanceForFee.sub(currentBalance);
      topUpBalance = balanceDifference.lt(PROXY_ACCOUNT_MIN_TRANSFER_BALANCE)
        ? PROXY_ACCOUNT_MIN_TRANSFER_BALANCE
        : balanceDifference;
    }

    return topUpBalance;
  };

  /**
   * Calculates the total balance for topping-up proxy accounts based on the required fee for the scheduled payment.
   *
   * @param originBalanceForFee - The desired balance to cover fees for the origin proxy account.
   * @param targetBalanceForFee - The desired balance to cover fees for the target proxy account.
   *
   * @returns The balances to top-up the proxy accounts.
   */
  const calculateTotalTopUpBalances = (
    originBalanceForFee: BN,
    targetBalanceForFee: BN
  ): {
    originTopUpBalance: BN | undefined;
    targetTopUpBalance: BN | undefined;
  } => {
    const originTopUpBalance = calculateTopUpBalance(
      originBalanceForFee,
      proxyAccounts.originProxyFreeBalance!,
      ORIGIN_INITIAL_BALANCE
    );

    const targetTopUpBalance = calculateTopUpBalance(
      targetBalanceForFee,
      proxyAccounts.targetProxyFreeBalance!,
      TARGET_INITIAL_BALANCE
    );

    return { originTopUpBalance, targetTopUpBalance };
  };

  /**
   * Tops up the balances of proxy accounts on the origin and/or target chains to meet specified required balances.
   *
   * @remarks
   * Both *transfer* and *crosschain transfer* are batched in a single transaction so only one signature is needed.
   *
   * @requires
   * - Proxy addresses calculated and saved in `proxyAccounts` atom state.
   * - *Origin* and *Target* apis setted in `chainsConfig` atom state.
   * - *Target* chain prefix is setted in `chainsConfig`
   *
   * @param originBalanceForFee - The desired balance to cover fees for the origin proxy account.
   * @param targetBalanceForFee - The desired balance to cover fees for the target proxy account.
   * @returns A promise that resolves to an array of extrinsics representing the topping up of proxy account balances.
   *          If no topping up is required, the promise resolves to void.
   */
  const topUpProxyAccounts = async (
    originTopUpBalance?: BN,
    targetTopUpBalance?: BN
  ) => {
    const extrinsicsToSign = [];

    if (originTopUpBalance) {
      extrinsicsToSign.push(
        transfer(
          originConfig.getApi()!,
          proxyAccounts.originProxyAddress,
          originTopUpBalance
        )
      );
    }

    if (targetTopUpBalance) {
      extrinsicsToSign.push(
        crossChainTransfer(
          originConfig.getApi()!,
          ...getCrossChainTransferParameters(
            // TODO Implement a better way to consider the fees in crossChainTransfer.
            targetTopUpBalance,
            decodeAddress(
              proxyAccounts.targetProxyAddress,
              undefined,
              targetConfig.chain.prefix
            ),
            targetConfig.chain.paraId!
          )
        )
      );
    }

    return (
      extrinsicsToSign.length > 0 &&
      signAndSendPromise(
        batchTransactions(originConfig.getApi()!, extrinsicsToSign),
        account!
      )
    );
  };

  return {
    calculateProxies,
    proxiesExist,
    getProxiesBalances,
    createAccounts,
    calculateTopUpBalance,
    calculateTotalTopUpBalances,
    topUpProxyAccounts,
    PROXY_ACCOUNT_MIN_TRANSFER_BALANCE,
  };
};

export default useProxyAccounts;
