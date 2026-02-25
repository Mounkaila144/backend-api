<?php

namespace Modules\AppDomoprime\Entities;

use Illuminate\Database\Eloquent\Model;

/**
 * @property int $id
 * @property string $name
 * @property string $commercial
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 */
class DomoprimeSubventionType extends Model
{
    protected $connection = 'tenant';

    protected $table = 't_domoprime_subvention_type';

    protected $fillable = [
        'name',
        'commercial',
    ];

    protected $casts = [
        'id' => 'integer',
        'name' => 'string',
        'commercial' => 'string',
    ];
}
