<?php



class users_upgrade_13_Action extends mfModuleUpdate {
 
    function execute()
    {      
       $site=$this->getSite();                              
       $permission_group=new PermissionGroup('settings',$site); 
       foreach (array('settings_user_disable','settings_user_remove') as $field)
       {    
            $permission=new Permission($field,'admin',$site);
            $permission->add(array('name'=>$field,'group_id'=>$permission_group))->save();  
       }      
    }
}

