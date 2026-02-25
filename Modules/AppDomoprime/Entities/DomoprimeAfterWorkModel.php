<?php

namespace Modules\AppDomoprime\Entities;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * DomoprimeAfterWorkModel Model (TENANT DATABASE)
 * Table: t_domoprime_after_work_model
 *
 * @property int $id
 * @property string $name
 * @property string $options
 *
 * @property-read \Illuminate\Database\Eloquent\Collection<int, DomoprimeAfterWorkModelI18n> $translations
 */
class DomoprimeAfterWorkModel extends Model
{
    protected $connection = 'tenant';

    protected $table = 't_domoprime_after_work_model';

    public $timestamps = false;

    protected $fillable = [
        'name',
        'options',
    ];

    protected $casts = [
        'id' => 'integer',
        'name' => 'string',
        'options' => 'string',
    ];

    protected $attributes = [
        'options' => '',
    ];

    public function translations(): HasMany
    {
        return $this->hasMany(DomoprimeAfterWorkModelI18n::class, 'model_id');
    }
}
