<?php

namespace Modules\Dashboard\Entities;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * SystemMenu Model - Nested Set Menu System
 *
 * Uses nested set model with lb (left boundary), rb (right boundary), and level
 * to maintain hierarchical menu structure.
 *
 * @property int $id
 * @property string|null $name Unique identifier
 * @property string|null $menu Menu name
 * @property string|null $module Associated module
 * @property int $lb Left boundary (nested set)
 * @property int $rb Right boundary (nested set)
 * @property int $level Depth level (1-4)
 * @property string $status ACTIVE|DELETE
 * @property string $type SYSTEM|USER
 * @property \Carbon\Carbon $created_at
 * @property \Carbon\Carbon|null $updated_at
 */
class SystemMenu extends Model
{
    protected $connection = 'tenant';
    protected $table = 't_system_menu';
    protected $primaryKey = 'id';

    protected $fillable = [
        'name',
        'menu',
        'module',
        'lb',
        'rb',
        'level',
        'status',
        'type',
    ];

    protected $casts = [
        'lb' => 'integer',
        'rb' => 'integer',
        'level' => 'integer',
    ];

    protected $attributes = [
        'lb' => 0,
        'rb' => 0,
        'level' => 0,
        'status' => 'ACTIVE',
        'type' => 'SYSTEM',
    ];

    const STATUS_ACTIVE = 'ACTIVE';
    const STATUS_DELETE = 'DELETE';

    const TYPE_SYSTEM = 'SYSTEM';
    const TYPE_USER = 'USER';

    const MAX_LEVEL = 4;

    /**
     * Get translations for this menu
     */
    public function translations(): HasMany
    {
        return $this->hasMany(SystemMenuI18n::class, 'menu_id', 'id');
    }

    /**
     * Get translation for specific language
     */
    public function translation(string $lang): ?SystemMenuI18n
    {
        return $this->translations()->where('lang', $lang)->first();
    }

    /**
     * Get or create translation for specific language
     */
    public function getTranslation(string $lang): SystemMenuI18n
    {
        $translation = $this->translation($lang);

        if (!$translation) {
            $translation = new SystemMenuI18n([
                'menu_id' => $this->id,
                'lang' => $lang,
                'value' => $this->menu ?? '',
            ]);
        }

        return $translation;
    }

    /**
     * Get all children of this menu item
     */
    public function children()
    {
        return static::where('lb', '>', $this->lb)
            ->where('rb', '<', $this->rb)
            ->where('level', $this->level + 1)
            ->where('status', self::STATUS_ACTIVE)
            ->orderBy('lb')
            ->get();
    }

    /**
     * Get all descendants (children, grandchildren, etc.)
     */
    public function descendants()
    {
        return static::where('lb', '>', $this->lb)
            ->where('rb', '<', $this->rb)
            ->where('status', self::STATUS_ACTIVE)
            ->orderBy('lb')
            ->get();
    }

    /**
     * Get parent of this menu item
     */
    public function parent()
    {
        return static::where('lb', '<', $this->lb)
            ->where('rb', '>', $this->rb)
            ->where('level', $this->level - 1)
            ->where('status', self::STATUS_ACTIVE)
            ->orderBy('lb', 'desc')
            ->first();
    }

    /**
     * Get root parent (level 1)
     */
    public function rootParent()
    {
        return static::where('lb', '<', $this->lb)
            ->where('rb', '>', $this->rb)
            ->where('level', 1)
            ->where('status', self::STATUS_ACTIVE)
            ->first();
    }

    /**
     * Get ancestors (parent, grandparent, etc.)
     */
    public function ancestors()
    {
        return static::where('lb', '<', $this->lb)
            ->where('rb', '>', $this->rb)
            ->where('status', self::STATUS_ACTIVE)
            ->orderBy('lb')
            ->get();
    }

    /**
     * Get siblings (same parent and level)
     */
    public function siblings()
    {
        $parent = $this->parent();

        if ($parent) {
            return static::where('lb', '>', $parent->lb)
                ->where('rb', '<', $parent->rb)
                ->where('level', $this->level)
                ->where('id', '!=', $this->id)
                ->where('status', self::STATUS_ACTIVE)
                ->orderBy('lb')
                ->get();
        }

        return static::where('level', $this->level)
            ->where('id', '!=', $this->id)
            ->where('status', self::STATUS_ACTIVE)
            ->orderBy('lb')
            ->get();
    }

    /**
     * Check if this menu has children
     */
    public function hasChildren(): bool
    {
        return ($this->rb - $this->lb) > 1;
    }

    /**
     * Get depth of this node (how many descendants)
     */
    public function getDepth(): int
    {
        if (!$this->hasChildren()) {
            return 0;
        }

        return static::where('lb', '>', $this->lb)
            ->where('rb', '<', $this->rb)
            ->where('status', self::STATUS_ACTIVE)
            ->max('level') - $this->level;
    }

    /**
     * Check if node can be moved (based on depth and target level)
     */
    public function canMoveTo(?self $target, string $position = 'child'): bool
    {
        if (!$target) {
            return false;
        }

        // Cannot move to itself
        if ($target->id === $this->id) {
            return false;
        }

        // Cannot move to a descendant
        if ($target->lb > $this->lb && $target->rb < $this->rb) {
            return false;
        }

        $depth = $this->getDepth();

        if ($position === 'child') {
            // Moving as child
            $newLevel = $target->level + 1;

            // Check max level constraint
            if ($newLevel + $depth > self::MAX_LEVEL) {
                return false;
            }
        } else {
            // Moving as sibling (prev/next)
            $newLevel = $target->level;

            // Check max level constraint
            if ($newLevel + $depth > self::MAX_LEVEL) {
                return false;
            }
        }

        return true;
    }

    /**
     * Scope to get only active menus
     */
    public function scopeActive($query)
    {
        return $query->where('status', self::STATUS_ACTIVE);
    }

    /**
     * Scope to get only deleted menus
     */
    public function scopeDeleted($query)
    {
        return $query->where('status', self::STATUS_DELETE);
    }

    /**
     * Scope to get system menus
     */
    public function scopeSystem($query)
    {
        return $query->where('type', self::TYPE_SYSTEM);
    }

    /**
     * Scope to get user menus
     */
    public function scopeUser($query)
    {
        return $query->where('type', self::TYPE_USER);
    }

    /**
     * Scope to get root level menus
     */
    public function scopeRoot($query)
    {
        return $query->where('level', 1);
    }

    /**
     * Scope to get menus by level
     */
    public function scopeByLevel($query, int $level)
    {
        return $query->where('level', $level);
    }

    /**
     * Get menu tree structure
     */
    public static function getTree(string $lang = 'en')
    {
        return static::with(['translations' => function ($query) use ($lang) {
            $query->where('lang', $lang);
        }])
        ->active()
        ->orderBy('lb')
        ->get();
    }

    /**
     * Soft delete by marking as DELETE status
     */
    public function softDelete(): bool
    {
        $this->status = self::STATUS_DELETE;
        return $this->save();
    }

    /**
     * Restore from soft delete
     */
    public function restore(): bool
    {
        $this->status = self::STATUS_ACTIVE;
        return $this->save();
    }
}
