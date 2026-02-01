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
  `team_id` int(11) unsigned NOT NULL,
  `is_active` enum('YES','NO') COLLATE utf8_bin NOT NULL DEFAULT 'NO',
  `is_guess` enum('YES','NO') COLLATE utf8_bin NOT NULL DEFAULT 'NO',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT '0000-00-00 00:00:00',
  `last_password_gen` timestamp NOT NULL DEFAULT '0000-00-00 00:00:00',
  `lastlogin` timestamp NOT NULL DEFAULT '0000-00-00 00:00:00',
  `email_tosend` ENUM( "YES", "NO" ) DEFAULT "NO" NOT NULL,   
  `application` enum('admin','frontend','superadmin') COLLATE utf8_bin NOT NULL,
  PRIMARY KEY (`id`),  
  UNIQUE KEY `username` (`username`,`application`),
  UNIQUE KEY `email` (`email`,`application`)
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
        `user_id` int(11) NOT NULL,          
     PRIMARY KEY (`id`)      
) ENGINE=InnoDB DEFAULT CHARSET=utf8  AUTO_INCREMENT=1;
