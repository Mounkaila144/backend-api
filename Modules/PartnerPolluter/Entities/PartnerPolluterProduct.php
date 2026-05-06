<?php

namespace Modules\PartnerPolluter\Entities;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Modules\Product\Entities\Product;

/**
 * @property int $id
 * @property int|null $product_id
 * @property int|null $polluter_id
 */
class PartnerPolluterProduct extends Model
{
    protected $connection = 'tenant';

    protected $table = 't_partner_polluter_product';

    protected $fillable = ['product_id', 'polluter_id'];

    protected $casts = [
        'product_id' => 'integer',
        'polluter_id' => 'integer',
    ];

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class, 'product_id');
    }

    public function polluter(): BelongsTo
    {
        return $this->belongsTo(PartnerPolluterCompany::class, 'polluter_id');
    }
}
