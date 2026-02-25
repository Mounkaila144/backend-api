<?php

namespace Modules\AppDomoprime\Entities;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * @property int $id
 * @property int $calculation_id
 * @property int $product_id
 * @property int|null $work_id
 * @property string $qmac_value
 * @property string $qmac
 * @property string $surface
 * @property string $purchasing_price
 * @property string $margin
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 *
 * @property-read DomoprimeCalculation $calculation
 */
class DomoprimeProductCalculation extends Model
{
    protected $connection = 'tenant';

    protected $table = 't_domoprime_product_calculation';

    protected $fillable = [
        'calculation_id',
        'product_id',
        'work_id',
        'qmac_value',
        'qmac',
        'surface',
        'purchasing_price',
        'margin',
    ];

    protected $casts = [
        'id' => 'integer',
        'calculation_id' => 'integer',
        'product_id' => 'integer',
        'work_id' => 'integer',
        'qmac_value' => 'decimal:6',
        'qmac' => 'decimal:6',
        'surface' => 'decimal:6',
        'purchasing_price' => 'decimal:6',
        'margin' => 'decimal:6',
    ];

    public function calculation(): BelongsTo
    {
        return $this->belongsTo(DomoprimeCalculation::class, 'calculation_id');
    }
}
