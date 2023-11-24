import Environments from '@/core/models/environment';
import { XCM_LOCATION } from '@/lib/constants/xcm.const';
import { scheduleXcmpTaskThroughProxy } from '@/lib/helpers/oak.helper';
import {
  extrinsicViaProxy,
  sendXcm,
  signAndSendPromise,
  transfer,
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
import { XcmV3MultiLocation } from '@polkadot/types/lookup';
import { useRecoilValue } from 'recoil';
import {
  ContractSubmittableResult,
  ISubmittableResult,
  SubmittableExtrinsic,
} from 'useink/core';
import { NewPaymentSummary } from '../../../app/new-recurring-payment/page';
import { WeightLimitType, XcmBuilder } from '../helpers/xcm.builder';
import { convertWithScientificNotation } from '../utils/balance';

/**
 * Hook for configuring and scheduling crosschain payments using OAK Network.
 *
 * @returns An object containing a function to configure and schedule crosschain payments.
 */
const useSchedulePayment = () => {
  const { account } = useWallet();
  const { originConfig, targetConfig } = useRecoilValue(chainsConfigState);

  const { topUpProxyAccounts, calculateTotalTopUpBalances } =
    useProxyAccounts();
  const { getOriginExtrinsicFeeEstimation, getTargetExtrinsicFeeEstimation } =
    useFeeEstimation();

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
      scheduleConfiguration = {
        Fixed: { executionTimes: [0] },
      };
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
  ) =>
    schedulePaymentConfiguration.type === SchedulePaymentType.Fixed
      ? schedulePaymentConfiguration.executionDates.length
      : 10;

  /**
   * Generates extrinsics, estimates fees and calculates the balances for proxy accounts topping-up.
   *
   * @param schedulePaymentConfiguration - The configuration for the payment to schedule.
   *
   * @returns An object containing the extrinsics, fees and balances for proxy accounts topping-up.
   */
  const generateExtrinsicsAndEstimate = async (
    schedulePaymentConfiguration: OakSchedulePaymentConfiguration
  ) => {
    const transferExtrinsic = transfer(
      originConfig.getApi()!,
      schedulePaymentConfiguration.recipient,
      convertWithScientificNotation(
        schedulePaymentConfiguration.amountByTx,
        originConfig.decimals || 18
      )
    );

    const transferExtrinsicViaProxy = extrinsicViaProxy(
      originConfig.getApi()!,
      account!.address,
      transferExtrinsic
    );

    const originFeeEstimation = await getOriginExtrinsicFeeEstimation(
      transferExtrinsicViaProxy
    );

    const originChainLocation = originConfig.getDefaultAsset();

    const taskScheduleExtrinsic = createScheduledTaskExtrinsic(
      originFeeEstimation,
      transferExtrinsicViaProxy,
      schedulePaymentConfiguration.schedule,
      originChainLocation
    );

    const targetFeeEstimation = await getTargetExtrinsicFeeEstimation(
      taskScheduleExtrinsic!
    );

    const iterationsToCoverFeeOnOrigin =
      getNumberOfIterationsByScheduleConfiguration(
        schedulePaymentConfiguration
      );

    const { originTopUpBalance, targetTopUpBalance } =
      calculateTotalTopUpBalances(
        originFeeEstimation.totalXcmExtrinsicFee.muln(
          iterationsToCoverFeeOnOrigin
        ),
        targetFeeEstimation.totalXcmExtrinsicFee
      );

    return {
      taskScheduleExtrinsic,
      originFeeEstimation,
      targetFeeEstimation,
      iterationsToCoverFeeOnOrigin,
      originTopUpBalance,
      targetTopUpBalance,
    };
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
  const createScheduledPayment = async ({
    targetFeeEstimation,
    taskScheduleExtrinsic,
    originTopUpBalance,
    targetTopUpBalance,
  }: NewPaymentSummary): Promise<ContractSubmittableResult> => {
    await topUpProxyAccounts(originTopUpBalance!, targetTopUpBalance!);

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

    const xcmExtrinsic = sendXcm(
      originConfig.getApi()!,
      { V3: XCM_LOCATION.PARACHAIN(targetConfig.chain.paraId!) },
      xcmMessage
    );

    return await signAndSendPromise(xcmExtrinsic, account!);
  };

  return {
    generateExtrinsicsAndEstimate,
    createScheduledPayment,
  };
};

export default useSchedulePayment;
