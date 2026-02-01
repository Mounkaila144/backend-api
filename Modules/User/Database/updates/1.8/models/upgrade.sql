ALTER TABLE `t_users` ADD `is_locked` ENUM('NO','YES') NOT NULL DEFAULT 'NO' AFTER `is_guess`;
ALTER TABLE `t_users` ADD `locked_at` timestamp NULL DEFAULT NULL AFTER `is_locked`;
ALTER TABLE `t_users` ADD `unlocked_by` int(11) NULL DEFAULT NULL AFTER `locked_at`;
ALTER TABLE `t_users` ADD `number_of_try` int(2) NOT NULL DEFAULT 0 AFTER `unlocked_by`;
