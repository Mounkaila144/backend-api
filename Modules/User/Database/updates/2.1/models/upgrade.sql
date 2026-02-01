 CREATE TABLE IF NOT EXISTS `t_users_validation_token` (
        `id` int(11) unsigned NOT NULL AUTO_INCREMENT,     
        `token` varchar(64) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL,       
        `type` varchar(24) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL,      
        `message` varchar(128) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL,       
        `callback` varchar(512) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL,  
        `user_id` int(11) NOT NULL,    
        `status` enum('ACTIVE','DELETE') COLLATE utf8_bin NOT NULL DEFAULT 'ACTIVE',
        `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
        `updated_at` timestamp NOT NULL,   
     PRIMARY KEY (`id`)       
) ENGINE=InnoDB DEFAULT CHARSET=utf8  AUTO_INCREMENT=1;

