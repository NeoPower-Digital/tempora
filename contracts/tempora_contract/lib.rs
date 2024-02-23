#![cfg_attr(not(feature = "std"), no_std, no_main)]

#[ink::contract]
mod tempora_contract {
    use ink::prelude::string::String;
    use ink::prelude::vec::Vec;
    use ink::storage::Mapping;

    use openbrush::contracts::traits::psp22::PSP22Ref;

    #[derive(Debug, scale::Decode, scale::Encode, PartialEq)]
    #[cfg_attr(
        feature = "std",
        derive(scale_info::TypeInfo, ink::storage::traits::StorageLayout)
    )]
    pub enum TemporaError {
        ScheduleConfigurationAlreadyExists,
        CallerCannotBeRecipient,
        ScheduleAmountCannotBeZero,
        WrongScheduleConfiguration,
        ScheduleConfigurationNotFound,
        UserScheduleConfigurationNotFound,
        ScheduleConfigurationDisabled,
        InsufficientBalance,
        TransferError,
        IncorrectExecutionTime,
        TokenIsAlreadyWhiteslited,
        TokenIsNotWhitelisted,
        Unauthorized,
    }

    #[derive(scale::Decode, scale::Encode, Clone)]
    #[cfg_attr(
        feature = "std",
        derive(scale_info::TypeInfo, ink::storage::traits::StorageLayout)
    )]
    pub struct ScheduleConfiguration {
        pub id: Hash,
        pub task_id: String,
        pub sender: AccountId,
        pub recipient: AccountId,
        pub amount: Balance,
        pub token_address: Option<AccountId>,
        pub start_time: Option<Timestamp>,
        pub interval: Option<u64>,
        pub execution_times: Option<Vec<Timestamp>>,
        pub enabled: bool,
    }

    #[derive(scale::Decode, scale::Encode, Clone)]
    #[cfg_attr(
        feature = "std",
        derive(scale_info::TypeInfo, ink::storage::traits::StorageLayout)
    )]
    pub struct UserScheduleData {
        pub schedule_configuration: ScheduleConfiguration,
        pub payment_executions: Vec<Timestamp>,
    }

    #[ink(storage)]
    pub struct TemporaContract {
        pub admin: AccountId,
        pub schedules: Mapping<Hash, ScheduleConfiguration>,
        pub user_schedules: Mapping<AccountId, Vec<Hash>>,
        pub payment_executions: Mapping<Hash, Vec<Timestamp>>,
        pub tokens_whitelist: Vec<AccountId>,
    }

    impl TemporaContract {
        #[ink(constructor)]
        pub fn new() -> Self {
            let caller = Self::env().caller();

            Self {
                admin: caller,
                schedules: Mapping::default(),
                user_schedules: Mapping::default(),
                payment_executions: Mapping::default(),
                tokens_whitelist: Vec::new(),
            }
        }

        #[ink(message)]
        pub fn set_admin(&mut self, new_admin: AccountId) -> Result<(), TemporaError> {
            self.ensure_admin()?;

            self.admin = new_admin;

            Ok(())
        }

        #[ink(message)]
        pub fn add_token_to_whitelist(
            &mut self,
            token_address: AccountId,
        ) -> Result<(), TemporaError> {
            self.ensure_admin()?;

            if self.token_is_whitelisted(token_address) {
                return Err(TemporaError::TokenIsAlreadyWhiteslited);
            }

            self.tokens_whitelist.push(token_address);

            Ok(())
        }

        #[ink(message)]
        pub fn remove_token_from_whitelist(
            &mut self,
            token_address: AccountId,
        ) -> Result<(), TemporaError> {
            self.ensure_admin()?;

            self.validate_token_is_whitelisted(token_address)?;

            let index = self
                .tokens_whitelist
                .iter()
                .position(|token| *token == token_address)
                .unwrap();

            self.tokens_whitelist.remove(index);

            Ok(())
        }

        #[ink(message)]
        pub fn get_whitelisted_tokens(&self) -> Vec<AccountId> {
            self.tokens_whitelist.clone()
        }

        #[ink(message)]
        pub fn save_schedule(
            &mut self,
            id: Hash,
            task_id: String,
            recipient: AccountId,
            amount: Balance,
            token_address: Option<AccountId>,
            start_time: Option<u64>,
            interval: Option<u64>,
            execution_times: Option<Vec<u64>>,
        ) -> Result<(), TemporaError> {
            let caller = self.env().caller();

            self.validate_schedule(
                &id,
                caller,
                recipient,
                amount,
                token_address,
                start_time,
                execution_times.clone(),
                true,
            )?;

            let new_schedule = ScheduleConfiguration {
                id: id,
                task_id: String::from(&task_id),
                sender: caller,
                recipient,
                amount,
                token_address,
                start_time,
                interval,
                execution_times,
                enabled: true,
            };

            self.schedules.insert(id, &new_schedule);

            self.update_user_schedules(caller, &id);

            self.update_user_schedules(recipient, &id);

            Ok(())
        }

        #[ink(message)]
        pub fn remove_schedule(&mut self, schedule_id: Hash) -> Result<(), TemporaError> {
            let caller = self.env().caller();

            self.validate_user_schedule_exists(caller, &schedule_id)?;

            let mut schedule = self.get_schedule_by_id(&schedule_id)?;

            schedule.enabled = false;

            self.schedules.insert(schedule_id, &schedule);

            Ok(())
        }

        #[ink(message)]
        pub fn update_schedule(
            &mut self,
            schedule_configuration: ScheduleConfiguration,
        ) -> Result<(), TemporaError> {
            let caller = self.env().caller();

            self.validate_user_schedule_exists(caller, &schedule_configuration.id)?;

            self.validate_schedule(
                &schedule_configuration.id,
                caller,
                schedule_configuration.recipient,
                schedule_configuration.amount,
                schedule_configuration.token_address,
                schedule_configuration.start_time,
                schedule_configuration.execution_times.clone(),
                false,
            )?;

            // If recipient could be edited, we should also modify user_schedules mapping
            self.schedules
                .insert(schedule_configuration.id, &schedule_configuration);

            Ok(())
        }

        #[ink(message)]
        pub fn get_user_schedules(&self) -> Vec<UserScheduleData> {
            let caller = self.env().caller();
            let mut user_schedules = Vec::<UserScheduleData>::new();

            match self.user_schedules.get(&caller) {
                Some(schedule_ids) => {
                    for schedule_id in schedule_ids {
                        let schedule_configuration = self.schedules.get(&schedule_id).unwrap();
                        let payment_executions = self
                            .payment_executions
                            .get(&schedule_id)
                            .unwrap_or(Vec::new());

                        user_schedules.push(UserScheduleData {
                            schedule_configuration,
                            payment_executions,
                        });
                    }
                }
                None => {}
            }

            user_schedules
        }

        #[ink(message, payable)]
        pub fn trigger_payment(
            &mut self,
            recipient: AccountId,
            amount: Balance,
            token_address: Option<AccountId>,
            schedule_id: Hash,
        ) -> Result<(), TemporaError> {
            self.validate_trigger_payment(recipient, amount)?;

            if token_address.is_some() {
                self.trigger_psp22_payment(recipient, amount, token_address.unwrap())?;
            } else {
                self.trigger_native_payment(recipient, amount, self.env().transferred_value())?;
            }

            self.update_schedule_execution_time(&schedule_id);

            Ok(())
        }

        pub fn trigger_native_payment(
            &mut self,
            recipient: AccountId,
            amount: Balance,
            transferred_amount: Balance,
        ) -> Result<(), TemporaError> {
            if amount != transferred_amount {
                return Err(TemporaError::InsufficientBalance);
            }

            if self.env().transfer(recipient, amount).is_err() {
                return Err(TemporaError::TransferError);
            }

            // TODO: Emit Native transfer event

            Ok(())
        }

        pub fn trigger_psp22_payment(
            &mut self,
            recipient: AccountId,
            amount: Balance,
            token_address: AccountId,
        ) -> Result<(), TemporaError> {
            self.validate_token_is_whitelisted(token_address)?;

            let caller = self.env().caller();

            if PSP22Ref::transfer_from(&token_address, caller, recipient, amount, Vec::new())
                .is_err()
            {
                return Err(TemporaError::TransferError);
            }

            // TODO: Emit PSP22 transfer event

            Ok(())
        }

        fn validate_schedule(
            &self,
            schedule_id: &Hash,
            caller: AccountId,
            recipient: AccountId,
            amount: Balance,
            token_address: Option<AccountId>,
            start_time: Option<u64>,
            execution_times: Option<Vec<u64>>,
            is_new: bool,
        ) -> Result<(), TemporaError> {
            if is_new && self.schedules.contains(&schedule_id) {
                return Err(TemporaError::ScheduleConfigurationAlreadyExists);
            }

            if caller == recipient {
                return Err(TemporaError::CallerCannotBeRecipient);
            }

            if amount == 0 {
                return Err(TemporaError::ScheduleAmountCannotBeZero);
            }

            if token_address.is_some() {
                self.validate_token_is_whitelisted(token_address.unwrap())?;
            }

            if start_time.is_none() && execution_times.is_none() {
                return Err(TemporaError::WrongScheduleConfiguration);
            }

            Ok(())
        }

        fn validate_trigger_payment(
            &self,
            recipient: AccountId,
            amount: Balance,
        ) -> Result<(), TemporaError> {
            let caller = self.env().caller();

            if recipient == caller {
                return Err(TemporaError::CallerCannotBeRecipient);
            }

            if amount == 0 {
                return Err(TemporaError::ScheduleAmountCannotBeZero);
            }

            Ok(())
        }

        fn token_is_whitelisted(&self, token_address: AccountId) -> bool {
            self.tokens_whitelist.contains(&token_address)
        }

        fn validate_token_is_whitelisted(
            &self,
            token_address: AccountId,
        ) -> Result<(), TemporaError> {
            if !self.token_is_whitelisted(token_address) {
                return Err(TemporaError::TokenIsNotWhitelisted);
            }

            Ok(())
        }

        fn validate_user_schedule_exists(
            &self,
            caller: AccountId,
            schedule_id: &Hash,
        ) -> Result<(), TemporaError> {
            match self.schedules.get(&schedule_id) {
                Some(schedule) => {
                    if schedule.sender != caller {
                        return Err(TemporaError::UserScheduleConfigurationNotFound);
                    }
                }
                None => return Err(TemporaError::UserScheduleConfigurationNotFound),
            }

            Ok(())
        }

        fn get_schedule_by_id(
            &self,
            schedule_id: &Hash,
        ) -> Result<ScheduleConfiguration, TemporaError> {
            match self.schedules.get(&schedule_id) {
                Some(schedule) => Ok(schedule),
                None => Err(TemporaError::ScheduleConfigurationNotFound),
            }
        }

        fn update_schedule_execution_time(&mut self, schedule_id: &Hash) {
            let current_timestamp_in_seconds =
                self.env().block_timestamp().checked_div(1000).unwrap();

            let mut schedule_payment_executions = self
                .payment_executions
                .get(&schedule_id)
                .unwrap_or(Vec::new());

            schedule_payment_executions.push(current_timestamp_in_seconds);

            self.payment_executions
                .insert(schedule_id, &schedule_payment_executions);
        }

        fn update_user_schedules(&mut self, user_account_id: AccountId, schedule_id: &Hash) {
            let mut user_schedules = self
                .user_schedules
                .get(&user_account_id)
                .unwrap_or(Vec::new());
            user_schedules.push(*schedule_id);
            self.user_schedules.insert(user_account_id, &user_schedules);
        }

        fn ensure_admin(&self) -> Result<(), TemporaError> {
            if self.env().caller() != self.admin {
                return Err(TemporaError::Unauthorized);
            }

            Ok(())
        }
    }

    #[cfg(test)]
    mod tests {
        use super::*;
        use ink::env::test::{
            default_accounts, set_caller, set_value_transferred, DefaultAccounts,
        };
        use ink::env::DefaultEnvironment;
        use ink::primitives::AccountId;

        fn get_default_accounts() -> DefaultAccounts<DefaultEnvironment> {
            default_accounts::<DefaultEnvironment>()
        }

        fn set_sender(sender: AccountId) {
            set_caller::<DefaultEnvironment>(sender);
        }

        fn set_value_to_transfer(amount: u128) {
            set_value_transferred::<DefaultEnvironment>(amount);
        }

        fn init() -> (TemporaContract, DefaultAccounts<DefaultEnvironment>) {
            (TemporaContract::new(), get_default_accounts())
        }

        #[ink::test]
        fn set_admin_works() {
            let (mut contract, accounts) = init();

            let _ = contract.set_admin(accounts.bob);

            assert_eq!(contract.admin, accounts.bob);
        }

        #[ink::test]
        fn set_admin_fails() {
            let (mut contract, accounts) = init();

            set_sender(accounts.bob);
            let result = contract.set_admin(accounts.bob);

            assert_eq!(result, Err(TemporaError::Unauthorized));
        }

        #[ink::test]
        fn add_token_to_whitelist_works() {
            let (mut contract, accounts) = init();

            set_sender(accounts.alice);
            let token_address = AccountId::from([0x9; 32]);

            let _ = contract.add_token_to_whitelist(token_address);

            assert_eq!(contract.tokens_whitelist, vec![token_address]);
        }

        #[ink::test]
        fn add_token_to_whitelist_by_common_user_fails() {
            let (mut contract, accounts) = init();

            set_sender(accounts.bob);
            let result = contract.add_token_to_whitelist(accounts.bob);

            assert_eq!(result, Err(TemporaError::Unauthorized));
        }

        #[ink::test]
        fn add_token_to_whitelist_twice_fails() {
            let (mut contract, _) = init();

            let token_address = AccountId::from([0x9; 32]);

            let _ = contract.add_token_to_whitelist(token_address);
            let result = contract.add_token_to_whitelist(token_address);

            assert_eq!(result, Err(TemporaError::TokenIsAlreadyWhiteslited));
        }

        #[ink::test]
        fn remove_token_from_whitelist_works() {
            let (mut contract, _) = init();

            let token_address = AccountId::from([0x9; 32]);

            let _ = contract.add_token_to_whitelist(token_address);
            let _ = contract.remove_token_from_whitelist(token_address);

            assert_eq!(contract.tokens_whitelist, Vec::new());
        }

        #[ink::test]
        fn remove_token_from_whitelist_by_common_user_fails() {
            let (mut contract, accounts) = init();

            let token_address = AccountId::from([0x9; 32]);

            let _ = contract.add_token_to_whitelist(token_address);

            set_sender(accounts.bob);
            let result = contract.remove_token_from_whitelist(token_address);

            assert_eq!(result, Err(TemporaError::Unauthorized));
        }

        #[ink::test]
        fn remove_nonexistent_token_from_whitelist_fails() {
            let (mut contract, _) = init();

            let token_address = AccountId::from([0x9; 32]);

            let result = contract.remove_token_from_whitelist(token_address);

            assert_eq!(result, Err(TemporaError::TokenIsNotWhitelisted));
        }

        #[ink::test]
        fn get_whitelisted_tokens_works() {
            let (mut contract, _) = init();

            let token_address = AccountId::from([0x9; 32]);

            let _ = contract.add_token_to_whitelist(token_address);

            assert_eq!(contract.get_whitelisted_tokens(), vec![token_address]);
        }

        #[ink::test]
        fn save_fixed_payment_schedule_works() {
            let (mut contract, accounts) = init();

            let schedule_id = Hash::from([0x3; 32]);
            let task_id = String::from("task_123");
            let recipient = accounts.bob;
            let amount = 1000000;
            let token_address = None;
            let start_time = None;
            let interval = None;
            let execution_times = Some(vec![100, 200]);

            let _ = contract.save_schedule(
                schedule_id,
                task_id,
                recipient,
                amount,
                token_address,
                start_time,
                interval,
                execution_times,
            );

            let owner_schedules = contract.get_user_schedules();
            set_sender(accounts.bob);
            let recipient_schedules = contract.get_user_schedules();
            let schedule_result = contract.schedules.get(schedule_id);

            assert_eq!(owner_schedules.len(), 1);
            assert_eq!(owner_schedules[0].schedule_configuration.id, schedule_id);
            assert_eq!(recipient_schedules.len(), 1);
            assert_eq!(
                recipient_schedules[0].schedule_configuration.id,
                schedule_id
            );
            assert!(schedule_result.is_some());
        }

        #[ink::test]
        fn save_recurring_payment_schedule_works() {
            let (mut contract, accounts) = init();

            let schedule_id = Hash::from([0x3; 32]);
            let task_id = String::from("task_123");
            let recipient = accounts.bob;
            let amount = 1000000;
            let token_address = None;
            let start_time = Some(100);
            let interval = Some(100);
            let execution_times = None;

            let _ = contract.save_schedule(
                schedule_id,
                task_id,
                recipient,
                amount,
                token_address,
                start_time,
                interval,
                execution_times,
            );

            let owner_schedules = contract.get_user_schedules();
            set_sender(accounts.bob);
            let recipient_schedules = contract.get_user_schedules();
            let schedule_result = contract.schedules.get(schedule_id);

            assert_eq!(owner_schedules.len(), 1);
            assert_eq!(owner_schedules[0].schedule_configuration.id, schedule_id);
            assert_eq!(recipient_schedules.len(), 1);
            assert_eq!(
                recipient_schedules[0].schedule_configuration.id,
                schedule_id
            );
            assert!(schedule_result.is_some());
        }

        #[ink::test]
        fn save_repeated_fixed_payment_fails() {
            let (mut contract, accounts) = init();

            let schedule_id = Hash::from([0x3; 32]);
            let task_id = String::from("task_123");
            let recipient = accounts.bob;
            let amount = 1000000;
            let token_address = None;
            let start_time = None;
            let interval = None;
            let execution_times = Some(vec![100, 200]);

            let _ = contract.save_schedule(
                schedule_id,
                task_id.clone(),
                recipient,
                amount,
                token_address,
                start_time,
                interval,
                execution_times.clone(),
            );

            let result = contract.save_schedule(
                schedule_id,
                task_id,
                recipient,
                amount,
                token_address,
                start_time,
                interval,
                execution_times,
            );

            assert_eq!(
                result,
                Err(TemporaError::ScheduleConfigurationAlreadyExists)
            );
        }

        #[ink::test]
        fn save_fixed_payment_with_same_caller_and_recipient_fails() {
            let (mut contract, accounts) = init();

            let schedule_id = Hash::from([0x3; 32]);
            let task_id = String::from("task_123");
            let recipient = accounts.alice;
            let amount = 1000000;
            let token_address = None;
            let start_time = None;
            let interval = None;
            let execution_times = Some(vec![100, 200]);

            let result = contract.save_schedule(
                schedule_id,
                task_id,
                recipient,
                amount,
                token_address,
                start_time,
                interval,
                execution_times,
            );

            assert_eq!(result, Err(TemporaError::CallerCannotBeRecipient));
        }

        #[ink::test]
        fn save_fixed_payment_without_amount_fails() {
            let (mut contract, accounts) = init();

            let schedule_id = Hash::from([0x3; 32]);
            let task_id = String::from("task_123");
            let recipient = accounts.bob;
            let amount = 0;
            let token_address = None;
            let start_time = None;
            let interval = None;
            let execution_times = Some(vec![100, 200]);

            let result = contract.save_schedule(
                schedule_id,
                task_id,
                recipient,
                amount,
                token_address,
                start_time,
                interval,
                execution_times,
            );

            assert_eq!(result, Err(TemporaError::ScheduleAmountCannotBeZero));
        }

        #[ink::test]
        fn save_fixed_payment_with_nonwhitelisted_token_fails() {
            let (mut contract, accounts) = init();

            let schedule_id = Hash::from([0x3; 32]);
            let task_id = String::from("task_123");
            let recipient = accounts.bob;
            let amount = 1000000;
            let token_address = Some(AccountId::from([0x9; 32]));
            let start_time = None;
            let interval = None;
            let execution_times = Some(vec![100, 200]);

            let result = contract.save_schedule(
                schedule_id,
                task_id,
                recipient,
                amount,
                token_address,
                start_time,
                interval,
                execution_times,
            );

            assert_eq!(result, Err(TemporaError::TokenIsNotWhitelisted));
        }

        #[ink::test]
        fn save_schedule_without_timestamp_configuration_fails() {
            let (mut contract, accounts) = init();

            let schedule_id = Hash::from([0x3; 32]);
            let task_id = String::from("task_123");
            let recipient = accounts.bob;
            let amount = 1000000;
            let token_address = None;
            let start_time = None;
            let interval = None;
            let execution_times = None;

            let result = contract.save_schedule(
                schedule_id,
                task_id,
                recipient,
                amount,
                token_address,
                start_time,
                interval,
                execution_times,
            );

            assert_eq!(result, Err(TemporaError::WrongScheduleConfiguration));
        }

        #[ink::test]
        fn remove_schedule_works() {
            let (mut contract, accounts) = init();

            let schedule_id = Hash::from([0x3; 32]);
            let task_id = String::from("task_123");
            let recipient = accounts.bob;
            let amount = 1000000;
            let token_address = None;
            let start_time = Some(100);
            let interval = Some(100);
            let execution_times = None;

            let _ = contract.save_schedule(
                schedule_id,
                task_id,
                recipient,
                amount,
                token_address,
                start_time,
                interval,
                execution_times,
            );

            let _ = contract.remove_schedule(schedule_id);

            let schedule_result = contract.schedules.get(schedule_id);

            assert!(schedule_result.is_some());
            assert!(!schedule_result.unwrap().enabled);
        }

        #[ink::test]
        fn remove_nonexistent_schedule_fails() {
            let (mut contract, accounts) = init();

            let schedule_id = Hash::from([0x3; 32]);
            let task_id = String::from("task_123");
            let recipient = accounts.bob;
            let amount = 1000000;
            let token_address = None;
            let start_time = Some(100);
            let interval = Some(100);
            let execution_times = None;

            let _ = contract.save_schedule(
                schedule_id,
                task_id,
                recipient,
                amount,
                token_address,
                start_time,
                interval,
                execution_times,
            );

            set_sender(accounts.bob);
            let result = contract.remove_schedule(schedule_id);

            assert_eq!(result, Err(TemporaError::UserScheduleConfigurationNotFound));
        }

        #[ink::test]
        fn remove_schedule_by_nonowner_fails() {
            let (mut contract, accounts) = init();

            let schedule_id = Hash::from([0x3; 32]);

            set_sender(accounts.bob);
            let result = contract.remove_schedule(schedule_id);

            assert_eq!(result, Err(TemporaError::UserScheduleConfigurationNotFound));
        }

        #[ink::test]
        fn update_schedule_works() {
            let (mut contract, accounts) = init();

            let schedule_id = Hash::from([0x3; 32]);
            let task_id = String::from("task_123");
            let recipient = accounts.bob;
            let amount = 1000000;
            let token_address = None;
            let start_time = Some(100);
            let interval = Some(100);
            let execution_times = None;

            let _ = contract.save_schedule(
                schedule_id,
                task_id,
                recipient,
                amount,
                token_address,
                start_time,
                interval,
                execution_times,
            );

            let mut schedule = contract.schedules.get(schedule_id).unwrap();
            schedule.amount = 2000000;

            let _ = contract.update_schedule(schedule);

            let updated_schedule = contract.schedules.get(schedule_id).unwrap();

            assert_eq!(updated_schedule.amount, 2000000);
        }

        #[ink::test]
        fn update_nonexistent_schedule_fails() {
            let (mut contract, accounts) = init();

            let schedule_id = Hash::from([0x3; 32]);

            let schedule = ScheduleConfiguration {
                id: schedule_id,
                task_id: String::from("task_123"),
                sender: accounts.bob,
                recipient: accounts.bob,
                amount: 1000000,
                token_address: None,
                start_time: Some(100),
                interval: Some(100),
                execution_times: None,
                enabled: true,
            };

            let result = contract.update_schedule(schedule);

            assert_eq!(result, Err(TemporaError::UserScheduleConfigurationNotFound));
        }

        #[ink::test]
        fn trigger_native_payment_works() {
            let (mut contract, accounts) = init();

            let schedule_id = Hash::from([0x3; 32]);
            let task_id = String::from("task_123");
            let recipient = accounts.bob;
            let amount = 1000000;
            let token_address = None;
            let start_time = Some(100);
            let interval = Some(100);
            let execution_times = None;

            let _ = contract.save_schedule(
                schedule_id,
                task_id,
                recipient,
                amount,
                token_address,
                start_time,
                interval,
                execution_times,
            );

            set_value_to_transfer(amount);

            let _ = contract.trigger_payment(recipient, amount, token_address, schedule_id);

            let user_schedules = contract.get_user_schedules();
            let payment_executions = contract.payment_executions.get(schedule_id).unwrap();

            assert_eq!(user_schedules[0].payment_executions.len(), 1);
            assert_eq!(payment_executions.len(), 1);
        }

        #[ink::test]
        fn trigger_payment_with_same_caller_recipient_fails() {
            let (mut contract, accounts) = init();

            let schedule_id = Hash::from([0x3; 32]);

            set_sender(accounts.bob);
            let result = contract.trigger_payment(accounts.bob, 1000000, None, schedule_id);

            assert_eq!(result, Err(TemporaError::CallerCannotBeRecipient));
        }

        #[ink::test]
        fn trigger_payment_without_amount_fails() {
            let (mut contract, accounts) = init();

            let schedule_id = Hash::from([0x3; 32]);

            let result = contract.trigger_payment(accounts.bob, 0, None, schedule_id);

            assert_eq!(result, Err(TemporaError::ScheduleAmountCannotBeZero));
        }

        #[ink::test]
        fn trigger_native_payment_without_sufficient_balance_fails() {
            let (mut contract, accounts) = init();

            let schedule_id = Hash::from([0x3; 32]);
            let task_id = String::from("task_123");
            let recipient = accounts.bob;
            let amount = 1000000;
            let token_address = None;
            let start_time = Some(100);
            let interval = Some(100);
            let execution_times = None;

            let _ = contract.save_schedule(
                schedule_id,
                task_id,
                recipient,
                amount,
                token_address,
                start_time,
                interval,
                execution_times,
            );

            set_value_to_transfer(amount / 2);

            let result = contract.trigger_payment(recipient, amount, token_address, schedule_id);

            assert_eq!(result, Err(TemporaError::InsufficientBalance));
        }
    }
}
