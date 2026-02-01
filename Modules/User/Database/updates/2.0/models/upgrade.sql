ALTER TABLE `t_users` ADD `creator_id` INT(11) NULL AFTER `callcenter_id`;

ALTER TABLE `t_users` ADD KEY `creator` (`creator_id`);