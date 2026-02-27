<?php

namespace Modules\AppDomoprime\Entities;

use Illuminate\Database\Eloquent\Model;

/**
 * @property int $id
 * @property string $name
 * @property float $coef
 * @property string $is_active
 * @property string $status
 */
class DomoprimeIsoCumacPrice extends Model
{
    protected $table = 't_domoprime_iso_cumac_price';

    protected $fillable = ['name', 'coef', 'is_active', 'status'];
}
