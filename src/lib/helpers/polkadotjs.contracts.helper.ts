import { Abi, ContractPromise } from '@polkadot/api-contract';
import { BN } from '@polkadot/util';
import {
  ApiPromise,
  ContractExecResult,
  ISubmittableResult,
  SubmittableExtrinsic,
  Weight,
} from 'useink/core';

/**
 * Returns a ContractPromise instance to interact with the Tempora contract.
 *
 * @requires
 * - *Origin* apis setted in 'chainsConfig' atom state
 * - Contract metadata loaded from the contract build
 * - Contract address setted as environment variable
 *
 * @returns A ContractPromise instance to interact with the Tempora contract.
 */
export const getContractApi = (
  api: ApiPromise,
  contractMetadata: string | Record<string, unknown> | Abi,
  contractAddress: string
) => new ContractPromise(api, contractMetadata, contractAddress);

export const queryContract = async (
  api: ApiPromise,
  contractAddress: string,
  contractMetadata: string | Record<string, unknown> | Abi,
  sender: string,
  messageToQuery: string,
  valueToTransfer?: BN,
  params?: any[]
): Promise<ContractExecResult> => {
  if (!api) return new Promise((_, reject) => reject('API not available'));

  const contractApi = getContractApi(api, contractMetadata, contractAddress);

  const message = contractApi.abi.messages.find(
    (m) => m.method === messageToQuery
  );

  if (!message)
    return new Promise((_, reject) =>
      reject(`Message ${messageToQuery} not found in contract`)
    );

  return await contractApi!.api.call.contractsApi.call(
    sender,
    contractAddress,
    valueToTransfer ?? new BN(0),
    null,
    null,
    message.toU8a(params ?? [])
  );
};

/**
 * Constructs an extrinsic to execute a contract message.
 *
 * @param api - The initialized API instance.
 * @param contractApi - The initialized contract API instance.
 * @param messageToExecute - The name of the message to execute in the contract's ABI.
 * @param gasLimit - The maximum amount of gas the transaction is allowed to use.
 * @param valueToTransfer - The value to transfer with the execution (optional, defaults to 0).
 * @param params - The parameters to include in the execution (optional).
 *
 * @returns The extrinsic to execute the contract message.
 */
export const getExecuteContractExtrinsic = (
  api: ApiPromise,
  contractAddress: string,
  contractMetadata: string | Record<string, unknown> | Abi,
  messageToExecute: string,
  gasLimit: Weight,
  valueToTransfer: BN = new BN(0),
  params?: any[]
): SubmittableExtrinsic<'promise', ISubmittableResult> => {
  params = params ?? [];

  const contractApi = getContractApi(api, contractMetadata, contractAddress);

  const message = contractApi.abi.messages.find(
    (message) => message.method === messageToExecute
  );

  return api.tx.contracts.call(
    contractAddress,
    valueToTransfer,
    gasLimit,
    null,
    message!.toU8a(params)
  );
};
