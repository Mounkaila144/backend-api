<?php

namespace Modules\Dashboard\Entities;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * SystemMenuI18n Model - Menu Translations
 *
 * @property int $id
 * @property int $menu_id
 * @property string $lang Language code (fr, en, etc.)
 * @property string $value Translated menu label
 * @property \Carbon\Carbon $created_at
 * @property \Carbon\Carbon|null $updated_at
 */
class SystemMenuI18n extends Model
{
    protected $connection = 'tenant';
    protected $table = 't_system_menu_i18n';
    protected $primaryKey = 'id';

    protected $fillable = [
        'menu_id',
        'lang',
        'value',
    ];

    /**
     * Get the menu that owns this translation
     */
    public function menu(): BelongsTo
    {
        return $this->belongsTo(SystemMenu::class, 'menu_id', 'id');
    }

    /**
     * Scope to get translations for a specific language
     */
    public function scopeForLanguage($query, string $lang)
    {
        return $query->where('lang', $lang);
    }

    /**
     * Scope to get translations for a specific menu
     */
    public function scopeForMenu($query, int $menuId)
    {
        return $query->where('menu_id', $menuId);
    }
}
