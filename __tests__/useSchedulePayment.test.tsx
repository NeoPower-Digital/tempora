/* eslint-disable no-unused-vars */
import { XcmBuilder } from '@/lib/helpers/xcm.builder';
import { FeeEstimation } from '@/lib/hooks/useFeeEstimation';
import useSchedulePayment from '@/lib/hooks/useSchedulePayment';
import {
  OakSchedulePaymentConfiguration,
  SchedulePaymentType,
} from '@/lib/models/schedule-payment.model';
import Weight from '@/lib/models/weight.model';
import { BN } from '@polkadot/util';
import { renderHook } from '@testing-library/react';
import { RecoilRoot } from 'recoil';
import { describe, expect, it, vi } from 'vitest';
import { NewPaymentSummary } from '../app/new-recurring-payment/page';
import { oakHelperMocks } from './mocks/oakHelper.mock';
import { polkadotjsHelperMocks } from './mocks/polkadotjsHelper.mock';
import { createUseFeeEstimationMocks } from './mocks/useFeeEstimation.mock';
import { createUseProxyAccountMocks } from './mocks/useProxyAccounts.mock';
import { createUseWalletMocks } from './mocks/useWallet.mock';

vi.mock('@/lib/helpers/oak.helper');
vi.mock('@/lib/helpers/polkadotjs.helper');

vi.mock('@/lib/hooks/useWallet');
vi.mock('@/lib/hooks/useProxyAccounts');
vi.mock('@/lib/hooks/useFeeEstimation');

const { mockScheduleXcmpTaskThroughProxy } = oakHelperMocks();
const {
  mockTransfer,
  mockExtrinsicViaProxy,
  mockSignAndSendPromise,
  mockSendXcm,
} = polkadotjsHelperMocks();

createUseWalletMocks();
const { mockCalculateTotalTopUpBalances, mockTopUpProxyAccounts } =
  createUseProxyAccountMocks();
const {
  mockGetOriginExtrinsicFeeEstimation,
  mockGetTargetExtrinsicFeeEstimation,
} = createUseFeeEstimationMocks();

const defaultSchedulePaymentConfiguration: OakSchedulePaymentConfiguration = {
  amountByTx: 1,
  executionDates: [{ date: new Date() }],
  recipient: '0x1000',
  schedule: { Fixed: { executionTimes: [0] } },
  type: SchedulePaymentType.Fixed,
};

const defaultFeeEstimation: FeeEstimation = {
  extrinsicWeight: new Weight(new BN(1), new BN(1)),
  totalXcmExtrinsicWeight: new Weight(new BN(1), new BN(1)),
  totalXcmExtrinsicFee: new BN(1),
};

const defaultCreateScheduledPaymentParams: NewPaymentSummary = {
  targetFeeEstimation: defaultFeeEstimation,
  originFeeEstimation: defaultFeeEstimation,
  taskScheduleExtrinsic: undefined,
  originTopUpBalance: new BN(1),
  targetTopUpBalance: new BN(1),
  iterationsToCoverFeeOnOrigin: 1,
};

describe('useSchedulePayment', async () => {
  it('should generate extrinsics and estimate fees for a new payment, when called with valid configuration', async () => {
    // Arrange
    const { result } = renderHook(() => useSchedulePayment(), {
      wrapper: RecoilRoot,
    });

    // Act
    await result.current.generateExtrinsicsAndEstimate(
      defaultSchedulePaymentConfiguration
    );

    // Assert
    expect(mockTransfer).toHaveBeenCalledOnce();
    expect(mockExtrinsicViaProxy).toHaveBeenCalledOnce();
    expect(mockGetOriginExtrinsicFeeEstimation).toHaveBeenCalledOnce();
    expect(mockScheduleXcmpTaskThroughProxy).toHaveBeenCalledOnce();
    expect(mockGetTargetExtrinsicFeeEstimation).toHaveBeenCalledOnce();
    expect(mockCalculateTotalTopUpBalances).toHaveBeenCalledOnce();
  });

  it('should create a scheduled payment, when called with valid parameters', async () => {
    // Arrange
    const { result } = renderHook(() => useSchedulePayment(), {
      wrapper: RecoilRoot,
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
    await result.current.createScheduledPayment(
      defaultCreateScheduledPaymentParams
    );

    // Assert
    expect(mockTopUpProxyAccounts).toHaveBeenCalledOnce();
    expect(mockBuild).toHaveBeenCalledOnce();
    expect(mockSendXcm).toHaveBeenCalledOnce();
    expect(mockSignAndSendPromise).toHaveBeenCalledOnce();
  });
});
