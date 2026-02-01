--
-- Structure de la table `t_users_logout_request`  
--
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

