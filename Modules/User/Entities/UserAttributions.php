<?php

namespace Modules\User\Entities;

use Illuminate\Database\Eloquent\Relations\Pivot;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * UserAttributions Pivot Model
 * Links users to their attributions
 * Table: t_users_attributions
 */
class UserAttributions extends Pivot
{
    protected $table = 't_users_attributions';

    protected $primaryKey = 'id';

    public $incrementing = true;

    public $timestamps = false;

    protected $fillable = [
        'attribution_id',
        'user_id',
    ];

    protected $casts = [
        'attribution_id' => 'integer',
        'user_id' => 'integer',
    ];

    /**
     * Get the attribution
     */
    public function attribution(): BelongsTo
    {
        return $this->belongsTo(UserAttribution::class, 'attribution_id', 'id');
    }

    /**
     * Get the user
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id', 'id');
    }
}
