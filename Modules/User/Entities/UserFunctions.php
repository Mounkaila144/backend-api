<?php

namespace Modules\User\Entities;

use Illuminate\Database\Eloquent\Relations\Pivot;

/**
 * UserFunctions Pivot Model
 * Links users to their functions
 * Table: t_users_functions
 */
class UserFunctions extends Pivot
{
    protected $table = 't_users_functions';

    protected $primaryKey = 'id';

    public $incrementing = true;

    public $timestamps = false;

    protected $fillable = [
        'function_id',
        'user_id',
    ];

    protected $casts = [
        'function_id' => 'integer',
        'user_id' => 'integer',
    ];
}
