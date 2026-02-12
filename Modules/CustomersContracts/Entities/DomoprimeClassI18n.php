<?php

namespace Modules\CustomersContracts\Entities;

use Illuminate\Database\Eloquent\Model;

class DomoprimeClassI18n extends Model
{
    protected $connection = 'tenant';

    protected $table = 't_domoprime_class_i18n';

    public $timestamps = false;

    protected $primaryKey = null;

    public $incrementing = false;
}
