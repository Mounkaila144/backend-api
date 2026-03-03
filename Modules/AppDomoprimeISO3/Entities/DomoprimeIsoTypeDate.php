<?php

namespace Modules\AppDomoprimeISO3\Entities;

use Illuminate\Database\Eloquent\Model;

/**
 * DomoprimeIsoTypeDate Model (TENANT DATABASE)
 * Table: t_domoprime_iso_type_date
 *
 * Stores date validation rules per quotation type (ISO, BOILER, PACK, ITE, TYPE1, TYPE2).
 *
 * @property int $id
 * @property string|null $date
 * @property string $type
 * @property int $difference
 * @property int $adder
 * @property string $is_copied
 * @property string $is_dated_copied
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 */
class DomoprimeIsoTypeDate extends Model
{
    protected $connection = 'tenant';

    protected $table = 't_domoprime_iso_type_date';

    protected $fillable = [
        'date',
        'type',
        'difference',
        'adder',
        'is_copied',
        'is_dated_copied',
    ];

    protected $casts = [
        'id' => 'integer',
        'date' => 'string',
        'type' => 'string',
        'difference' => 'integer',
        'adder' => 'integer',
        'is_copied' => 'string',
        'is_dated_copied' => 'string',
    ];
}
