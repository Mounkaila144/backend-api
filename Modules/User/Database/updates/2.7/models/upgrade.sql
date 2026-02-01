 CREATE TABLE IF NOT EXISTS `t_user_property` (
        `id` int(11) unsigned NOT NULL AUTO_INCREMENT,     
        `name` varchar(64) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL,      
        `parameters` TEXT, 
        `user_id` int(11) NOT NULL,    
        `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
        `updated_at` timestamp NULL DEFAULT NULL,   
     PRIMARY KEY (`id`)       
) ENGINE=InnoDB DEFAULT CHARSET=utf8  AUTO_INCREMENT=1;

ALTER TABLE `t_user_property` ADD CONSTRAINT `user_property_fk0` FOREIGN KEY (`user_id`) REFERENCES `t_users` (`id`) ON DELETE CASCADE;

