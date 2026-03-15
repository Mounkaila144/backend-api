<?php

namespace Modules\CustomersMeetings\Entities;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * @property int $id
 * @property string $name
 * @property string|null $from (TIME)
 * @property string|null $to (TIME)
 * @property string $color
 */
class CustomerMeetingDateRange extends Model
{
    protected $connection = 'tenant';

    protected $table = 't_customers_meetings_date_range';

    public $timestamps = false;

    protected $fillable = ['name', 'from', 'to', 'color'];

    public function translations(): HasMany
    {
        return $this->hasMany(CustomerMeetingDateRangeI18n::class, 'range_id');
    }

    public function getTranslatedValue($lang = 'en')
    {
        $translation = $this->translations()->where('lang', $lang)->first();
        return $translation ? $translation->value : $this->name;
    }
}
