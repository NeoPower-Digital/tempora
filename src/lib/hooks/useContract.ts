import { BN } from '@polkadot/util';
import {
  Abi,
  ISubmittableResult,
  SubmittableExtrinsic,
  Weight,
} from 'useink/core';
import psp22ContractMetadata from '../contracts/psp22_contract_metadata.json';
import temporaContractMetadata from '../contracts/tempora_contract_metadata.json';
import {
  getExecuteContractExtrinsic,
  queryContract,
} from '../helpers/polkadotjs.contracts.helper';
import { ScheduleConfiguration } from '../models/schedule-configuration.model';
import { ChainConfiguration } from './useChainsConfig';

export const TEMPORA_CONTRACT_ADDRESS: string =
  process.env.NEXT_PUBLIC_CONTRACT_ADDRESS;

/**
 * Tempora Contract message names
 */
export const TEMPORA_CONTRACT_MESSAGES = {
  SAVE_SCHEDULE: 'saveSchedule',
  GET_SCHEDULES: 'getUserSchedules',
  TRIGGER_PAYMENT: 'triggerPayment',
  REMOVE_SCHEDULE: 'removeSchedule',
  UPDATE_SCHEDULE: 'updateSchedule',
} as const;

type TemporaContractMessage =
  (typeof TEMPORA_CONTRACT_MESSAGES)[keyof typeof TEMPORA_CONTRACT_MESSAGES];

export const PSP22_CONTRACT_MESSAGES = {
  INCREASE_ALLOWANCE: 'psp22::increaseAllowance',
} as const;

type Psp22ContractMessage =
  (typeof PSP22_CONTRACT_MESSAGES)[keyof typeof PSP22_CONTRACT_MESSAGES];

/**
 * Hook for interacting with the Tempora contract
 *
 * @returns
 * - getSaveScheduleExtrinsic: Returns an extrinsic to save a schedule based on its configuration.
 * - getTriggerPaymentExtrinsic: Returns an extrinsic to trigger a payment by a schedule hash.
 */
const useContract = (originConfig: ChainConfiguration) => {
  /**
   * Estimates the gas required to execute a contract message.
   *
   * @requires
   * - *Origin* apis setted in 'chainsConfig' atom state
   * - *Origin* decimals setted in 'chainsConfig' atom state
   *
   * @param sender - The sender address
   * @param messageName - The contract message name to execute
   * @param amountToTransfer - The amount to transfer within transaction (optional)
   * @param parameters - The parameters to pass to the contract message (optional)
   *
   * @returns The gas required to execute the contract message
   */
  const estimateMessageExtrinsic = async (
    sender: string,
    contractAddress: string,
    contractMetadata: string | Record<string, unknown> | Abi,
    messageName: TemporaContractMessage | Psp22ContractMessage,
    amountToTransfer?: BN,
    parameters?: any[]
  ): Promise<Weight> => {
    const { gasRequired } = await queryContract(
      originConfig.getApi()!,
      contractAddress,
      contractMetadata,
      sender,
      messageName,
      amountToTransfer,
      parameters
    );

    return gasRequired;
  };

  /**
   * Returns an extrinsic to execute a contract message.
   *
   * @requires
   * - *Origin* apis setted in 'chainsConfig' atom state
   * - *Origin* decimals setted in 'chainsConfig' atom state
   *
   * @param sender - The sender address
   * @param messageName - The contract message name to execute
   * @param amountToTransfer - The amount to transfer within transaction (optional)
   * @param parameters - The parameters to pass to the contract message (optional)
   *
   * @returns An extrinsic to execute a contract message.
   */
  const getMessageExtrinsic = async (
    sender: string,
    contractAddress: string,
    contractMetadata: string | Record<string, unknown> | Abi,
    messageName: TemporaContractMessage | Psp22ContractMessage,
    amountToTransfer?: BN,
    parameters?: any[]
  ): Promise<SubmittableExtrinsic<'promise', ISubmittableResult>> => {
    let api = originConfig?.getApi();
    if (!api) return Promise.reject('API not available');

    const gasRequired = await estimateMessageExtrinsic(
      sender,
      contractAddress,
      contractMetadata,
      messageName,
      amountToTransfer,
      parameters
    );

    const extrinsic = getExecuteContractExtrinsic(
      api,
      contractAddress,
      contractMetadata,
      messageName,
      gasRequired,
      amountToTransfer,
      parameters
    );

    return extrinsic;
  };

  /**
   * Returns an extrinsic to save a schedule based on its configuration.
   *
   * @param sender - The sender address
   * @param taskId - The taskId returned by Oak when creating the automated task
   * @param recipient - The recipient address
   * @param amount - The amount to be transferred to the recipient
   * @param startTime - The start time of the schedule (optional)
   * @param interval - The interval of the schedule (optional)
   * @param executionTimes - The execution times of the schedule (optional)
   *
   * @returns An extrinsic to save a schedule based on its configuration.
   */
  const getSaveScheduleExtrinsic = async (
    scheduleHash: `0x${string}`,
    sender: string,
    taskId: string,
    recipient: string,
    amount: BN,
    tokenAddress?: string,
    startTime?: BN,
    interval?: BN,
    executionTimes?: BN[]
  ) => {
    const params = [
      scheduleHash,
      taskId,
      recipient,
      amount,
      tokenAddress,
      startTime,
      interval,
      executionTimes,
    ];

    return getMessageExtrinsic(
      sender,
      TEMPORA_CONTRACT_ADDRESS,
      temporaContractMetadata,
      TEMPORA_CONTRACT_MESSAGES.SAVE_SCHEDULE,
      undefined,
      params
    );
  };

  /**
   * Constructs an extrinsic to trigger a payment.
   *
   * @param sender - The sender's address initiating the payment.
   * @param recipient - The recipient's address receiving the payment.
   * @param amount - The amount of the payment.
   * @param scheduleHash - The hash of the payment schedule.
   *
   * @returns A promise that resolves with the extrinsic to trigger the payment.
   */
  const getTriggerPaymentExtrinsic = async (
    sender: string,
    recipient: string,
    amount: BN,
    tokenAddress: string | undefined,
    scheduleHash: `0x${string}`
  ) => {
    const params = [recipient, amount, tokenAddress, scheduleHash];

    return getMessageExtrinsic(
      sender,
      TEMPORA_CONTRACT_ADDRESS,
      temporaContractMetadata,
      TEMPORA_CONTRACT_MESSAGES.TRIGGER_PAYMENT,
      amount,
      params
    );
  };

  /**
   * Returns the extrinsic for removing a scheduled payment.
   *
   * @param sender - The sender's address.
   * @param scheduleId - The ID of the task whose schedule is to be removed.
   * @returns A promise that resolves with the extrinsic for removing the schedule.
   */
  const getRemoveScheduleExtrinsic = async (
    sender: string,
    scheduleId: `0x${string}`
  ) => {
    return getMessageExtrinsic(
      sender,
      TEMPORA_CONTRACT_ADDRESS,
      temporaContractMetadata,
      TEMPORA_CONTRACT_MESSAGES.REMOVE_SCHEDULE,
      undefined,
      [scheduleId]
    );
  };

  /**
   * Constructs an extrinsic to update a schedule configuration.
   *
   * @param sender - The sender's address initiating the update.
   * @param scheduleConfiguration - The new schedule configuration to be updated.
   *
   * @returns A promise that resolves with the extrinsic to update the schedule.
   */
  const getUpdateScheduleExtrinsic = async (
    sender: string,
    scheduleConfiguration: ScheduleConfiguration
  ) => {
    return getMessageExtrinsic(
      sender,
      TEMPORA_CONTRACT_ADDRESS,
      temporaContractMetadata,
      TEMPORA_CONTRACT_MESSAGES.UPDATE_SCHEDULE,
      undefined,
      [
        {
          ...scheduleConfiguration,
          executionTimes: scheduleConfiguration.executionTimes?.map(
            (executionTime) => +executionTime.toString().replaceAll(',', '')
          ),
          startTime: scheduleConfiguration.startTime
            ? +scheduleConfiguration.startTime?.toString().replaceAll(',', '')
            : undefined,
        } as ScheduleConfiguration,
      ]
    );
  };

  const getIncreasePsp22AllowanceExtrinsic = async (
    sender: string,
    psp22ContractAddress: string,
    amount: BN
  ) => {
    const params = [TEMPORA_CONTRACT_ADDRESS, amount];

    return await getMessageExtrinsic(
      sender,
      psp22ContractAddress,
      psp22ContractMetadata,
      PSP22_CONTRACT_MESSAGES.INCREASE_ALLOWANCE,
      undefined,
      params
    );
  };

  return {
    getSaveScheduleExtrinsic,
    getTriggerPaymentExtrinsic,
    getRemoveScheduleExtrinsic,
    getUpdateScheduleExtrinsic,
    getIncreasePsp22AllowanceExtrinsic,
  };
};

export default useContract;
