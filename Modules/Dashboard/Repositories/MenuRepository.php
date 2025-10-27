<?php

namespace Modules\Dashboard\Repositories;

use Modules\Dashboard\Entities\SystemMenu;
use Modules\Dashboard\Entities\SystemMenuI18n;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Collection;

/**
 * Menu Repository - Handles Nested Set operations
 *
 * This repository manages the nested set model for menus,
 * handling complex operations like moving, inserting, and deleting
 * while maintaining the lb/rb integrity.
 */
class MenuRepository
{
    /**
     * Get menu tree structure with translations
     */
    public function getTree(string $lang = 'en', ?int $parentId = null): Collection
    {
        $query = SystemMenu::with(['translations' => function ($query) use ($lang) {
            $query->where('lang', $lang);
        }])
        ->active()
        ->orderBy('lb');

        if ($parentId) {
            $parent = SystemMenu::find($parentId);
            if ($parent) {
                $query->where('lb', '>', $parent->lb)
                      ->where('rb', '<', $parent->rb);
            }
        }

        return $query->get();
    }

    /**
     * Get children of a menu item
     */
    public function getChildren(int $menuId, string $lang = 'en'): Collection
    {
        $menu = SystemMenu::find($menuId);

        if (!$menu) {
            return collect([]);
        }

        return SystemMenu::with(['translations' => function ($query) use ($lang) {
            $query->where('lang', $lang);
        }])
        ->where('lb', '>', $menu->lb)
        ->where('rb', '<', $menu->rb)
        ->where('level', $menu->level + 1)
        ->active()
        ->orderBy('lb')
        ->get();
    }

    /**
     * Create a new menu as root
     */
    public function createRoot(array $data, array $translations = []): SystemMenu
    {
        return DB::transaction(function () use ($data, $translations) {
            // Find max rb to append at the end
            $maxRb = SystemMenu::max('rb') ?? 0;

            $menu = SystemMenu::create([
                'name' => $data['name'] ?? null,
                'menu' => $data['menu'] ?? null,
                'module' => $data['module'] ?? null,
                'lb' => $maxRb + 1,
                'rb' => $maxRb + 2,
                'level' => 1,
                'status' => $data['status'] ?? SystemMenu::STATUS_ACTIVE,
                'type' => $data['type'] ?? SystemMenu::TYPE_SYSTEM,
            ]);

            // Create translations
            foreach ($translations as $lang => $value) {
                SystemMenuI18n::create([
                    'menu_id' => $menu->id,
                    'lang' => $lang,
                    'value' => $value,
                ]);
            }

            return $menu->fresh('translations');
        });
    }

    /**
     * Create a new menu as last child of parent
     */
    public function createAsLastChild(int $parentId, array $data, array $translations = []): SystemMenu
    {
        return DB::transaction(function () use ($parentId, $data, $translations) {
            $parent = SystemMenu::findOrFail($parentId);

            // Check level constraint
            if ($parent->level >= SystemMenu::MAX_LEVEL) {
                throw new \Exception("Cannot add child: maximum level reached");
            }

            $newLb = $parent->rb;
            $newRb = $parent->rb + 1;

            // Make space for new node
            SystemMenu::where('rb', '>=', $parent->rb)->increment('rb', 2);
            SystemMenu::where('lb', '>', $parent->rb)->increment('lb', 2);

            $menu = SystemMenu::create([
                'name' => $data['name'] ?? null,
                'menu' => $data['menu'] ?? null,
                'module' => $data['module'] ?? null,
                'lb' => $newLb,
                'rb' => $newRb,
                'level' => $parent->level + 1,
                'status' => $data['status'] ?? SystemMenu::STATUS_ACTIVE,
                'type' => $data['type'] ?? SystemMenu::TYPE_SYSTEM,
            ]);

            // Create translations
            foreach ($translations as $lang => $value) {
                SystemMenuI18n::create([
                    'menu_id' => $menu->id,
                    'lang' => $lang,
                    'value' => $value,
                ]);
            }

            return $menu->fresh('translations');
        });
    }

    /**
     * Move menu as previous sibling of target
     */
    public function moveAsPrevSibling(int $menuId, int $targetId): SystemMenu
    {
        return DB::transaction(function () use ($menuId, $targetId) {
            $menu = SystemMenu::findOrFail($menuId);
            $target = SystemMenu::findOrFail($targetId);

            if (!$menu->canMoveTo($target, 'sibling')) {
                throw new \Exception("Cannot move menu to this position");
            }

            $width = $menu->rb - $menu->lb + 1;
            $distance = $target->lb - $menu->lb;
            $levelDiff = $target->level - $menu->level;

            // Moving forward or backward?
            if ($distance > 0) {
                // Moving forward
                $this->moveSubtreeForward($menu, $target->lb, $width, $levelDiff);
            } else {
                // Moving backward
                $this->moveSubtreeBackward($menu, $target->lb, $width, $levelDiff);
            }

            return $menu->fresh('translations');
        });
    }

    /**
     * Move menu as first child of target
     */
    public function moveAsFirstChild(int $menuId, int $targetId): SystemMenu
    {
        return DB::transaction(function () use ($menuId, $targetId) {
            $menu = SystemMenu::findOrFail($menuId);
            $target = SystemMenu::findOrFail($targetId);

            if (!$menu->canMoveTo($target, 'child')) {
                throw new \Exception("Cannot move menu to this position");
            }

            $width = $menu->rb - $menu->lb + 1;
            $newPosition = $target->lb + 1;
            $distance = $newPosition - $menu->lb;
            $levelDiff = ($target->level + 1) - $menu->level;

            if ($distance > 0) {
                $this->moveSubtreeForward($menu, $newPosition, $width, $levelDiff);
            } else {
                $this->moveSubtreeBackward($menu, $newPosition, $width, $levelDiff);
            }

            return $menu->fresh('translations');
        });
    }

    /**
     * Move subtree forward in the tree
     */
    protected function moveSubtreeForward(SystemMenu $menu, int $newPosition, int $width, int $levelDiff): void
    {
        $tmpLb = $menu->lb;
        $tmpRb = $menu->rb;

        // Step 1: Make negative to temporarily remove from tree
        SystemMenu::where('lb', '>=', $tmpLb)
            ->where('rb', '<=', $tmpRb)
            ->update([
                'lb' => DB::raw("lb * -1"),
                'rb' => DB::raw("rb * -1"),
                'level' => DB::raw("level + {$levelDiff}")
            ]);

        // Step 2: Close the gap left by moved nodes
        SystemMenu::where('lb', '>', $tmpRb)
            ->update(['lb' => DB::raw("lb - {$width}")]);

        SystemMenu::where('rb', '>', $tmpRb)
            ->update(['rb' => DB::raw("rb - {$width}")]);

        // Step 3: Make space at new position
        $adjustedPosition = $newPosition > $tmpLb ? $newPosition - $width : $newPosition;

        SystemMenu::where('lb', '>=', $adjustedPosition)
            ->where('lb', '>', 0)
            ->update(['lb' => DB::raw("lb + {$width}")]);

        SystemMenu::where('rb', '>=', $adjustedPosition)
            ->where('rb', '>', 0)
            ->update(['rb' => DB::raw("rb + {$width}")]);

        // Step 4: Move nodes to new position (make positive again)
        $offset = $adjustedPosition - $tmpLb;
        SystemMenu::where('lb', '<', 0)
            ->update([
                'lb' => DB::raw("(lb * -1) + {$offset}"),
                'rb' => DB::raw("(rb * -1) + {$offset}")
            ]);
    }

    /**
     * Move subtree backward in the tree
     */
    protected function moveSubtreeBackward(SystemMenu $menu, int $newPosition, int $width, int $levelDiff): void
    {
        $tmpLb = $menu->lb;
        $tmpRb = $menu->rb;

        // Step 1: Make space at new position first
        SystemMenu::where('lb', '>=', $newPosition)
            ->where('lb', '<', $tmpLb)
            ->update(['lb' => DB::raw("lb + {$width}")]);

        SystemMenu::where('rb', '>=', $newPosition)
            ->where('rb', '<', $tmpLb)
            ->update(['rb' => DB::raw("rb + {$width}")]);

        // Step 2: Move subtree to new position
        $offset = $newPosition - $tmpLb;
        SystemMenu::where('lb', '>=', $tmpLb)
            ->where('rb', '<=', $tmpRb)
            ->update([
                'lb' => DB::raw("lb + {$offset}"),
                'rb' => DB::raw("rb + {$offset}"),
                'level' => DB::raw("level + {$levelDiff}")
            ]);

        // Step 3: Close the gap
        SystemMenu::where('lb', '>', $tmpRb + $offset)
            ->update(['lb' => DB::raw("lb - {$width}")]);

        SystemMenu::where('rb', '>', $tmpRb + $offset)
            ->update(['rb' => DB::raw("rb - {$width}")]);
    }

    /**
     * Update menu data and translations
     */
    public function update(int $menuId, array $data, array $translations = []): SystemMenu
    {
        return DB::transaction(function () use ($menuId, $data, $translations) {
            $menu = SystemMenu::findOrFail($menuId);

            // Update menu data
            $updateData = [];
            if (isset($data['name'])) $updateData['name'] = $data['name'];
            if (isset($data['menu'])) $updateData['menu'] = $data['menu'];
            if (isset($data['module'])) $updateData['module'] = $data['module'];
            if (isset($data['status'])) $updateData['status'] = $data['status'];
            if (isset($data['type'])) $updateData['type'] = $data['type'];

            if (!empty($updateData)) {
                $menu->update($updateData);
            }

            // Update or create translations
            foreach ($translations as $lang => $value) {
                SystemMenuI18n::updateOrCreate(
                    ['menu_id' => $menuId, 'lang' => $lang],
                    ['value' => $value]
                );
            }

            return $menu->fresh('translations');
        });
    }

    /**
     * Delete menu and all its descendants
     * Soft delete by marking as DELETE status
     */
    public function delete(int $menuId): bool
    {
        return DB::transaction(function () use ($menuId) {
            $menu = SystemMenu::findOrFail($menuId);

            // Mark menu and all descendants as deleted
            SystemMenu::where('lb', '>=', $menu->lb)
                ->where('rb', '<=', $menu->rb)
                ->update(['status' => SystemMenu::STATUS_DELETE]);

            return true;
        });
    }

    /**
     * Hard delete menu and remove from tree structure
     */
    public function hardDelete(int $menuId): bool
    {
        return DB::transaction(function () use ($menuId) {
            $menu = SystemMenu::findOrFail($menuId);

            $width = $menu->rb - $menu->lb + 1;

            // Delete menu and descendants
            SystemMenu::where('lb', '>=', $menu->lb)
                ->where('rb', '<=', $menu->rb)
                ->delete();

            // Close the gap
            SystemMenu::where('lb', '>', $menu->rb)
                ->update(['lb' => DB::raw("lb - {$width}")]);

            SystemMenu::where('rb', '>', $menu->rb)
                ->update(['rb' => DB::raw("rb - {$width}")]);

            return true;
        });
    }

    /**
     * Rebuild tree (recalculate lb/rb) - use if tree is corrupted
     */
    public function rebuildTree(): void
    {
        DB::transaction(function () {
            $counter = 0;
            $this->rebuildNode(null, $counter);
        });
    }

    /**
     * Recursively rebuild node and its children
     */
    protected function rebuildNode(?int $parentId, int &$counter, int $level = 1): void
    {
        $children = SystemMenu::where(function ($query) use ($parentId) {
            if ($parentId === null) {
                $query->where('level', 1);
            } else {
                $parent = SystemMenu::find($parentId);
                if ($parent) {
                    $query->where('lb', '>', $parent->lb)
                         ->where('rb', '<', $parent->rb)
                         ->where('level', $parent->level + 1);
                }
            }
        })
        ->orderBy('id')
        ->get();

        foreach ($children as $child) {
            $lb = ++$counter;

            // Recursively rebuild children
            if ($child->hasChildren()) {
                $this->rebuildNode($child->id, $counter, $level + 1);
            }

            $rb = ++$counter;

            // Update node
            SystemMenu::where('id', $child->id)->update([
                'lb' => $lb,
                'rb' => $rb,
                'level' => $level
            ]);
        }
    }

    /**
     * Get menu by name
     */
    public function findByName(string $name): ?SystemMenu
    {
        return SystemMenu::where('name', $name)->first();
    }

    /**
     * Get paginated menu list with translations
     */
    public function getPaginated(int $perPage = 20, string $lang = 'en', array $filters = [])
    {
        $query = SystemMenu::with(['translations' => function ($query) use ($lang) {
            $query->where('lang', $lang);
        }])->active();

        // Apply filters
        if (isset($filters['level'])) {
            $query->where('level', $filters['level']);
        }

        if (isset($filters['type'])) {
            $query->where('type', $filters['type']);
        }

        if (isset($filters['module'])) {
            $query->where('module', $filters['module']);
        }

        if (isset($filters['search'])) {
            $search = $filters['search'];
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('menu', 'like', "%{$search}%");
            });
        }

        return $query->orderBy('lb')->paginate($perPage);
    }
}
