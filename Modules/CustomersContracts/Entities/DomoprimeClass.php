<?php

namespace Modules\CustomersContracts\Entities;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class DomoprimeClass extends Model
{
    protected $connection = 'tenant';

    protected $table = 't_domoprime_class';

    public $timestamps = false;

    public function translations(): HasMany
    {
        return $this->hasMany(DomoprimeClassI18n::class, 'class_id');
    }
}
