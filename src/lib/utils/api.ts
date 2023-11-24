import { ApiPromise, WsProvider } from 'useink/core';

/**
 * Create an ApiPromise object with optional rpc, types and runtime.
 *
 * @returns An ApiPromise object
 */
const getApi = async (
  endpoint: string,
  // TODO Add types
  rpc?: Record<string, Record<string, any>>,
  types?: Record<string, any>,
  runtime?: Record<string, any>
): Promise<ApiPromise> => {
  return await ApiPromise.create({
    provider: new WsProvider(endpoint),
    rpc,
    types,
    runtime,
  });
};

export default getApi;
