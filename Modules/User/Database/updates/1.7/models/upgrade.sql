ALTER TABLE `t_users` CHANGE `last_password_gen` `last_password_gen` TIMESTAMP NULL DEFAULT NULL;
ALTER TABLE `t_users` CHANGE `lastlogin` `lastlogin` TIMESTAMP NULL DEFAULT NULL;
UPDATE `t_users` SET  `lastlogin` = NULL WHERE  `lastlogin`='0000-00-00 00:00:00';
UPDATE `t_users` SET  `last_password_gen` = NULL WHERE  `last_password_gen`='0000-00-00 00:00:00';