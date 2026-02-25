<?php

namespace Modules\AppDomoprime\Entities;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * DomoprimePreMeetingModel Model (TENANT DATABASE)
 * Table: t_domoprime_pre_meeting_model
 *
 * @property int $id
 * @property string $name
 * @property string $options
 *
 * @property-read \Illuminate\Database\Eloquent\Collection<int, DomoprimePreMeetingModelI18n> $translations
 */
class DomoprimePreMeetingModel extends Model
{
    protected $connection = 'tenant';

    protected $table = 't_domoprime_pre_meeting_model';

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
        return $this->hasMany(DomoprimePreMeetingModelI18n::class, 'model_id');
    }
}
