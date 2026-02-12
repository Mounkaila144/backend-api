<?php

namespace Modules\Product\Entities;

use Illuminate\Database\Eloquent\Model;

/**
 * Tax Model (TENANT DATABASE)
 * Table: t_products_taxes
 *
 * @property int $id
 * @property float $rate
 * @property string|null $description
 * @property \Carbon\Carbon $created_at
 * @property \Carbon\Carbon $updated_at
 */
class Tax extends Model
{
    protected $connection = 'tenant';

    protected $table = 't_products_taxes';

    protected $fillable = [
        'rate',
        'description',
    ];

    protected $casts = [
        'rate' => 'float',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];
}
