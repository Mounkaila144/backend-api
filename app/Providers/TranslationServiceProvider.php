<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use Illuminate\Translation\FileLoader;
use Illuminate\Translation\Translator;
use Illuminate\Filesystem\Filesystem;

class TranslationServiceProvider extends ServiceProvider
{
    /**
     * Register services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap services.
     */
    public function boot(): void
    {
        // Replace the default translation loader with our custom one
        $this->app->singleton('translation.loader', function ($app) {
            return new ModularFileLoader($app['files'], $app['path.lang']);
        });

        // Force reload translator with new loader
        $this->app->singleton('translator', function ($app) {
            $loader = $app['translation.loader'];
            $locale = $app['config']['app.locale'];

            $trans = new Translator($loader, $locale);
            $trans->setFallback($app['config']['app.fallback_locale']);

            return $trans;
        });

        // Load global translations (PHP files)
        $this->loadTranslationsFrom(base_path('lang'), 'global');

        // Load module translations (PHP files)
        $this->loadModuleTranslations();

        // Register JSON paths: Global first, then modules (modules override global)
        $this->registerJsonPaths();
    }

    /**
     * Load translations for all modules with fallback to global.
     */
    protected function loadModuleTranslations(): void
    {
        $modulesPath = base_path('Modules');

        if (!is_dir($modulesPath)) {
            return;
        }

        $modules = array_filter(glob($modulesPath . '/*'), 'is_dir');

        foreach ($modules as $modulePath) {
            $moduleName = basename($modulePath);
            $langPath = $modulePath . '/Resources/lang';

            if (is_dir($langPath)) {
                // Register module translations with module namespace
                $this->loadTranslationsFrom($langPath, strtolower($moduleName));
            }
        }
    }

    /**
     * Register JSON translation paths.
     * Order matters: Global first, then modules (modules override global).
     */
    protected function registerJsonPaths(): void
    {
        $loader = $this->app['translation.loader'];

        // 1. Register global JSON path first (lowest priority)
        $loader->addJsonPath(base_path('lang'));

        // 2. Register module JSON paths (highest priority - will override global)
        $modulesPath = base_path('Modules');

        if (!is_dir($modulesPath)) {
            return;
        }

        $modules = array_filter(glob($modulesPath . '/*'), 'is_dir');

        foreach ($modules as $modulePath) {
            $langPath = $modulePath . '/Resources/lang';

            if (is_dir($langPath)) {
                // Add module JSON path - will override global
                $loader->addJsonPath($langPath);
            }
        }
    }
}

/**
 * Custom File Loader that implements fallback mechanism
 * Module translations take priority over global translations
 * Also supports JSON translations with fallback from global to module
 */
class ModularFileLoader extends FileLoader
{
    /**
     * Load a namespaced translation group with fallback to global.
     *
     * @param  string  $locale
     * @param  string  $group
     * @param  string  $namespace
     * @return array
     */
    protected function loadNamespaced($locale, $group, $namespace)
    {
        // Start with global translations as fallback
        $translations = $this->loadPaths($this->paths, $locale, $group);

        // Then load module-specific translations
        if (isset($this->hints[$namespace])) {
            $lines = $this->loadPaths([$this->hints[$namespace]], $locale, $group);

            // Merge module translations (module overrides global)
            $translations = array_replace_recursive($translations, $lines);

            // Load namespace overrides (from lang/vendor/{namespace}/{locale}/{group}.php)
            return $this->loadNamespaceOverrides($translations, $locale, $group, $namespace);
        }

        return $translations;
    }

    /**
     * Load JSON translations with fallback mechanism.
     * Module translations take PRIORITY over global translations.
     *
     * @param  string  $locale
     * @return array
     */
    protected function loadJsonPaths($locale)
    {
        $translations = [];

        // 1. First load GLOBAL JSON translations (lowest priority)
        $globalPath = base_path('lang');
        $globalFile = "{$globalPath}/{$locale}.json";

        if ($this->files->exists($globalFile)) {
            $decoded = json_decode($this->files->get($globalFile), true);

            if (is_null($decoded) || json_last_error() !== JSON_ERROR_NONE) {
                throw new \RuntimeException("Translation file [{$globalFile}] contains an invalid JSON structure.");
            }

            $translations = $decoded;
        }

        // 2. Then load MODULE-SPECIFIC JSON translations (highest priority - override global)
        $modulesPath = base_path('Modules');

        if (is_dir($modulesPath)) {
            $modules = array_filter(glob($modulesPath . '/*'), 'is_dir');

            foreach ($modules as $modulePath) {
                $moduleJsonFile = $modulePath . '/Resources/lang/' . $locale . '.json';

                if ($this->files->exists($moduleJsonFile)) {
                    $decoded = json_decode($this->files->get($moduleJsonFile), true);

                    if (is_null($decoded) || json_last_error() !== JSON_ERROR_NONE) {
                        throw new \RuntimeException("Translation file [{$moduleJsonFile}] contains an invalid JSON structure.");
                    }

                    // Merge with modules overriding global
                    $translations = array_merge($translations, $decoded);
                }
            }
        }

        return $translations;
    }
}
