<?php

namespace Modules\Customer\Entities;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class CustomerUnion extends Model
{
    /**
     * The table associated with the model.
     */
    protected $table = 't_customers_union';

    /**
     * The primary key associated with the table.
     */
    protected $primaryKey = 'id';

    /**
     * Indicates if the model should be timestamped.
     */
    public $timestamps = false;

    /**
     * The attributes that are mass assignable.
     */
    protected $fillable = [
        'name',
    ];

    /**
     * Get the customers that belong to this union.
     */
    public function customers(): HasMany
    {
        return $this->hasMany(Customer::class, 'union_id', 'id');
    }

    /**
     * Get the translations for this union.
     */
    public function translations(): HasMany
    {
        return $this->hasMany(CustomerUnionI18n::class, 'union_id', 'id');
    }

    /**
     * Get the translation for a specific language.
     */
    public function translation(string $lang)
    {
        return $this->translations()->where('lang', $lang)->first();
    }

    /**
     * Get the translated value for a specific language.
     */
    public function getTranslatedName(string $lang = 'en'): string
    {
        $translation = $this->translation($lang);

        return $translation ? $translation->value : $this->name;
    }
}
