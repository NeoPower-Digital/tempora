![img](./public/assets/Tempora.png)

✨ An opinionated and fully typed hook-based project to improve DX and simplify interaction with proxy accounts and XCM on [Polkadot](https://polkadot.network/).

🚀 Tempora is an example of how transactions can be automated by leveraging cross-chain communication.

## Run on local environment

Steps required to run the project locally:

### Chain nodes

1. [Install Zombienet](https://paritytech.github.io/zombienet/install.html).

> We recommend downloading the corresponding (`linux` or `mac`) executable file from the [Zombienet Github releases page](https://github.com/paritytech/zombienet/releases). 
Move the downloaded file to the [`zombienet`](./zombienet) folder, give it execute permissions, rename it to "zombienet" and that's it! ✅ 

2. Get the following chain runtimes with specific version:

- [polkadot - v0.9.43](https://github.com/paritytech/polkadot/tree/v0.9.43)
  - Install it globally with the following command: `cargo install --git https://github.com/paritytech/polkadot --tag v0.9.43 polkadot --locked`

- [OAK-blockchain - v2.1.4](https://github.com/OAK-Foundation/OAK-blockchain/tree/v2.1.4)
  - Clone the repository in the folder `zombienet/OAK-blockchain`.
  - Checkout the specific version: `git checkout tags/v2.1.4`
  - Build it using [this guide](https://github.com/OAK-Foundation/OAK-blockchain/tree/v2.1.4?tab=readme-ov-file#build-from-source).

- [Astar - v5.30.0](https://github.com/AstarNetwork/Astar/tree/v5.30.0)
  - Clone repository in the folder `zombienet/Astar`.
  - Checkout the specific version: `git checkout tags/v5.30.0`
  - Build it using [this guide](https://github.com/AstarNetwork/Astar/tree/v5.30.0?tab=readme-ov-file#building-from-source).

3. Execute Zombienet using the [turing-shibuya.toml](./zombienet/turing-shibuya.toml) configuration file on the [`zombienet`](./zombienet) path: `zombienet spawn turing-shibuya.toml`.

4. Deploy and instantiate the [Tempora contract](./contracts/tempora_contract/) on the Shibuya Dev chain and save the contract address for the `.env.local` file. 

5. Deploy and instantiate an OpenBrush PSP22 token ([Source code example](./contracts/psp22/openbrush-psp22.zip)) on the Shibuya Dev chain and save the contract address, token name and token decimals values for the `.env.local` file.

6. Whitelist the PSP22 token in the Tempora contract using the `add_token_to_whitelist` message. It receives a token contract address as a parameter. 
> The message should be called with the Tempora Admin account (the account that initialized the smart contract).

### DApp

1. Initially, it's required to install dependencies:

```sh
yarn install
```

2. Create a local environment file `.env.local` and add the following variables:

```sh
NEXT_PUBLIC_CHAIN_ENVIRONMENT=<CHAINS_ENVIRONMENT>
NEXT_PUBLIC_CONTRACT_ADDRESS=<TEMPORA_CONTRACT_ADDRESS>
NEXT_PUBLIC_PSP22_TOKEN_NAME=<PSP22_TOKEN_NAME>
NEXT_PUBLIC_PSP22_TOKEN_ADDRESS=<PSP22_TOKEN_CONTRACT_ADDRESS>
NEXT_PUBLIC_PSP22_TOKEN_DECIMALS=<PSP22_TOKEN_DECIMALS>
```

> The `NEXT_PUBLIC_CHAIN_ENVIRONMENT` variable can have the following values:
>
> - `dev` to use a local environment (_Shibuya Dev_ and _Turing Dev_)
> - `testing` to use Rococo (_Rocstar_ and _Turing Staging_)
> - `kusama` to use Kusama (_Shiden_ and _Turing Network_).

3. Then, you can run the following scripts:

| Command         | Description      |
| --------------- | ---------------- |
| `yarn dev`      | Run dev server   |
| `yarn build`    | Build project    |
| `yarn start`    | Run prod project |
| `yarn lint`     | Run lint scanner |
| `yarn prettier` | Prettify code    |
| `yarn test`     | Run tests        |

## Tech Stack

### Polkadot Libraries

- [Polkadot JS](https://polkadot.js.org/): Official Polkadot library and utilities
- [useink](https://use.ink/frontend/overview/): Abstractions library based on React hooks.

### UI Libraries

- 🌐 [Next.js](https://nextjs.org/): React framework.
- 🧩 [Radix UI](https://www.radix-ui.com/): Low-level UI component library.
- 🎨 [Tailwind CSS](https://tailwindcss.com/): Utility-first CSS framework.
- 🔄 [Recoil](https://recoiljs.org/): State management library.
- 📊 [react-query](https://react-query.tanstack.com/): Powerful asynchronous state management for TS/JS.
- 📝 [react-hook-form](https://react-hook-form.com/): Form handling library.
- ✅ [Zod](https://zod.dev/): TypeScript-first schema validation with static type inference.
- 🧪 [Vitest](https://vitest.dev/): Lightweight test runner.

## Folder structure

- `app`: Next.js pages
- `src`:
  - `src/components`: Business components
  - `src/core`: Generic UI components and common models
  - `src/lib`: Business logic -> Blockchain hooks, helpers, models, states, configurations, contracts metadata, etc.

## How to use (For Devs)

> If you are looking for a user guide: [click here](https://medium.com/@NeoPowerDigital/on-chain-payment-scheduling-in-polkadot-2ff15ed6485a)

To use this project as a starting point for your own DApp:

1. Install packages in your app

```sh
yarn add @oak-network/types @polkadot/keyring @polkadot/types @polkadot/util-crypto @polkadot/api @polkadot/util @polkadot/typegen recoil useink
```

2.  Setup Recoil, follow [Recoil Getting Started](https://recoiljs.org/docs/introduction/getting-started#recoilroot) for more information (you can use any other state management approach).

```ts
function App() {
  return (
    <RecoilRoot>
      <Application />
    </RecoilRoot>
  );
}
```

3. Copy and Paste `src/lib` folder in your application.

4. If you wish to use a different configuration for the origin/target chains you will need to replace constants in `lib/config/chainsConfig.ts`.

   > TIP: You can find all the configurable constants by searching `// CONFIGURABLE` in the code.

   ![](/public/assets/configurable-constant-example.png)

5. Include `TemporaProvider` as a provider in your application. This will setup all the necessary configurations along with **useink** Provider.

   ![](/public/assets/tempora-provider-example.png)

6. Now you can start using the hooks provided in the folder `lib/hooks`

### Hooks

#### [`useWallet()` 🔗️](/src/lib/hooks/useWallet.ts)

Hook to encapsulate the UI from the specific library implementation. It combines the functionality of **useink** `useWallet` and `useBalance`.

_Read account info:_

```ts
const { account, getBalance, useBalance } = useWallet();
```

_Manage connection:_

```ts
const { connect, disconnect } = useWallet();
```

#### [`useChainsConfig()` 🔗️](/src/lib/hooks/useChainsConfig.ts)

Configures globally the origin and target chains configuration, making it available in chainsConfigState atom state. Also gets the async properties needed

```ts
// This will set the chains config store internally
const originChain = useChainsConfig();
```

#### [`useProxyAccounts()` 🔗️](/src/lib/hooks/useProxyAccounts.ts)

Hook for managing proxy accounts and related operations.

##### calculateProxies()

```ts
const { calculateProxies } = useProxyAccounts();

useEffect(() => {
  if (!account || !apisReady) return;

  calculateProxies();
}, [account, apisReady]);
```

##### proxiesExist()

```ts
const { proxiesExist } = useProxyAccounts();
const { data: proxiesExistData, isLoading: proxiesExistsIsLoading } = useQuery({
  queryKey: ['proxiesExist', originProxyAddress, targetProxyAddress],
  queryFn: proxiesExist,
  enabled: apisReady && proxiesCalculated,
});
```

##### getProxiesBalances()

```ts
const { getProxiesBalances } = useProxyAccounts();

useEffect(() => {
  if (proxiesExist) getProxiesBalances();
}, [proxiesExist]);
```

##### createAccounts()

```ts
// Using react-query

const { createAccounts } = useProxyAccounts();

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
```

##### calculateTotalTopUpBalances()

```ts
const { calculateTotalTopUpBalances } = useProxyAccounts();

const { originTopUpBalance, targetTopUpBalance } = calculateTotalTopUpBalances(
  originTotalFeeEstimation,
  targetTotalFeeEstimation
);
```

##### getTopUpProxyAccountsExtrinsics()

```ts
const { getTopUpProxyAccountsExtrinsics, calculateTotalTopUpBalances } =
  useProxyAccounts();

const { originTopUpBalance, targetTopUpBalance } = calculateTotalTopUpBalances(
  originTotalFeeEstimation,
  targetTotalFeeEstimation
);

const topUpProxyAccountExtrinsics = getTopUpProxyAccountsExtrinsics(
  originTopUpBalance,
  targetTopUpBalance
);

return await signAndSendPromise(
  batchTransactions(api, [...topUpProxyAccountExtrinsics]),
  account
);
```

#### [`useFeeEstimation()` 🔗️](/src/lib/hooks/useFeeEstimation.ts)

Hook for estimating the fees of the origin and target extrinsics including XCM operations.

##### getOriginExtrinsicFeeEstimation()

```ts
const { getOriginExtrinsicFeeEstimation } = useFeeEstimation();

const originFeeEstimation =
  await getOriginExtrinsicFeeEstimation(originExtrinsic);
```

##### getTargetExtrinsicFeeEstimation()

```ts
const { getTargetExtrinsicFeeEstimation } = useFeeEstimation();

const targetFeeEstimation =
  await getTargetExtrinsicFeeEstimation(targetExtrinsic);
```

#### [`useSchedulePayment()` 🔗️](/src/lib/hooks/useSchedulePayment.ts)

Hook to generate extrinsics, trigger fee estimation calculation and schedule a payment from the origin chain to the target chain through XCM.

##### generateExtrinsicsAndEstimate()

```ts
// Using react-query

const { generateExtrinsicsAndEstimate } = useSchedulePayment();

const { data: newPaymentSummary, isLoading } = useQuery({
  queryKey: ['createPaymentSummary'],
  queryFn: () => generateExtrinsicsAndEstimate(newPaymentConfiguration),
});
```

##### createAndSaveScheduledPayment()

```ts
// Using react query

const { createAndSaveScheduledPayment } = useSchedulePayment();

const { mutate, isPending, isSuccess } = useMutation({
  mutationFn: (newPaymentSummary: NewPaymentSummary) => {
    const {
      targetFeeEstimation,
      taskScheduleExtrinsic,
      getActionsOnTaskScheduled,
    } = newPaymentSummary;

    return createAndSaveScheduledPayment(
      targetFeeEstimation,
      taskScheduleExtrinsic,
      getActionsOnTaskScheduled
    );
  },
});
```

##### deleteSchedulePayment()

```ts
// Using react query

const {
  mutate: deleteScheduledPaymentMutation,
  isPending: isDeletingScheduledPayment,
} = useMutation({
  mutationFn: async () => {
    return await deleteScheduledPayment(temporaScheduleId, oakTaskId);
  },
});
```

### [Oak.js Helper Functions 🔗️](/src/lib/helpers/oak.helper.ts)

This file contains helper functions for interacting with the Oak.js API.

- `scheduleXcmpTaskThroughProxy()`: Schedules an XCMP task through a proxy using the automationTime module in the provided API.
- `cancelTaskWithScheduleAs()`: Cancels a task with a schedule as a given account using the automationTime module in the provided API.

### [PolkadotJS Helper Functions 🔗️](/src/lib/helpers/polkadotjs.helper.ts)

This file contains helper functions for interacting with the PolkadotJS API.

- `transfer()`: Creates a transaction to transfer a specified amount to a given address.
- `crossChainTransfer()`: Creates a cross-chain transaction to transfer a specified asset to a given address.
- `signAndSendPromise()`: Signs and sends a transaction using a given account's address and signer.
- `batchTransactions()`: Batches multiple transactions together.
- `xcmLocationToAssetIdNumber()`: Converts a XCM location to an asset ID number.
- `getFormattedBalance()`: Formats the given balance into a human-readable string with the associated chain token.
- `getFormattedTokenAmount()`: Formats the given amount into a human-readable string with the associated chain token.
- `getTokenSymbol()`: Retrieves the chain token symbol from the provided API.
- `getTokenBalanceOfAccount()`: Gets the balance of a specific token for a given account.
- `getDefaultAssetBalance()`: Queries the balance of the default asset for a given address.
- `getExtrinsicWeight()`: Retrieves the extrinsic weight for a given SubmittableExtrinsic using the paymentInfo function.
- `getAssetMetadata()`: Retrieves the asset metadata for a specified asset ID using the assetRegistry query.
- `extrinsicViaProxy()`: Creates an extrinsic to be executed via a proxy.
- `queryWeightToFee()`: Queries the weight-to-fee conversion for a given weight using the transactionPaymentApi.
- `sendXcm()`: Sends an XCM message to a specified destination using the polkadotXcm module.

### [Smart Contracts Helper Functions 🔗️](/src/lib/helpers/polkadotjs.contracts.helper.ts)

This file contains helper functions for interacting with smart contracts using the PolkadotJS API.

- `getContractApi()`: Retrieves the contract API for a given contract address and metadata using the provided API.
- `queryContract()`: Executes a given message dry-run for a given contract address using a contract API.
- `getExecuteContractExtrinsic()`: Generates an extrinsic to execute a given message for a given contract address using a contract API.

### [Proxy Accounts Helper Functions 🔗️](/src/lib/helpers/proxyAccounts.helper.ts)

This file contains helper functions for managing proxy accounts.

- `calculateProxyAccounts()`: Calculates proxy accounts for a given origin and target chain.
- `validateProxyAccount()`: Validates a proxy account against a given address on the parachain.
- `createProxyAccount()`: Creates a proxy account with the specified permissions for a given account using the provided API.
- `getDerivativeAccount()`: Generates a derivative account address for a given account and destination parachain using XCM V3.
- `getCrossChainTransferParameters()`: Generates cross-chain transfer parameters for a given amount, decoded account address, and target parachain ID.

### [XCM Builder 🔗️](/src/lib/helpers/xcm.builder.ts)

This file contains the functions of the helper class for building a XCM message.

- `build()`: Builds the XCM message.
- `addWithdrawAsset()`: Adds an Asset to the WithdrawAsset instruction of the XCM message.
- `addBuyExecution()`: Adds a BuyExecution instruction to the XCM message.
- `addTransact()`: Adds a Transact instruction to the XCM message.
- `addRefundSurplus()`: Adds a RefundSurplus instruction to the XCM message.
- `addDepositAsset()`: Adds a DepositAsset instruction to the XCM message.

## Unit tests

### [UI 🔗️](/__tests__)

Our unit tests cover the main hooks functionality.

Run on the root path: `yarn test`

![](/public/assets/ui-unit-tests.png)

### [Smart Contract 🔗️](/contracts/tempora_contract/lib.rs)

Our tests cover the main messages functionality.

Run on the `/contracts/tempora_contract` folder: `cargo test`

![](/public/assets/smart-contract-tests.png)

## Deploy example on Vercel

The easiest way to deploy this Next.js app is to use the [Vercel Platform](https://vercel.com/new).

Check out the [Next.js deployment documentation](https://nextjs.org/docs/deployment) for more details.
