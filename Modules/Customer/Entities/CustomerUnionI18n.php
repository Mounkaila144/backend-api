<?php

namespace Modules\Customer\Entities;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CustomerUnionI18n extends Model
{
    /**
     * The table associated with the model.
     */
    protected $table = 't_customers_union_i18n';

    /**
     * The primary key associated with the table.
     */
    protected $primaryKey = 'id';

    /**
     * Indicates if the model should be timestamped.
     */
    public $timestamps = true;

    const CREATED_AT = 'created_at';
    const UPDATED_AT = 'updated_at';

    /**
     * The attributes that are mass assignable.
     */
    protected $fillable = [
        'union_id',
        'lang',
        'value',
    ];

    /**
     * The attributes that should be cast.
     */
    protected $casts = [
        'union_id' => 'integer',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * Get the union that owns the translation.
     */
    public function union(): BelongsTo
    {
        return $this->belongsTo(CustomerUnion::class, 'union_id', 'id');
    }
}
