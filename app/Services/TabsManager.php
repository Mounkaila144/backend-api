<?php

namespace App\Services;

use Illuminate\Support\Facades\File;
use Nwidart\Modules\Facades\Module;

/**
 * TabsManager - Collects and serves tab configurations from all ENABLED Laravel modules
 *
 * Reproduces the Symfony TabsManager pattern:
 * - Each Laravel module registers tabs via its own Config/tabs.php
 * - Only ENABLED modules' tabs are loaded (like Symfony only loads installed modules)
 * - Tabs are grouped by namespace (e.g., 'dashboard-site-customers-contract-view')
 * - Tabs are sorted by key (numeric prefix for ordering)
 * - Tabs are filtered by user credentials at runtime
 */
class TabsManager
{
    protected static array $instances = [];

    protected string $namespace;
    protected array $tabs = [];
    protected bool $loaded = false;

    protected function __construct(string $namespace)
    {
        $this->namespace = $namespace;
    }

    public static function getInstance(string $namespace): self
    {
        if (!isset(static::$instances[$namespace])) {
            $instance = new static($namespace);
            $instance->loadTabs();
            static::$instances[$namespace] = $instance;
        }

        return static::$instances[$namespace];
    }

    public static function clearInstances(): void
    {
        static::$instances = [];
    }

    /**
     * Load tabs only from ENABLED Laravel modules' Config/tabs.php files.
     * Disabled modules' tabs are never loaded, just like Symfony.
     */
    protected function loadTabs(): void
    {
        if ($this->loaded) {
            return;
        }

        $allModules = Module::all();

        foreach ($allModules as $module) {
            // Only load tabs from enabled modules
            if (!$module->isEnabled()) {
                continue;
            }

            $tabsFile = $module->getPath() . '/Config/tabs.php';

            if (!File::exists($tabsFile)) {
                continue;
            }

            $tabsConfig = require $tabsFile;

            if (!is_array($tabsConfig) || !isset($tabsConfig[$this->namespace])) {
                continue;
            }

            if (is_array($tabsConfig[$this->namespace])) {
                $this->tabs = array_merge($this->tabs, $tabsConfig[$this->namespace]);
            }
        }

        $this->loaded = true;
    }

    public function getTabs(): array
    {
        return $this->tabs;
    }

    public function getSortedTabs(): array
    {
        $tabs = $this->tabs;
        uksort($tabs, function ($a, $b) {
            return strnatcasecmp($a, $b);
        });

        return $tabs;
    }

    public function getComponents(): array
    {
        return array_filter($this->tabs, function ($tab) {
            return !empty($tab['component']);
        });
    }

    /**
     * Get tabs filtered by user credentials.
     * Module activation is already handled by loadTabs() (only enabled modules).
     */
    public function getTabsForUser($user): array
    {
        $sortedTabs = $this->getSortedTabs();

        return array_filter($sortedTabs, function ($tab) use ($user) {
            if (empty($tab['credentials'])) {
                return true;
            }

            return $user->hasCredential($tab['credentials']);
        });
    }

    public function toApiResponse($user): array
    {
        $filteredTabs = $this->getTabsForUser($user);
        $result = [];

        foreach ($filteredTabs as $key => $tab) {
            $result[] = [
                'key' => $key,
                'title' => $tab['title'] ?? '',
                'icon' => $tab['icon'] ?? null,
                'component' => $tab['component'] ?? null,
                'help' => $tab['help'] ?? null,
                'module' => $tab['module'] ?? null,
            ];
        }

        return $result;
    }
}
