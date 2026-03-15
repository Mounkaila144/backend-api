<?php

namespace Modules\CustomersMeetings\Entities;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * @property int $id
 * @property string $name
 */
class CustomerMeetingType extends Model
{
    protected $connection = 'tenant';

    protected $table = 't_customers_meeting_type';

    public $timestamps = false;

    protected $fillable = ['name'];

    public function translations(): HasMany
    {
        return $this->hasMany(CustomerMeetingTypeI18n::class, 'type_id');
    }

    public function getTranslatedValue($lang = 'en')
    {
        $translation = $this->translations()->where('lang', $lang)->first();
        return $translation ? $translation->value : $this->name;
    }
}
