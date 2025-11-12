--
-- Structure de la table `t_users`
--

CREATE TABLE IF NOT EXISTS `t_users` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `username` varchar(32) COLLATE utf8_bin NOT NULL,
  `password` varchar(32) COLLATE utf8_bin NOT NULL DEFAULT '',
  `sex` enum('Mr','Ms','Mrs') DEFAULT NULL,
  `firstname` varchar(16) COLLATE utf8_bin DEFAULT NULL,
  `lastname` varchar(32) COLLATE utf8_bin DEFAULT NULL,
  `email` varchar(255) COLLATE utf8_bin NOT NULL DEFAULT '',
  `picture` varchar(255) COLLATE utf8_bin NOT NULL DEFAULT '',
  `phone` varchar(20) COLLATE utf8_bin NOT NULL DEFAULT '',
  `mobile` varchar(20) COLLATE utf8_bin NOT NULL DEFAULT '',
  `birthday` date DEFAULT NULL,
  `status` enum('ACTIVE','DELETE') COLLATE utf8_bin NOT NULL DEFAULT 'ACTIVE',
  `callcenter_id` int(11) unsigned NOT NULL,
  `team_id` int(11) unsigned NOT NULL,
  `is_active` enum('YES','NO') COLLATE utf8_bin NOT NULL DEFAULT 'NO',
  `is_guess` enum('YES','NO') COLLATE utf8_bin NOT NULL DEFAULT 'NO',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT '0000-00-00 00:00:00',
  `last_password_gen` TIMESTAMP NULL DEFAULT NULL,
  `lastlogin` TIMESTAMP NULL DEFAULT NULL,
  `email_tosend` ENUM( "YES", "NO" ) DEFAULT "NO" NOT NULL,
    `creator_id` INT(11) NULL,
  `application` enum('admin','frontend','superadmin') COLLATE utf8_bin NOT NULL,
    `is_locked` ENUM('NO','YES') NOT NULL DEFAULT 'NO' AFTER `is_guess`,
    `locked_at` timestamp NULL DEFAULT NULL AFTER `is_locked`,
    `unlocked_by` int(11) NULL DEFAULT NULL AFTER `locked_at`,
    `number_of_try` int(2) NOT NULL DEFAULT 0 AFTER `unlocked_by`,
    `is_secure_by_code` enum('YES','NO') COLLATE utf8_bin NOT NULL DEFAULT 'NO',
    `company_id` INT(11) UNSIGNED NULL DEFAULT NULL ,
  PRIMARY KEY (`id`),
    KEY `creator` (`creator_id`)
    KEY `company_id` (`company_id`)
  UNIQUE KEY `username` (`username`,`application`),
) ENGINE=InnoDB  DEFAULT CHARSET=utf8 COLLATE=utf8_bin AUTO_INCREMENT=1 ;

-- ALTER TABLE `t_users` ADD `team_id` INT( 11 ) NOT NULL AFTER `name` 

--
-- Structure de la table `t_users_functions`  
--
CREATE TABLE IF NOT EXISTS `t_users_functions` (
        `id` int(11) unsigned NOT NULL AUTO_INCREMENT,            
        `function_id` int(11) unsigned NOT NULL,
        `user_id` int(11) NOT NULL,          
     PRIMARY KEY (`id`)      
) ENGINE=InnoDB DEFAULT CHARSET=utf8  AUTO_INCREMENT=1;

--
-- Structure de la table `t_users_function`  
--
CREATE TABLE IF NOT EXISTS `t_users_function` (
        `id` int(11) unsigned NOT NULL AUTO_INCREMENT,            
        `name` varchar(64)  NOT NULL,               
     PRIMARY KEY (`id`)      
) ENGINE=InnoDB DEFAULT CHARSET=utf8  AUTO_INCREMENT=1;

--
-- Structure de la table `t_users_function_i18n`  
--
CREATE TABLE IF NOT EXISTS `t_users_function_i18n` (
        `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
        `function_id` int(11) unsigned NOT NULL,
        `lang` varchar(2)  NOT NULL,             
        `value` varchar(64) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL,  
        `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
        `updated_at` timestamp NOT NULL DEFAULT '0000-00-00 00:00:00',   
     PRIMARY KEY (`id`)   ,  
     UNIQUE KEY `unique` (`function_id`,`lang`)   
   ) ENGINE=InnoDB DEFAULT CHARSET=utf8  ;

ALTER TABLE `t_users_function_i18n` ADD CONSTRAINT `users_function` FOREIGN KEY (`function_id`) REFERENCES `t_users_function` (`id`) ON DELETE CASCADE;
ALTER TABLE `t_users_functions` ADD CONSTRAINT `users_functions_0` FOREIGN KEY (`function_id`) REFERENCES `t_users_function` (`id`) ON DELETE CASCADE;
ALTER TABLE `t_users_functions` ADD CONSTRAINT `users_functions_1` FOREIGN KEY (`user_id`) REFERENCES `t_users` (`id`) ON DELETE CASCADE;

--
-- Structure de la table `t_users_team`  
--
CREATE TABLE IF NOT EXISTS `t_users_team` (
        `id` int(11) unsigned NOT NULL AUTO_INCREMENT,            
        `name` varchar(64)  NOT NULL,    
        `manager_id` int(11) NOT NULL,    
        `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
        `updated_at` timestamp NOT NULL DEFAULT '0000-00-00 00:00:00',      
     PRIMARY KEY (`id`)      
) ENGINE=InnoDB DEFAULT CHARSET=utf8  AUTO_INCREMENT=1;

-- ALTER TABLE `t_users_team` ADD `manager_id` INT( 11 ) NOT NULL AFTER `name` 

--
-- Structure de la table `t_users_team_users`  
--
CREATE TABLE IF NOT EXISTS `t_users_team_users` (
        `id` int(11) unsigned NOT NULL AUTO_INCREMENT,            
        `team_id` int(11) unsigned NOT NULL,
        `user_id` int(11)  NOT NULL,    
     PRIMARY KEY (`id`)      
) ENGINE=InnoDB DEFAULT CHARSET=utf8  AUTO_INCREMENT=1;

ALTER TABLE `t_users_team_users` ADD CONSTRAINT `users_team_users_0` FOREIGN KEY (`user_id`) REFERENCES `t_users` (`id`) ON DELETE CASCADE;
ALTER TABLE `t_users_team_users` ADD CONSTRAINT `users_team_users_1` FOREIGN KEY (`team_id`) REFERENCES `t_users_team` (`id`) ON DELETE CASCADE;

--
-- Structure de la table `t_users_attribution`  
--
CREATE TABLE IF NOT EXISTS `t_users_attribution` (
        `id` int(11) unsigned NOT NULL AUTO_INCREMENT,            
        `name` varchar(64)  NOT NULL,               
     PRIMARY KEY (`id`)      
) ENGINE=InnoDB DEFAULT CHARSET=utf8  AUTO_INCREMENT=1;

--
-- Structure de la table `t_users_attribution_i18n`  
--
CREATE TABLE IF NOT EXISTS `t_users_attribution_i18n` (
        `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
        `attribution_id` int(11) unsigned NOT NULL,
        `lang` varchar(2)  NOT NULL,             
        `value` varchar(64) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL,  
        `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
        `updated_at` timestamp NOT NULL DEFAULT '0000-00-00 00:00:00',   
     PRIMARY KEY (`id`)   ,  
     UNIQUE KEY `unique` (`attribution_id`,`lang`)   
   ) ENGINE=InnoDB DEFAULT CHARSET=utf8  ;

ALTER TABLE `t_users_attribution_i18n` ADD CONSTRAINT `users_attribution` FOREIGN KEY (`attribution_id`) REFERENCES `t_users_attribution` (`id`) ON DELETE CASCADE;


--
-- Structure de la table `t_users_attributions`  
--
CREATE TABLE IF NOT EXISTS `t_users_attributions` (
        `id` int(11) unsigned NOT NULL AUTO_INCREMENT,            
        `attribution_id` int(11) unsigned NOT NULL,
        `user_id` int(11) NOT NULL,          
     PRIMARY KEY (`id`)      
) ENGINE=InnoDB DEFAULT CHARSET=utf8  AUTO_INCREMENT=1;

ALTER TABLE `t_users_attributions` ADD CONSTRAINT `users_attributions_0` FOREIGN KEY (`attribution_id`) REFERENCES `t_users_attribution` (`id`) ON DELETE CASCADE;
ALTER TABLE `t_users_attributions` ADD CONSTRAINT `users_attributions_1` FOREIGN KEY (`user_id`) REFERENCES `t_users` (`id`) ON DELETE CASCADE;


--
-- Structure de la table `t_users_team_manager`  
--
CREATE TABLE IF NOT EXISTS `t_users_team_manager` (
        `id` int(11) unsigned NOT NULL AUTO_INCREMENT,            
        `manager_id` int(11) unsigned NOT NULL,
        `manager2_id` int(11) unsigned NOT NULL,
        `user_id` int(11) NOT NULL,
     PRIMARY KEY (`id`)      
) ENGINE=InnoDB DEFAULT CHARSET=utf8  AUTO_INCREMENT=1;

CREATE TABLE IF NOT EXISTS `t_callcenter` (
                                              `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
    `name` varchar(64)  NOT NULL,
    PRIMARY KEY (`id`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8  AUTO_INCREMENT=1;

CREATE TABLE IF NOT EXISTS `t_users_logout_request` (
                                                        `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
    `user_id` int(11) NOT NULL,
    `session_id` int(11) UNSIGNED NOT NULL,
    `logout` ENUM( "YES", "NO","LOGOUT" ) DEFAULT "NO" NOT NULL,
    `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` timestamp NOT NULL,
    PRIMARY KEY (`id`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8  ;
ALTER TABLE `t_users_logout_request` ADD CONSTRAINT `logout_request_users_1` FOREIGN KEY (`user_id`) REFERENCES `t_users` (`id`) ON DELETE CASCADE;
ALTER TABLE `t_users_logout_request` ADD CONSTRAINT `logout_request_users_2` FOREIGN KEY (`session_id`) REFERENCES `t_sessions` (`id`) ON DELETE CASCADE;


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


CREATE TABLE IF NOT EXISTS `t_users_validation_token` (
                                                          `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
    `token` varchar(64) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL,
    `type` varchar(24) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL,
    `message` varchar(128) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL,
    `callback` VARCHAR(4096) CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL,
    `user_id` int(11) NOT NULL,
    `status` enum('ACTIVE','DELETE') COLLATE utf8_bin NOT NULL DEFAULT 'ACTIVE',
    `validation_email` varchar(255) COLLATE utf8_bin NOT NULL DEFAULT '',
    `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` timestamp NOT NULL,
    PRIMARY KEY (`id`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8  AUTO_INCREMENT=1;

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

DELETE `t_users_profile_group` FROM `t_users_profile_group`
LEFT JOIN t_groups ON t_groups.id= t_users_profile_group.group_id
WHERE t_groups.id IS NULL;


ALTER TABLE `t_users_profile_group` ADD CONSTRAINT `users_profile_group_fk0` FOREIGN KEY (`group_id`) REFERENCES `t_groups` (`id`) ON DELETE CASCADE;
UPDATE `t_users` SET `is_active`='NO' WHERE `status`='DELETE';