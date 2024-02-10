import Environments from '@/core/models/environment';
import { XCM_LOCATION } from '@/lib/constants/xcm.const';
import {
  cancelTaskWithScheduleAs,
  scheduleXcmpTaskThroughProxy,
} from '@/lib/helpers/oak.helper';
import {
  batchTransactions,
  extrinsicViaProxy,
  sendXcm,
  signAndSendPromise,
} from '@/lib/helpers/polkadotjs.helper';
import {
  OakSchedulePayment,
  OakSchedulePaymentConfiguration,
  SchedulePaymentType,
} from '@/lib/models/schedule-payment.model';
import chainsConfigState from '@/lib/state/chainsConfig.atom';
import useFeeEstimation, { FeeEstimation } from '@hooks/useFeeEstimation';
import useProxyAccounts from '@hooks/useProxyAccounts';
import useWallet from '@hooks/useWallet';
import { UnsubscribePromise } from '@polkadot/api/types';
import { XcmV3MultiLocation } from '@polkadot/types/lookup';
import { BN } from '@polkadot/util';
import { blake2AsHex } from '@polkadot/util-crypto';
import { useRecoilValue } from 'recoil';
import {
  ContractSubmittableResult,
  ISubmittableResult,
  SubmittableExtrinsic,
} from 'useink/core';
import { WeightLimitType, XcmBuilder } from '../helpers/xcm.builder';
import {
  ScheduleConfiguration,
  getOakConfigurationFromSchedule,
} from '../models/schedule-configuration.model';
import proxyAccountsState from '../state/proxyAccounts.atom';
import { convertWithScientificNotation } from '../utils/balance';
import useContract from './useContract';

/**
 * Hook for configuring and scheduling crosschain payments using OAK Network.
 *
 * @returns An object containing a function to configure and schedule crosschain payments.
 */
const useSchedulePayment = () => {
  const { account } = useWallet();
  const { originConfig, targetConfig } = useRecoilValue(chainsConfigState);
  const { targetProxyAddress } = useRecoilValue(proxyAccountsState);

  const { getTopUpProxyAccountsExtrinsics, calculateTotalTopUpBalances } =
    useProxyAccounts();
  const { getOriginExtrinsicFeeEstimation, getTargetExtrinsicFeeEstimation } =
    useFeeEstimation();
  const {
    getSaveScheduleExtrinsic,
    getTriggerPaymentExtrinsic,
    getRemoveScheduleExtrinsic,
    getUpdateScheduleExtrinsic,
    getIncreasePsp22AllowanceExtrinsic,
  } = useContract(originConfig);

  /**
   * Generates a hash for a scheduled payment.
   *
   * @param recipient - The recipient's address for the scheduled payment.
   * @param amountByTx - The amount of the payment per transaction.
   * @param type - The type of scheduled payment.
   * @returns The hash for the scheduled payment.
   */
  const generateSchedulePaymentHash = (
    recipient: string,
    amountByTx: BN,
    type: SchedulePaymentType
  ): `0x${string}` => {
    const schedulePaymentData =
      recipient +
      amountByTx.toString() +
      type.toString() +
      Date.now().toString();

    return blake2AsHex(schedulePaymentData);
  };

  /**
   * Creates a scheduled task for a crosschain payment using OAK Network.
   *
   * @param originExtrinsicWeight - The weight of the extrinsic to schedule.
   * @param originTotalXcmExtrinsicWeight - The total XCM weight of the extrinsic to schedule.
   * @param originTotalXcmExtrinsicFee - The total XCM fee of the extrinsic to schedule.
   * @param extrinsicToSchedule - The extrinsic to schedule.
   * @param scheduleConfiguration - The configuration for the payment to schedule.
   * @param originChainLocation - The location of the origin chain.
   *
   * @returns A promise that resolves to the result of the scheduled task.
   */
  const createScheduledTaskExtrinsic = (
    {
      extrinsicWeight: originExtrinsicWeight,
      totalXcmExtrinsicWeight: originTotalXcmExtrinsicWeight,
      totalXcmExtrinsicFee: originTotalXcmExtrinsicFee,
    }: FeeEstimation,
    extrinsicToSchedule: SubmittableExtrinsic<'promise', ISubmittableResult>,
    scheduleConfiguration: OakSchedulePayment,
    originChainLocation: XcmV3MultiLocation
  ) => {
    const destination = { V3: originChainLocation };
    const scheduleFee = { V3: originChainLocation };
    const executionFee = {
      assetLocation: { V3: originChainLocation },
      amount: originTotalXcmExtrinsicFee,
    };
    const encodedCall = extrinsicToSchedule.method.toHex();
    const encodedCallWeight = originExtrinsicWeight;
    const overallWeight = originTotalXcmExtrinsicWeight;
    const scheduleAs = account!.address;

    if (
      process.env.NEXT_PUBLIC_CHAIN_ENVIRONMENT === Environments.Development
    ) {
      // scheduleConfiguration = {
      //   Fixed: { executionTimes: [0] } as OakFixedPayment,
      // };
    }

    return scheduleXcmpTaskThroughProxy(
      targetConfig.getApi()!,
      scheduleConfiguration,
      destination,
      scheduleFee,
      executionFee,
      encodedCall,
      encodedCallWeight,
      overallWeight,
      scheduleAs
    );
  };

  /**
   * Gets the number of iterations required to cover the fee of a recurring payment based on its schedule configuration.
   *
   * @param schedulePaymentConfiguration - The scheduñe configuration for the payment.
   *
   * @returns The number of iterations required.
   */
  const getNumberOfIterationsByScheduleConfiguration = (
    schedulePaymentConfiguration: OakSchedulePaymentConfiguration
  ) => {
    const { values } = schedulePaymentConfiguration;

    return values.type === SchedulePaymentType.Fixed
      ? values.executionDates.length
      : 10;
  };

  /**
   * Generates extrinsics, estimates fees and calculates the balances for proxy accounts topping-up.
   *
   * @param schedulePaymentConfiguration - The configuration for the payment to schedule.
   *
   * @returns An object containing the extrinsics, fees and balances for proxy accounts topping-up.
   */
  const generateExtrinsicsAndEstimate = async (
    schedulePaymentConfiguration: OakSchedulePaymentConfiguration,
    scheduleHash?: `0x${string}`
  ) => {
    const {
      schedule: scheduleConfiguration,
      values: paymentConfiguration,
      paymentToken,
    } = schedulePaymentConfiguration;

    const { amountByTx, recipient, type } = paymentConfiguration;

    const paymentTokenAddress = paymentToken.isNative
      ? undefined
      : paymentToken.address;

    const amountByTxBN = convertWithScientificNotation(
      amountByTx,
      paymentToken.decimals || originConfig.decimals || 18
    );

    const schedulePaymentHash =
      scheduleHash ||
      generateSchedulePaymentHash(recipient, amountByTxBN, type);

    const { startTime, interval, executionTimes } =
      scheduleConfiguration.getScheduleValues();

    const saveScheduleTx = await getSaveScheduleExtrinsic(
      schedulePaymentHash,
      account!.address,
      'taskId', // Mock taskId for extrinsic estimation
      recipient,
      amountByTxBN,
      paymentTokenAddress,
      startTime,
      interval,
      executionTimes
    );

    const saveScheduleTxFeeEstimation =
      await getOriginExtrinsicFeeEstimation(saveScheduleTx);

    const triggerPaymentTx = await getTriggerPaymentExtrinsic(
      account!.address,
      recipient,
      amountByTxBN,
      paymentTokenAddress,
      schedulePaymentHash
    );

    const triggerPaymentTxViaProxy = extrinsicViaProxy(
      originConfig.getApi()!,
      account!.address,
      triggerPaymentTx!
    );

    const triggerPaymentTxViaProxyFeeEstimation =
      await getOriginExtrinsicFeeEstimation(triggerPaymentTxViaProxy);

    const originChainLocation = originConfig.getDefaultAsset();

    const taskScheduleExtrinsic = createScheduledTaskExtrinsic(
      triggerPaymentTxViaProxyFeeEstimation,
      triggerPaymentTxViaProxy,
      schedulePaymentConfiguration.scheduleForOak,
      originChainLocation
    );

    const targetFeeEstimation = await getTargetExtrinsicFeeEstimation(
      taskScheduleExtrinsic!
    );

    const iterationsToCoverFeeOnOrigin =
      getNumberOfIterationsByScheduleConfiguration(
        schedulePaymentConfiguration
      );

    const originFeesToPayViaProxy =
      triggerPaymentTxViaProxyFeeEstimation.totalXcmExtrinsicFee.muln(
        iterationsToCoverFeeOnOrigin
      );

    const { originTopUpBalance, targetTopUpBalance } =
      calculateTotalTopUpBalances(
        originFeesToPayViaProxy,
        targetFeeEstimation.totalXcmExtrinsicFee
      );

    const originFeeEstimation = originFeesToPayViaProxy.add(
      saveScheduleTxFeeEstimation.totalXcmExtrinsicFee
    );

    const getActionsOnTaskScheduled = async (
      taskId: string
    ): Promise<SubmittableExtrinsic<'promise', ISubmittableResult>[]> => {
      const saveScheduleExtrinsic = await getSaveScheduleExtrinsic(
        schedulePaymentHash,
        account!.address,
        taskId,
        recipient,
        amountByTxBN,
        paymentTokenAddress,
        startTime,
        interval,
        executionTimes
      );

      if (paymentToken.isNative) return [saveScheduleExtrinsic];

      const increasePsp22AllowanceExtrinsic =
        await getIncreasePsp22AllowanceExtrinsic(
          account!.address,
          paymentTokenAddress!,
          amountByTxBN
        );

      return [increasePsp22AllowanceExtrinsic, saveScheduleExtrinsic];
    };

    return {
      taskScheduleExtrinsic,
      originFeeEstimation,
      targetFeeEstimation,
      iterationsToCoverFeeOnOrigin,
      originTopUpBalance,
      targetTopUpBalance,
      getActionsOnTaskScheduled,
    };
  };

  /**
   * Tops up accounts by executing a batch of transactions to top up proxy accounts.
   *
   * @param originTopUpBalance - The balance to top up the origin account (optional).
   * @param targetTopUpBalance - The balance to top up the target account (optional).
   *
   * @returns A promise that resolves with the result of the batch transaction.
   * @throws Error if the origin configuration API or the account is not available.
   */
  const topUpAccounts = async (
    originTopUpBalance: BN | undefined,
    targetTopUpBalance: BN | undefined
  ) => {
    const topUpProxyAccountExtrinsics = getTopUpProxyAccountsExtrinsics(
      originTopUpBalance,
      targetTopUpBalance
    );

    if (topUpProxyAccountExtrinsics.length === 0) return;

    return await signAndSendPromise(
      batchTransactions(originConfig.getApi()!, [
        ...topUpProxyAccountExtrinsics,
      ]),
      account!
    );
  };

  /**
   * Constructs an extrinsic to create a task in OAK using XCM.
   *
   * @param targetFeeEstimation - The fee estimation for the target chain.
   * @param taskScheduleExtrinsic - The extrinsic representing the task schedule.
   *
   * @returns A promise that resolves with the extrinsic to create the task using XCM.
   * @throws Error if the origin configuration API, default asset, or account is not available.
   */
  const getCreateTaskXcmExtrinsic = (
    targetFeeEstimation: FeeEstimation,
    taskScheduleExtrinsic: SubmittableExtrinsic<'promise', ISubmittableResult>
  ) => {
    const xcmMessage = new XcmBuilder()
      .addWithdrawAsset(
        originConfig.getDefaultAsset(),
        targetFeeEstimation.totalXcmExtrinsicFee
      )
      .addBuyExecution(
        originConfig.getDefaultAsset(),
        targetFeeEstimation.totalXcmExtrinsicFee,
        WeightLimitType.Limited,
        targetFeeEstimation.totalXcmExtrinsicWeight
      )
      .addTransact(targetFeeEstimation.extrinsicWeight, taskScheduleExtrinsic!)
      .addRefundSurplus()
      .addDepositAsset(account!.address)
      .build();

    return sendXcm(
      originConfig.getApi()!,
      { V3: XCM_LOCATION.PARACHAIN(targetConfig.chain.paraId!) },
      xcmMessage
    );
  };

  /**
   * Configures and schedules a crosschain payment using OAK Network.
   *
   * @param targetFeeEstimation - The fee estimation for the target chain.
   * @param taskScheduleExtrinsic - The extrinsic to schedule.
   * @param originTopUpBalance - The balance to top-up the proxy account on the origin chain.
   * @param targetTopUpBalance - The balance to top-up the proxy account on the target chain.
   *
   * @returns A promise that resolves to the result of the scheduled payment.
   */
  const createAndSaveScheduledPayment = async (
    targetFeeEstimation: FeeEstimation,
    taskScheduleExtrinsic: SubmittableExtrinsic<'promise', ISubmittableResult>,
    getActionsOnTaskScheduled: (
      // eslint-disable-next-line no-unused-vars
      taskId: string
    ) => Promise<SubmittableExtrinsic<'promise', ISubmittableResult>[]>
  ): Promise<ContractSubmittableResult> => {
    const xcmExtrinsic = getCreateTaskXcmExtrinsic(
      targetFeeEstimation,
      taskScheduleExtrinsic
    );
    await signAndSendPromise(xcmExtrinsic, account!);

    return await actionOnTaskScheduled(getActionsOnTaskScheduled);
  };

  /**
   * Executes an action when a task is scheduled.
   *
   * @param getActionTx - A function that retrieves the transaction to be executed based on the task ID.
   *
   * @returns A promise that resolves with the result of the action on task scheduled.
   * @throws Error if the target configuration API or the account is not available, or if a timeout occurs.
   */
  const actionOnTaskScheduled = async (
    getActionExtrinsics: (
      // eslint-disable-next-line no-unused-vars
      taskId: string
    ) => Promise<SubmittableExtrinsic<'promise', ISubmittableResult>[]>
  ) => {
    let unsubscribeEventListener: UnsubscribePromise | undefined;
    const result = await new Promise<ContractSubmittableResult>(
      (resolve, reject) => {
        // Timeout after 5 minutes
        const timeout = setTimeout(() => {
          console.error('Timed out');
          reject('Timeout');
        }, 1000 * 300);

        unsubscribeEventListener = targetConfig
          .getApi()
          ?.query.system.events((events) => {
            events
              .filter(({ event }) => event.method == 'TaskScheduled')
              .map(async ({ event }) => {
                if (
                  (event.data as any).scheduleAs ==
                  targetConfig.getParachainAddress(account!.address)
                ) {
                  const taskId = Buffer.from(
                    (event.data as any).taskId
                  ).toString();

                  const result = await signAndSendPromise(
                    batchTransactions(
                      originConfig.getApi()!,
                      await getActionExtrinsics(taskId)
                    ),
                    account!
                  );

                  resolve(result);
                  clearTimeout(timeout);
                }
              });
          });
      }
    );

    (await unsubscribeEventListener)!();

    return result;
  };

  /**
   * Constructs an extrinsic to cancel a task in OAK via XCM .
   *
   * @param taskId - The ID of the task to be canceled.
   *
   * @returns A promise that resolves with the extrinsic to cancel the task via XCM.
   * @throws Error if the target configuration API or the account is not available.
   */
  const getCancelTaskExtrinsic = async (taskId: string) => {
    if (!targetConfig.getApi() || !account?.address) return;

    const cancelTaskExtrinsicViaProxy = extrinsicViaProxy(
      targetConfig.getApi()!,
      account.address,
      cancelTaskWithScheduleAs(
        targetConfig.getApi()!,
        targetProxyAddress,
        taskId
      )
    );

    const targetFeeEstimation = await getTargetExtrinsicFeeEstimation(
      cancelTaskExtrinsicViaProxy
    );

    const xcmMessage = new XcmBuilder()
      .addWithdrawAsset(
        originConfig.getDefaultAsset(),
        targetFeeEstimation.totalXcmExtrinsicFee
      )
      .addBuyExecution(
        originConfig.getDefaultAsset(),
        targetFeeEstimation.totalXcmExtrinsicFee,
        WeightLimitType.Limited,
        targetFeeEstimation.totalXcmExtrinsicWeight
      )
      .addTransact(
        targetFeeEstimation.extrinsicWeight,
        cancelTaskExtrinsicViaProxy
      )
      .addRefundSurplus()
      .addDepositAsset(account.address)
      .build();

    return sendXcm(
      originConfig.getApi()!,
      { V3: XCM_LOCATION.PARACHAIN(targetConfig.chain.paraId!) },
      xcmMessage
    );
  };

  /**
   * Deletes a scheduled payment
   *
   * @param taskId - The ID of the scheduled payment task to be deleted.
   * @returns A promise that resolves once the task deletion is completed.
   */
  const deleteScheduledPayment = async (
    scheduleHash: `0x${string}`,
    taskId: string
  ) => {
    if (!targetConfig.getApi() || !account?.address) return;

    const cancelTaskExtrinsic = await getCancelTaskExtrinsic(taskId);

    const removeScheduleExtrinsic = await getRemoveScheduleExtrinsic(
      account.address,
      scheduleHash
    );

    signAndSendPromise(
      batchTransactions(originConfig.getApi()!, [
        cancelTaskExtrinsic!,
        removeScheduleExtrinsic,
      ]),
      account!
    );
  };

  /**
   * Updates the schedule configuration to remove past execution times or update the start time.
   *
   * @param scheduleConfiguration - The schedule configuration to be updated.
   */
  const updateScheduleConfiguration = (
    scheduleConfiguration: ScheduleConfiguration
  ) => {
    const { interval, startTime, executionTimes } = scheduleConfiguration;
    const isFixedPayment = !!executionTimes;
    const now = Math.floor(Date.now() / 1000);

    if (isFixedPayment) {
      scheduleConfiguration.executionTimes = executionTimes!.filter(
        (executionTime) => executionTime >= now
      );

      return;
    }

    const elapsedTime = now - startTime!;
    const pastIntervals = Math.floor(elapsedTime / interval!);
    scheduleConfiguration.startTime =
      startTime! + (pastIntervals + 1) * interval!;
  };

  /**
   * Updates a scheduled payment by canceling the existing task and creating a new one with updated configuration.
   *
   * @param scheduleConfiguration - The updated schedule configuration for the payment.
   *
   * @returns A promise that resolves with the result of the update.
   * @throws Error if the target configuration API or the account is not available.
   */
  const updateScheduledPayment = async (
    scheduleConfiguration: ScheduleConfiguration,
    previousAmount: string,
    tokenDecimals: number
  ) => {
    if (!targetConfig.getApi() || !account?.address) return;

    const cancelTaskXcmExtrinsic = await getCancelTaskExtrinsic(
      scheduleConfiguration.taskId
    );

    updateScheduleConfiguration(scheduleConfiguration);

    const {
      taskScheduleExtrinsic: createTaskExtrinsic,
      targetFeeEstimation: createTaskExtrinsicTargetFeeEstimation,
      originTopUpBalance,
      targetTopUpBalance,
    } = await generateExtrinsicsAndEstimate(
      getOakConfigurationFromSchedule(scheduleConfiguration, tokenDecimals)
    );

    const createTaskXcmExtrinsic = getCreateTaskXcmExtrinsic(
      createTaskExtrinsicTargetFeeEstimation,
      createTaskExtrinsic
    );

    await topUpAccounts(originTopUpBalance, targetTopUpBalance);

    signAndSendPromise(
      batchTransactions(originConfig.getApi()!, [
        cancelTaskXcmExtrinsic!,
        createTaskXcmExtrinsic,
      ]),
      account
    );

    const getActionsOnTaskScheduled = async (taskId: string) => {
      const updateScheduleExtrinsic = await getUpdateScheduleExtrinsic(
        account.address,
        {
          ...scheduleConfiguration,
          taskId,
        }
      );

      if (
        !scheduleConfiguration.tokenAddress ||
        new BN(scheduleConfiguration.amount) <= new BN(previousAmount)
      )
        return [updateScheduleExtrinsic];

      const increasePsp22AllowanceExtrinsic =
        await getIncreasePsp22AllowanceExtrinsic(
          account!.address,
          scheduleConfiguration.tokenAddress,
          new BN(scheduleConfiguration.amount).sub(new BN(previousAmount))
        );

      return [increasePsp22AllowanceExtrinsic, updateScheduleExtrinsic];
    };

    return actionOnTaskScheduled(getActionsOnTaskScheduled);
  };

  return {
    generateExtrinsicsAndEstimate,
    topUpAccounts,
    createAndSaveScheduledPayment,
    deleteScheduledPayment,
    updateScheduledPayment,
  };
};

export default useSchedulePayment;
