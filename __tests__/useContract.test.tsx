import useContract from '@/lib/hooks/useContract';
import { ScheduleConfiguration } from '@/lib/models/schedule-configuration.model';
import { BN } from '@polkadot/util';
import { renderHook } from '@testing-library/react';
import { RecoilRoot } from 'recoil';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { polkadotjsContractsHelperMocks } from './mocks/polkadotjsContractsHelper.mock';
import { chainDefaultValue } from './providers/recoilProvider.mock';

vi.mock('@/lib/helpers/polkadotjs.contracts.helper');

const { queryContractMock, getExecuteContractExtrinsicMock } =
  polkadotjsContractsHelperMocks();

const scheduleConfigurationMock: ScheduleConfiguration = {
  id: '0x',
  amount: '1',
  enabled: true,
  recipient: '',
  sender: '',
  taskId: '',
  tokenAddress: '',
  executionTimes: [],
};

describe('useContract', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should get saveSchedule extrinsic, when called with correct parameters', async () => {
    // Arrange
    const { result } = renderHook(() => useContract(chainDefaultValue), {
      wrapper: RecoilRoot,
    });

    // Act
    const received = await result.current.getSaveScheduleExtrinsic(
      scheduleConfigurationMock.id,
      scheduleConfigurationMock.sender,
      scheduleConfigurationMock.taskId,
      scheduleConfigurationMock.recipient,
      new BN(scheduleConfigurationMock.amount),
      scheduleConfigurationMock.tokenAddress
    );

    // Assert
    expect(received).toBeTruthy();
    expect(getExecuteContractExtrinsicMock).toHaveBeenCalledTimes(1);
    expect(queryContractMock).toHaveBeenCalledTimes(1);
  });

  it('should get triggerPayment extrinsic, when called with correct parameters', async () => {
    // Arrange
    const { result } = renderHook(() => useContract(chainDefaultValue), {
      wrapper: RecoilRoot,
    });

    // Act
    const received = await result.current.getTriggerPaymentExtrinsic(
      scheduleConfigurationMock.sender,
      scheduleConfigurationMock.recipient,
      new BN(scheduleConfigurationMock.amount),
      scheduleConfigurationMock.tokenAddress,
      scheduleConfigurationMock.id
    );

    // Assert
    expect(received).toBeTruthy();
    expect(getExecuteContractExtrinsicMock).toHaveBeenCalledTimes(1);
    expect(queryContractMock).toHaveBeenCalledTimes(1);
  });

  it('should get removeSchedule extrinsic, when called with correct parameters', async () => {
    // Arrange
    const { result } = renderHook(() => useContract(chainDefaultValue), {
      wrapper: RecoilRoot,
    });

    // Act
    const received = await result.current.getRemoveScheduleExtrinsic(
      scheduleConfigurationMock.sender,
      scheduleConfigurationMock.id
    );

    // Assert
    expect(received).toBeTruthy();
    expect(getExecuteContractExtrinsicMock).toHaveBeenCalledTimes(1);
    expect(queryContractMock).toHaveBeenCalledTimes(1);
  });

  it('should get updateSchedule extrinsic, when called with correct parameters', async () => {
    // Arrange
    const { result } = renderHook(() => useContract(chainDefaultValue), {
      wrapper: RecoilRoot,
    });

    // Act
    const received = await result.current.getUpdateScheduleExtrinsic(
      scheduleConfigurationMock.sender,
      scheduleConfigurationMock
    );

    // Assert
    expect(received).toBeTruthy();
    expect(getExecuteContractExtrinsicMock).toHaveBeenCalledTimes(1);
    expect(queryContractMock).toHaveBeenCalledTimes(1);
  });

  it('should get increasePSP22Allowance extrinsic, when called with correct parameters', async () => {
    // Arrange
    const { result } = renderHook(() => useContract(chainDefaultValue), {
      wrapper: RecoilRoot,
    });

    // Act
    const received = await result.current.getIncreasePsp22AllowanceExtrinsic(
      scheduleConfigurationMock.sender,
      '',
      new BN(scheduleConfigurationMock.amount)
    );

    // Assert
    expect(received).toBeTruthy();
    expect(getExecuteContractExtrinsicMock).toHaveBeenCalledTimes(1);
    expect(queryContractMock).toHaveBeenCalledTimes(1);
  });
});
