<?php

/**
 * Classe de compatibilité pour importDatabase de Symfony 1
 *
 * Cette classe reproduit l'interface de l'ancienne classe importDatabase
 * utilisée dans les actions de mise à jour legacy.
 *
 * Les classes d'action legacy utilisent:
 * $importDB = importDatabase::getInstance();
 * $importDB->import($file, $site);
 */

use App\Models\Tenant;
use Modules\Superadmin\Services\Legacy\LegacySqlImporter;

if (!class_exists('importDatabase', false)) {

    class importDatabase
    {
        private static ?importDatabase $instance = null;
        private LegacySqlImporter $importer;

        private function __construct()
        {
            $this->importer = LegacySqlImporter::getInstance();
        }

        /**
         * Retourne l'instance singleton (pattern Symfony 1)
         */
        public static function getInstance(): self
        {
            if (self::$instance === null) {
                self::$instance = new self();
            }
            return self::$instance;
        }

        /**
         * Importe un fichier SQL
         *
         * Compatible avec l'ancienne signature: import($file, $site)
         * où $site peut être un Tenant Laravel ou les anciennes données Symfony
         *
         * @param string $file Chemin vers le fichier SQL
         * @param mixed $site Tenant ou données du site
         * @return bool
         */
        public function import(string $file, $site): bool
        {
            \Illuminate\Support\Facades\Log::info("importDatabase::import called", [
                'file' => $file,
                'site_type' => is_object($site) ? get_class($site) : gettype($site),
                'file_exists' => file_exists($file),
                'file_readable' => is_readable($file),
            ]);

            // Convertir $site en Tenant si nécessaire
            $tenant = $this->resolveTenant($site);

            if (!$tenant) {
                \Illuminate\Support\Facades\Log::error("importDatabase::import - Cannot resolve tenant", [
                    'site_type' => is_object($site) ? get_class($site) : gettype($site),
                    'site_data' => is_object($site) ? (property_exists($site, 'site_id') ? $site->site_id : 'no site_id') : $site,
                ]);
                throw new \RuntimeException("Cannot resolve tenant from site parameter");
            }

            \Illuminate\Support\Facades\Log::info("importDatabase::import - Tenant resolved", [
                'tenant_id' => $tenant->site_id,
                'tenant_db' => $tenant->site_db_name ?? 'unknown',
            ]);

            try {
                $result = $this->importer->import($file, $tenant);
                \Illuminate\Support\Facades\Log::info("importDatabase::import completed", [
                    'success' => $result['success'],
                    'statements' => $result['statements'] ?? 0,
                ]);
                return $result['success'];
            } catch (\Exception $e) {
                // Log l'erreur mais laisse l'exception se propager
                \Illuminate\Support\Facades\Log::error("importDatabase::import failed", [
                    'file' => $file,
                    'error' => $e->getMessage(),
                    'trace' => $e->getTraceAsString(),
                ]);
                throw $e;
            }
        }

        /**
         * Résout un Tenant à partir du paramètre $site
         */
        private function resolveTenant($site): ?Tenant
        {
            if ($site instanceof Tenant) {
                return $site;
            }

            // Si c'est un ID, charger le tenant
            if (is_numeric($site)) {
                return Tenant::find($site);
            }

            // Si c'est un objet avec site_id (ancien format Symfony)
            if (is_object($site) && isset($site->site_id)) {
                return Tenant::find($site->site_id);
            }

            // Si c'est un array avec site_id
            if (is_array($site) && isset($site['site_id'])) {
                return Tenant::find($site['site_id']);
            }

            return null;
        }

        /**
         * Reset l'instance singleton (pour les tests)
         */
        public static function resetInstance(): void
        {
            self::$instance = null;
        }
    }
}
