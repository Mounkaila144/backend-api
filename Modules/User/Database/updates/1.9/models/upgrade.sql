CREATE TABLE IF NOT EXISTS `t_users_profile` (
        `id` int(11) unsigned NOT NULL AUTO_INCREMENT,            
        `name` varchar(64)  NOT NULL,   
        `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
        `updated_at` timestamp NOT NULL,               
     PRIMARY KEY (`id`)      
) ENGINE=InnoDB DEFAULT CHARSET=utf8  AUTO_INCREMENT=1;

--
-- Structure de la table `t_users_profile_i18n`  
--
CREATE TABLE IF NOT EXISTS `t_users_profile_i18n` (
        `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
        `profile_id` int(11) unsigned NOT NULL,
        `lang` varchar(2)  NOT NULL,             
        `value` varchar(64) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL,  
        `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
        `updated_at` timestamp NOT NULL,   
     PRIMARY KEY (`id`)   ,  
     UNIQUE KEY `unique` (`profile_id`,`lang`)   
   ) ENGINE=InnoDB DEFAULT CHARSET=utf8  ;


--
-- Structure de la table `t_users_profiles`  
--
CREATE TABLE IF NOT EXISTS `t_users_profiles` (
        `id` int(11) unsigned NOT NULL AUTO_INCREMENT,            
        `profile_id` int(11) unsigned NOT NULL,
        `user_id` int(11) NOT NULL,    
        `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
        `updated_at` timestamp NOT NULL,         
     PRIMARY KEY (`id`)      
) ENGINE=InnoDB DEFAULT CHARSET=utf8  AUTO_INCREMENT=1;

ALTER TABLE `t_users_profile_i18n` ADD CONSTRAINT `users_profile_fk0` FOREIGN KEY (`profile_id`) REFERENCES `t_users_profile` (`id`) ON DELETE CASCADE;
ALTER TABLE `t_users_profiles` ADD CONSTRAINT `users_profiles_fk0` FOREIGN KEY (`profile_id`) REFERENCES `t_users_profile` (`id`) ON DELETE CASCADE;
ALTER TABLE `t_users_profiles` ADD CONSTRAINT `users_profiles_fk1` FOREIGN KEY (`user_id`) REFERENCES `t_users` (`id`) ON DELETE CASCADE;


CREATE TABLE IF NOT EXISTS `t_users_profile_function` (
        `id` int(11) unsigned NOT NULL AUTO_INCREMENT, 
        `function_id` int(11) unsigned NOT NULL,
        `profile_id` int(11) unsigned NOT NULL,              
        `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
        `updated_at` timestamp NOT NULL,               
     PRIMARY KEY (`id`)      
) ENGINE=InnoDB DEFAULT CHARSET=utf8  AUTO_INCREMENT=1;

--ALTER TABLE `t_users_profile_function` ADD CONSTRAINT `users_profile_function_fk0` FOREIGN KEY (`function_id`) REFERENCES `t_users_function` (`id`) ON DELETE CASCADE;
ALTER TABLE `t_users_profile_function` ADD CONSTRAINT `users_profile_function_fk1` FOREIGN KEY (`profile_id`) REFERENCES `t_users_profile` (`id`) ON DELETE CASCADE;

CREATE TABLE IF NOT EXISTS `t_users_profile_group` (
        `id` int(11) unsigned NOT NULL AUTO_INCREMENT, 
        `group_id` int(11)  NOT NULL,
        `profile_id` int(11) unsigned NOT NULL,              
        `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
        `updated_at` timestamp NOT NULL,               
     PRIMARY KEY (`id`)      
) ENGINE=InnoDB DEFAULT CHARSET=utf8  AUTO_INCREMENT=1;


--ALTER TABLE `t_users_profile_group` ADD CONSTRAINT `users_profile_group_fk0` FOREIGN KEY (`group_id`) REFERENCES `t_groups` (`id`) ON DELETE CASCADE;
ALTER TABLE `t_users_profile_group` ADD CONSTRAINT `users_profile_group_fk1` FOREIGN KEY (`profile_id`) REFERENCES `t_users_profile` (`id`) ON DELETE CASCADE;
