<?php



class users_upgrade_16_Action extends mfModuleUpdate {
 
    function execute()
    {      
       $site=$this->getSite();        
       $permission_group=new PermissionGroup('admin',$site);
       // Create permissions
       $permission=new Permission('user_logout_scheduler','admin',$site);
       $permission->add(array('name'=>'user_logout_scheduler','group_id'=>$permission_group))->save(); 
       
       $permission=new Permission('user_logout','admin',$site);
       $permission->add(array('name'=>'user_logout','group_id'=>$permission_group))->save(); 
    }
}

