<?php

namespace Modules\AppDomoprime\Entities;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * DomoprimeClassI18n Model (TENANT DATABASE)
 * Table: t_domoprime_class_i18n
 *
 * Unique constraint on (class_id, lang)
 *
 * @property int $id
 * @property int $class_id
 * @property string $lang
 * @property string $value
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 *
 * @property-read DomoprimeClass $domoprimeClass
 */
class DomoprimeClassI18n extends Model
{
    protected $connection = 'tenant';

    protected $table = 't_domoprime_class_i18n';

    protected $fillable = [
        'class_id',
        'lang',
        'value',
    ];

    protected $casts = [
        'id' => 'integer',
        'class_id' => 'integer',
        'lang' => 'string',
        'value' => 'string',
    ];

    public function domoprimeClass(): BelongsTo
    {
        return $this->belongsTo(DomoprimeClass::class, 'class_id');
    }
}
