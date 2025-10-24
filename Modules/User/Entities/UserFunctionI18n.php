<?php

namespace Modules\User\Entities;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * UserFunctionI18n Model
 * Translations for user functions
 * Table: t_users_function_i18n
 */
class UserFunctionI18n extends Model
{
    protected $table = 't_users_function_i18n';

    protected $primaryKey = 'id';

    public $timestamps = true;
    const CREATED_AT = 'created_at';
    const UPDATED_AT = 'updated_at';

    protected $fillable = [
        'function_id',
        'lang',
        'value',
    ];

    protected $casts = [
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * Get the parent function
     */
    public function function(): BelongsTo
    {
        return $this->belongsTo(UserFunction::class, 'function_id', 'id');
    }

    /**
     * Scope to filter by language
     */
    public function scopeLang($query, string $lang)
    {
        return $query->where('lang', $lang);
    }
}
