ALTER TABLE `t_user_group` ADD  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP AFTER `is_active`;
ALTER TABLE `t_user_group` ADD  `updated_at` timestamp NOT NULL AFTER `created_at`;
