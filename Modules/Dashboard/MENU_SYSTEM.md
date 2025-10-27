# Menu System Documentation

## Overview

The Dashboard module includes a complete **hierarchical menu management system** using the **Nested Set Model** (Modified Preorder Tree Traversal). This system allows for efficient tree operations and maintains menu hierarchy using left/right boundaries (lb/rb).

## Database Structure

### Table: t_system_menu

```sql
CREATE TABLE IF NOT EXISTS `t_system_menu` (
  `id` int(11) UNSIGNED NOT NULL AUTO_INCREMENT,
  `name` varchar(255) COLLATE utf8_bin NULL,         -- Unique identifier
  `menu` varchar(255) COLLATE utf8_bin NULL,         -- Menu name/label
  `module` varchar(255) COLLATE utf8_bin NULL,       -- Associated module
  `lb` int(11) unsigned NOT NULL DEFAULT '0',        -- Left boundary (nested set)
  `rb` int(11) unsigned NOT NULL DEFAULT '0',        -- Right boundary (nested set)
  `level` int(11) unsigned NOT NULL DEFAULT '0',     -- Depth level (1-4)
  `status` enum('ACTIVE','DELETE') NOT NULL DEFAULT 'ACTIVE',
  `type` enum('SYSTEM','USER') NOT NULL DEFAULT 'SYSTEM',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT NULL,
 PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_bin;
```

### Table: t_system_menu_i18n

```sql
CREATE TABLE IF NOT EXISTS `t_system_menu_i18n` (
    `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
    `menu_id` int(11) unsigned NOT NULL,
    `lang` varchar(2) NOT NULL default '',          -- Language code (en, fr, etc.)
    `value` varchar(255) COLLATE utf8_bin NOT NULL, -- Translated label
    `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` timestamp NULL DEFAULT NULL,
     PRIMARY KEY (`id`),
    UNIQUE KEY `unique` (`lang`,`menu_id`),
    FOREIGN KEY (`menu_id`) REFERENCES `t_system_menu` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_bin;
```

## Architecture

### Models

- **SystemMenu** (`Modules\Dashboard\Entities\SystemMenu`)
  - Main menu model with nested set support
  - Provides tree navigation methods (children, parent, ancestors, descendants)
  - Handles validation and constraints

- **SystemMenuI18n** (`Modules\Dashboard\Entities\SystemMenuI18n`)
  - Stores menu translations
  - One translation per language per menu

### Repository

- **MenuRepository** (`Modules\Dashboard\Repositories\MenuRepository`)
  - Handles complex nested set operations
  - Move operations (sibling, child)
  - Tree rebuilding
  - CRUD with transaction support

### Controllers

- **Admin\MenuController** - Tenant-specific menu management
- **Superadmin\MenuController** - Cross-tenant menu management

## API Endpoints

### Admin Routes (Tenant Database)

Base: `/api/admin/menus`

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/tree` | Get full menu tree |
| GET | `/` | Get paginated menu list |
| GET | `/{id}` | Get single menu details |
| GET | `/{id}/children` | Get direct children of menu |
| GET | `/by-name/{name}` | Get menu by unique name |
| POST | `/` | Create new menu |
| PUT | `/{id}` | Update menu |
| POST | `/{id}/move` | Move menu to new position |
| DELETE | `/{id}` | Soft delete menu |
| DELETE | `/{id}/hard` | Permanently delete menu |
| POST | `/rebuild` | Rebuild tree structure |

### Superadmin Routes (Central Database)

Base: `/api/superadmin/menus`

Same endpoints as Admin, plus:

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/metadata` | Get menu types, statuses, modules |

## Usage Examples

### 1. Get Menu Tree

```http
GET /api/admin/menus/tree?lang=en
Authorization: Bearer {token}
X-Tenant-ID: 1
```

Response:
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "dashboard",
      "menu": "Dashboard",
      "module": "dashboard",
      "lb": 1,
      "rb": 10,
      "level": 1,
      "status": "ACTIVE",
      "type": "SYSTEM",
      "translations": [
        {
          "id": 1,
          "menu_id": 1,
          "lang": "en",
          "value": "Dashboard"
        }
      ]
    }
  ]
}
```

### 2. Create Root Menu

```http
POST /api/admin/menus
Authorization: Bearer {token}
X-Tenant-ID: 1
Content-Type: application/json

{
  "name": "users",
  "menu": "Users",
  "module": "users",
  "status": "ACTIVE",
  "type": "SYSTEM",
  "translations": {
    "en": "Users",
    "fr": "Utilisateurs"
  }
}
```

### 3. Create Child Menu

```http
POST /api/admin/menus
Authorization: Bearer {token}
X-Tenant-ID: 1
Content-Type: application/json

{
  "name": "users_list",
  "menu": "User List",
  "module": "users",
  "parent_id": 2,
  "translations": {
    "en": "User List",
    "fr": "Liste des utilisateurs"
  }
}
```

### 4. Move Menu

Move menu as previous sibling of target:

```http
POST /api/admin/menus/5/move
Authorization: Bearer {token}
X-Tenant-ID: 1
Content-Type: application/json

{
  "target_id": 3,
  "position": "prev_sibling"
}
```

Move menu as first child of target:

```http
POST /api/admin/menus/5/move
Authorization: Bearer {token}
X-Tenant-ID: 1
Content-Type: application/json

{
  "target_id": 2,
  "position": "first_child"
}
```

Available positions:
- `prev_sibling` - Insert before target (same level)
- `first_child` - Insert as first child of target

### 5. Update Menu

```http
PUT /api/admin/menus/3
Authorization: Bearer {token}
X-Tenant-ID: 1
Content-Type: application/json

{
  "menu": "Updated Menu Name",
  "translations": {
    "en": "Updated Menu",
    "fr": "Menu mis à jour"
  }
}
```

### 6. Get Children

```http
GET /api/admin/menus/2/children?lang=fr
Authorization: Bearer {token}
X-Tenant-ID: 1
```

### 7. Paginated List with Filters

```http
GET /api/admin/menus?per_page=20&lang=en&level=1&type=SYSTEM&search=user
Authorization: Bearer {token}
X-Tenant-ID: 1
```

Query parameters:
- `per_page` - Items per page (default: 20)
- `lang` - Language for translations (default: en)
- `level` - Filter by level (1-4)
- `type` - Filter by type (SYSTEM/USER)
- `module` - Filter by module name
- `search` - Search in name/menu fields

### 8. Delete Menu

Soft delete (marks as DELETE):
```http
DELETE /api/admin/menus/5
Authorization: Bearer {token}
X-Tenant-ID: 1
```

Hard delete (permanent):
```http
DELETE /api/admin/menus/5/hard
Authorization: Bearer {token}
X-Tenant-ID: 1
```

### 9. Rebuild Tree

Use this if the tree structure becomes corrupted:

```http
POST /api/admin/menus/rebuild
Authorization: Bearer {token}
X-Tenant-ID: 1
```

## Model Usage in Code

### Get Menu Tree

```php
use Modules\Dashboard\Entities\SystemMenu;

// Get all menus ordered by nested set
$tree = SystemMenu::getTree('en');

// Get active menus only
$activeMenus = SystemMenu::active()->orderBy('lb')->get();

// Get root level menus
$rootMenus = SystemMenu::root()->active()->orderBy('lb')->get();
```

### Navigate Tree

```php
$menu = SystemMenu::find(5);

// Get parent
$parent = $menu->parent();

// Get children (direct descendants)
$children = $menu->children();

// Get all descendants
$descendants = $menu->descendants();

// Get ancestors (path to root)
$ancestors = $menu->ancestors();

// Get root parent
$root = $menu->rootParent();

// Get siblings
$siblings = $menu->siblings();

// Check if has children
if ($menu->hasChildren()) {
    // ...
}

// Get depth (number of descendant levels)
$depth = $menu->getDepth();
```

### Working with Translations

```php
$menu = SystemMenu::with('translations')->find(1);

// Get translation for specific language
$translation = $menu->translation('fr');

// Get or create translation
$translation = $menu->getTranslation('fr');
$translation->value = 'Nouveau nom';
$translation->save();

// Get all translations
foreach ($menu->translations as $trans) {
    echo "{$trans->lang}: {$trans->value}\n";
}
```

### Using Repository

```php
use Modules\Dashboard\Repositories\MenuRepository;

$repo = new MenuRepository();

// Create root menu
$menu = $repo->createRoot([
    'name' => 'settings',
    'menu' => 'Settings',
    'module' => 'settings',
], [
    'en' => 'Settings',
    'fr' => 'Paramètres'
]);

// Create child menu
$child = $repo->createAsLastChild($menu->id, [
    'name' => 'settings_general',
    'menu' => 'General Settings',
], [
    'en' => 'General Settings',
    'fr' => 'Paramètres généraux'
]);

// Move menu
$repo->moveAsPrevSibling($childId, $targetId);
$repo->moveAsFirstChild($childId, $parentId);

// Update menu
$repo->update($menuId, [
    'menu' => 'New Name'
], [
    'en' => 'New Name',
    'fr' => 'Nouveau nom'
]);

// Delete (soft)
$repo->delete($menuId);

// Hard delete
$repo->hardDelete($menuId);

// Rebuild tree
$repo->rebuildTree();
```

## Nested Set Model Explained

The nested set model uses `lb` (left boundary) and `rb` (right boundary) to represent tree hierarchy:

```
Dashboard (lb=1, rb=10, level=1)
  ├── Users (lb=2, rb=5, level=2)
  │   └── User List (lb=3, rb=4, level=3)
  └── Settings (lb=6, rb=9, level=2)
      └── General (lb=7, rb=8, level=3)
```

### Advantages

- Fast subtree queries (all descendants in one query)
- Efficient hierarchy validation
- Simple depth calculation
- No recursive queries needed

### Constraints

- Maximum 4 levels (configurable in `SystemMenu::MAX_LEVEL`)
- Move operations require transaction
- Inserting/deleting requires updating multiple nodes

## Validation Rules

### Level Constraints

- Root menus: level = 1
- Maximum level: 4
- Cannot move if resulting level exceeds maximum

### Move Constraints

- Cannot move to self
- Cannot move to own descendant
- Cannot exceed maximum depth with subtree

### Status

- `ACTIVE` - Menu is visible and usable
- `DELETE` - Soft deleted (can be restored)

### Type

- `SYSTEM` - System-defined menu (core functionality)
- `USER` - User-defined menu (custom)

## Error Handling

All API endpoints return consistent error format:

```json
{
  "success": false,
  "message": "Error description",
  "error": "Detailed error message"
}
```

Common HTTP status codes:
- 200 - Success
- 201 - Created
- 404 - Menu not found
- 422 - Validation error
- 500 - Server error

## Performance Considerations

1. **Indexing**: Ensure `lb`, `rb`, and `level` are indexed
2. **Transactions**: All tree modifications use transactions
3. **Eager Loading**: Load translations with `with('translations')`
4. **Caching**: Consider caching menu tree for better performance

## Migration from Symfony

The system is designed to work with existing `t_system_menu` and `t_system_menu_i18n` tables from Symfony 1. No migration needed - just use the Laravel models with existing data.

## Testing

Test the menu system:

```bash
# Test menu creation
POST /api/admin/menus

# Verify tree structure
GET /api/admin/menus/tree

# Test moving
POST /api/admin/menus/{id}/move

# Verify integrity
GET /api/admin/menus
```

## Troubleshooting

### Tree Structure Corrupted

If lb/rb values become inconsistent:

```http
POST /api/admin/menus/rebuild
```

This will recalculate all lb/rb values based on parent-child relationships.

### Cannot Move Menu

Check:
1. Target exists and is valid
2. Would not exceed maximum level
3. Not trying to move to self or descendant
4. User has permission

### Translations Not Appearing

Ensure:
1. Translation exists for requested language
2. Using correct `lang` parameter
3. Translations are eager loaded: `with('translations')`
