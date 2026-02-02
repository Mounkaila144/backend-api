
--
-- Structure de la table `t_callcenter`  
--
CREATE TABLE IF NOT EXISTS `t_callcenter` (
        `id` int(11) unsigned NOT NULL AUTO_INCREMENT,            
        `name` varchar(64)  NOT NULL,                  
     PRIMARY KEY (`id`)      
) ENGINE=InnoDB DEFAULT CHARSET=utf8  AUTO_INCREMENT=1;

ALTER TABLE `t_users` ADD `callcenter_id` int(11) unsigned NOT NULL AFTER `birthday`;