DELETE `t_users_profile_group` FROM `t_users_profile_group`
LEFT JOIN t_groups ON t_groups.id= t_users_profile_group.group_id
WHERE t_groups.id IS NULL;


ALTER TABLE `t_users_profile_group` ADD CONSTRAINT `users_profile_group_fk0` FOREIGN KEY (`group_id`) REFERENCES `t_groups` (`id`) ON DELETE CASCADE;