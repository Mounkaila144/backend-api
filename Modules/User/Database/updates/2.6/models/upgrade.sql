ALTER TABLE `t_users` ADD `company_id` INT(11) UNSIGNED NULL DEFAULT NULL AFTER `is_guess`;

ALTER TABLE `t_users` ADD INDEX `company_id` ( `company_id` );