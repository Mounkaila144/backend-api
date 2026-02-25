<?php

namespace Modules\AppDomoprime\Entities;

use Illuminate\Database\Eloquent\Model;

/**
 * @property int $id
 * @property string $name
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 */
class DomoprimeSector extends Model
{
    protected $connection = 'tenant';

    protected $table = 't_domoprime_sector';

    protected $fillable = [
        'name',
    ];

    protected $casts = [
        'id' => 'integer',
        'name' => 'string',
    ];
}
