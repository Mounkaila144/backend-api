<?php


class users_downgrade_10_Action extends mfModuleUpdate {
 
    
    function execute()
    {
       $site=$this->getSite();     
       $files=array(
              $this->getModelsPath()."/downgrade.sql",               
              );              
       $importDB=importDatabase::getInstance();           
       foreach ($files as $file)
       {    
           if (!is_readable($file))
               continue;          
           $importDB->import($file,$site);         
       }    
    }
    
   
}

