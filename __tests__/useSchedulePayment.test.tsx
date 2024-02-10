/* eslint-disable no-unused-vars */
import { XcmBuilder } from '@/lib/helpers/xcm.builder';
import { FeeEstimation } from '@/lib/hooks/useFeeEstimation';
import useSchedulePayment from '@/lib/hooks/useSchedulePayment';
import { PaymentToken } from '@/lib/models/payment-token.model';
import {
  OakSchedulePaymentConfiguration,
  SchedulePaymentType,
} from '@/lib/models/schedule-payment.model';
import Weight from '@/lib/models/weight.model';
import { BN } from '@polkadot/util';
import { renderHook } from '@testing-library/react';
import { RecoilRoot } from 'recoil';
import { ISubmittableResult, SubmittableExtrinsic, VoidFn } from 'useink/core';
import { describe, expect, it, vi } from 'vitest';
import { oakHelperMocks } from './mocks/oakHelper.mock';
import { polkadotjsHelperMocks } from './mocks/polkadotjsHelper.mock';
import { createUseContractMocks } from './mocks/useContract.mock';
import { createUseFeeEstimationMocks } from './mocks/useFeeEstimation.mock';
import { createUseProxyAccountMocks } from './mocks/useProxyAccounts.mock';
import { createUseWalletMocks } from './mocks/useWallet.mock';
import getRecoilProvider, {
  chainDefaultValue,
} from './providers/recoilProvider.mock';

vi.mock('@/lib/helpers/oak.helper');
vi.mock('@/lib/helpers/polkadotjs.helper');

vi.mock('@/lib/hooks/useWallet');
vi.mock('@/lib/hooks/useProxyAccounts');
vi.mock('@/lib/hooks/useFeeEstimation');
vi.mock('@/lib/hooks/useContract');

const { mockScheduleXcmpTaskThroughProxy } = oakHelperMocks();
const { mockExtrinsicViaProxy, mockSignAndSendPromise, mockSendXcm } =
  polkadotjsHelperMocks();

createUseWalletMocks();
const { mockCalculateTotalTopUpBalances, mockGetTopUpProxyAccountsExtrinsics } =
  createUseProxyAccountMocks();
const {
  mockGetOriginExtrinsicFeeEstimation,
  mockGetTargetExtrinsicFeeEstimation,
} = createUseFeeEstimationMocks();
const { mockGetSaveScheduleExtrinsic, mockGetTriggerPaymentExtrinsic } =
  createUseContractMocks();

const defaultSchedulePaymentConfiguration = new OakSchedulePaymentConfiguration(
  {
    amountByTx: 1,
    recipient: '0x1000',
    type: SchedulePaymentType.Fixed,
    executionDates: [{ date: new Date() }],
    tokenAddress: '',
  },
  { address: '', decimals: 1, isNative: true, name: '' } as PaymentToken
);

const defaultGetApiFn = () => ({
  query: {
    system: {
      events: (callback: (events: any) => {}) => {
        callback([
          {
            event: {
              method: 'TaskScheduled',
              data: {
                scheduleAs: '',
                taskId: '',
              },
            },
          },
        ]);

        return new Promise<VoidFn>((resolve) => resolve(() => {}));
      },
    },
  },
});

// TODO: Move these constants to be reused in other tests
const defaultBN = new BN(1);

const defaultWeight = new Weight(defaultBN, defaultBN);

const defaultFeeEstimation: FeeEstimation = {
  extrinsicWeight: defaultWeight,
  totalXcmExtrinsicWeight: defaultWeight,
  totalXcmExtrinsicFee: new BN(1),
};

const defaultExtrinsic = {} as SubmittableExtrinsic<
  'promise',
  ISubmittableResult
>;

describe('useSchedulePayment', async () => {
  // TODO: Improve this test. Add more detailed assertions.
  it('should generate extrinsics and estimate fees for a new payment, when called with valid configuration', async () => {
    // Arrange
    const { result } = renderHook(() => useSchedulePayment(), {
      wrapper: RecoilRoot,
    });

    // Act
    const testResult = await result.current.generateExtrinsicsAndEstimate(
      defaultSchedulePaymentConfiguration
    );

    // Assert
    expect(mockGetSaveScheduleExtrinsic).toHaveBeenCalledOnce();
    expect(mockGetTriggerPaymentExtrinsic).toHaveBeenCalledOnce();
    expect(mockExtrinsicViaProxy).toHaveBeenCalledOnce();
    expect(mockGetOriginExtrinsicFeeEstimation).toHaveBeenCalledTimes(2);
    expect(mockScheduleXcmpTaskThroughProxy).toHaveBeenCalledOnce();
    expect(mockGetTargetExtrinsicFeeEstimation).toHaveBeenCalledOnce();
    expect(mockCalculateTotalTopUpBalances).toHaveBeenCalledOnce();
    expect(testResult).toBeTruthy();
  });

  it('should create and save scheduled payment, when called with valid parameters', async () => {
    // Arrange
    const { result } = renderHook(() => useSchedulePayment(), {
      wrapper: getRecoilProvider(undefined, {
        originConfig: chainDefaultValue,
        targetConfig: {
          ...chainDefaultValue,
          getApi: defaultGetApiFn as any,
        },
      }),
    });

    const mockAddWithdrawAsset = vi
      .spyOn(XcmBuilder.prototype, 'addWithdrawAsset')
      .mockReturnValue(new XcmBuilder());
    const mockAddBuyExecution = vi
      .spyOn(XcmBuilder.prototype, 'addBuyExecution')
      .mockReturnValue(new XcmBuilder());
    const mockAddTransact = vi
      .spyOn(XcmBuilder.prototype, 'addTransact')
      .mockReturnValue(new XcmBuilder());
    const mockAddRefundSurplus = vi
      .spyOn(XcmBuilder.prototype, 'addRefundSurplus')
      .mockReturnValue(new XcmBuilder());
    const mockAddDepositAsset = vi
      .spyOn(XcmBuilder.prototype, 'addDepositAsset')
      .mockReturnValue(new XcmBuilder());
    const mockBuild = vi
      .spyOn(XcmBuilder.prototype, 'build')
      .mockReturnValue(new XcmBuilder());

    // Act
    await result.current.createAndSaveScheduledPayment(
      defaultFeeEstimation,
      defaultExtrinsic,
      () =>
        new Promise((resolve) =>
          resolve([{}] as SubmittableExtrinsic<'promise', ISubmittableResult>[])
        )
    );

    // Assert
    expect(mockBuild).toHaveBeenCalledOnce();
    expect(mockSendXcm).toHaveBeenCalledOnce();
    expect(mockSignAndSendPromise).toHaveBeenCalledTimes(2);
  });

  // TODO: Add test for saveScheduleAndTopUpAccounts.
  it('should save a schedule and top up accounts, when called with valid parameters', async () => {
    // Arrange
    const { result } = renderHook(() => useSchedulePayment(), {
      wrapper: RecoilRoot,
    });

    // Act
    const testResult = await result.current.topUpAccounts(defaultBN, defaultBN);

    // Assert
    expect(mockGetTopUpProxyAccountsExtrinsics).toHaveBeenCalledOnce();
    expect(mockSignAndSendPromise).toHaveBeenCalled();
    expect(testResult).toBeTruthy();
  });
});
