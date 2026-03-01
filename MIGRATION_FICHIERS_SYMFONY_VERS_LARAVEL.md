# Guide de Migration des Fichiers - Symfony 1 vers Laravel

Ce document décrit la stratégie et les outils pour migrer les fichiers de l'ancien projet Symfony 1 vers le nouveau stockage S3/MinIO dans Laravel.

## Vue d'ensemble

### Structure de l'ancien système (Symfony 1)

```
C:\xampp\htdocs\project\
├── sites/
│   ├── site_theme32/
│   │   └── admin/
│   │       └── data/
│   │           ├── customers/
│   │           │   └── documents/
│   │           │       └── {customer_id}/
│   │           │           └── file.pdf
│   │           ├── customers_contracts/
│   │           │   └── documents/
│   │           │       └── {contract_id}/
│   │           │           └── contract.pdf
│   │           ├── users/
│   │           │   └── photos/
│   │           │       └── {user_id}/
│   │           │           └── profile.jpg
│   │           └── products/
│   │               └── images/
│   │                   └── {product_id}/
│   │                       └── image.png
│   ├── site_theme33/
│   │   └── admin/
│   │       └── data/
│   │           └── ...
│   └── ...
└── modules/
    └── ...
```

### Structure du nouveau système (Laravel + S3)

```
S3 Bucket/
├── tenants/
│   ├── 32/
│   │   ├── customers/
│   │   │   └── documents/
│   │   │       └── {customer_id}/
│   │   │           └── file.pdf
│   │   ├── contracts/
│   │   │   └── documents/
│   │   │       └── {contract_id}/
│   │   │           └── contract.pdf
│   │   ├── users/
│   │   │   └── photos/
│   │   │       └── {user_id}/
│   │   │           └── profile.jpg
│   │   └── products/
│   │       └── images/
│   │           └── {product_id}/
│   │               └── image.png
│   ├── 33/
│   │   └── ...
│   └── ...
```

## Configuration

### Variables d'environnement

Ajoutez ces variables dans votre fichier `.env`:

```env
# Chemin vers l'ancien projet Symfony 1
LEGACY_PROJECT_PATH=C:/xampp/htdocs/project

# Migration automatique lors de l'accès aux fichiers
MIGRATION_AUTO_MIGRATE=false

# Taille maximale des fichiers à migrer (en bytes)
MIGRATION_MAX_FILE_SIZE=104857600

# Nombre de fichiers par batch
MIGRATION_BATCH_SIZE=100
```

### Configuration avancée

Le fichier `config/migration.php` contient des options supplémentaires:

```php
return [
    // Mapping des sites personnalisés (si le nom ne suit pas site_themeN)
    'site_mapping' => [
        // 'site_custom_name' => 123,
    ],

    // Mapping des modules Symfony vers Laravel
    'module_mapping' => [
        'customers' => 'customers',
        'customers_contracts' => 'contracts',
        'customers_contracts_documents' => 'contracts',
        'users' => 'users',
        'products' => 'products',
    ],

    // Mapping des tables de base de données à mettre à jour
    'database_mappings' => [
        'customers' => [
            'table' => 't_customers_documents',
            'column' => 'file_path',
            'id_column' => 'customer_id',
        ],
        // ...
    ],

    // Patterns de fichiers à exclure
    'excluded_patterns' => [
        '*.tmp',
        '*.bak',
        '.gitkeep',
    ],
];
```

## Commandes Artisan

### Analyser les fichiers legacy

Avant de migrer, analysez les fichiers existants:

```bash
# Vue d'ensemble générale
php artisan legacy:analyze

# Analyser un site spécifique
php artisan legacy:analyze --site=site_theme32

# Analyser tous les sites
php artisan legacy:analyze --all

# Exporter le rapport en JSON
php artisan legacy:analyze --all --export=migration-report.json

# Spécifier un chemin legacy différent
php artisan legacy:analyze --site=site_theme32 --legacy-path=D:/backup/symfony-project
```

### Migrer les fichiers

```bash
# Prévisualiser la migration (dry-run)
php artisan migrate:files --site=site_theme32 --dry-run

# Migrer un site spécifique
php artisan migrate:files --site=site_theme32

# Migrer uniquement un module
php artisan migrate:files --site=site_theme32 --module=customers

# Migrer tous les sites
php artisan migrate:files --all

# Options supplémentaires
php artisan migrate:files --site=site_theme32 --overwrite  # Écraser les fichiers existants
php artisan migrate:files --site=site_theme32 --no-db      # Ne pas mettre à jour la base de données
```

## Services disponibles

### 1. LegacyPathMapper

Service de mapping des chemins entre Symfony et Laravel.

```php
use App\Services\Migration\LegacyPathMapper;

$mapper = app(LegacyPathMapper::class);

// Parser un chemin legacy
$info = $mapper->parseLegacyPath('sites/site_theme32/admin/data/customers/documents/123/file.pdf');
// Résultat:
// [
//     'site_name' => 'site_theme32',
//     'tenant_id' => 32,
//     'module' => 'customers',
//     'type' => 'documents',
//     'entity_id' => '123',
//     'filename' => 'file.pdf',
//     'new_path' => 'tenants/32/customers/documents/123/file.pdf',
//     'full_legacy_path' => 'C:/xampp/htdocs/project/sites/site_theme32/admin/data/customers/documents/123/file.pdf',
// ]

// Convertir un nouveau chemin vers l'ancien format
$legacyPath = $mapper->convertToLegacyPath('tenants/32/customers/documents/123/file.pdf');
// Résultat: 'sites/site_theme32/admin/data/customers/documents/123/file.pdf'

// Lister les sites disponibles
$sites = $mapper->listLegacySites();

// Générer un rapport de migration
$report = $mapper->generateMigrationReport('site_theme32');

// Compter les fichiers à migrer
$stats = $mapper->countFilesToMigrate('site_theme32');
```

### 2. FileMigrationService

Service de migration des fichiers vers S3.

```php
use App\Services\Migration\FileMigrationService;

$migrationService = app(FileMigrationService::class);

// Vérifier si S3 est disponible
if ($migrationService->isS3Available()) {
    // Migrer un site
    $report = $migrationService->migrateSite('site_theme32', [
        'dry_run' => false,
        'modules' => ['customers', 'users'], // null pour tous
        'update_db' => true,
        'overwrite' => false,
        'callback' => function ($progress) {
            echo "Processed: {$progress['processed']} / {$progress['total']}\n";
        },
    ]);
}

// Migrer un fichier unique
$result = $migrationService->migrateFile(
    'sites/site_theme32/admin/data/customers/documents/123/file.pdf',
    ['overwrite' => false]
);
```

### 3. LegacyFileResolver (Compatibilité)

Service de compatibilité pour résoudre les fichiers pendant la transition.

```php
use App\Services\Migration\LegacyFileResolver;

$resolver = app(LegacyFileResolver::class);

// Résoudre un fichier (cherche d'abord dans S3, puis dans le legacy)
$result = $resolver->resolve('tenants/32/customers/documents/123/file.pdf');
// ou avec un chemin legacy
$result = $resolver->resolve('sites/site_theme32/admin/data/customers/documents/123/file.pdf');
// Résultat:
// [
//     'content' => '...binary content...',
//     'source' => 'new' ou 'legacy',
//     'path' => '...',
// ]

// Résoudre et obtenir une URL signée
$urlResult = $resolver->resolveUrl('tenants/32/customers/documents/123/file.pdf', null, 60);
// Résultat:
// [
//     'url' => 'https://s3.../...?signature=...',
//     'source' => 'new',
//     'expires_at' => '2024-01-15T12:00:00Z',
// ]

// Vérifier si un fichier existe
$exists = $resolver->exists('tenants/32/customers/documents/123/file.pdf');

// Obtenir les métadonnées
$metadata = $resolver->getMetadata('tenants/32/customers/documents/123/file.pdf');
```

## Stratégie de migration recommandée

### Phase 1: Analyse et préparation

1. **Analyser l'existant**:
   ```bash
   php artisan legacy:analyze --all --export=pre-migration-report.json
   ```

2. **Vérifier la configuration S3**:
   - Assurez-vous que S3/MinIO est correctement configuré
   - Testez l'upload d'un fichier test

3. **Estimer l'espace nécessaire**:
   - Le rapport d'analyse indique la taille totale des fichiers

### Phase 2: Migration progressive

1. **Commencer par un site test**:
   ```bash
   php artisan migrate:files --site=site_theme32 --dry-run
   php artisan migrate:files --site=site_theme32
   ```

2. **Vérifier les résultats**:
   - Tester l'accès aux fichiers via l'API
   - Vérifier les URLs signées

3. **Migrer les autres sites**:
   ```bash
   php artisan migrate:files --all
   ```

### Phase 3: Activation de l'auto-migration

Pour les fichiers non encore migrés, activez la migration automatique:

```env
MIGRATION_AUTO_MIGRATE=true
```

Cela migrera automatiquement les fichiers vers S3 lors de leur premier accès.

### Phase 4: Nettoyage

Une fois tous les fichiers migrés et vérifiés:

1. Désactiver la résolution legacy dans le code
2. Archiver l'ancien projet Symfony
3. Mettre à jour les chemins en base de données si nécessaire

## Gestion des erreurs

### Fichiers trop volumineux

Les fichiers dépassant `MIGRATION_MAX_FILE_SIZE` seront ignorés et logués. Augmentez la limite ou migrez-les manuellement.

### Fichiers corrompus ou inaccessibles

Les erreurs sont loguées dans `storage/logs/laravel.log`. Consultez le rapport de migration pour identifier les fichiers en échec.

### Conflits de noms

Utilisez l'option `--overwrite` pour écraser les fichiers existants, ou traitez les conflits manuellement.

## Intégration dans les modules

### Exemple: Module Customer

```php
// Dans votre contrôleur
use App\Services\Migration\LegacyFileResolver;

class CustomerDocumentController extends Controller
{
    public function __construct(
        protected LegacyFileResolver $fileResolver
    ) {}

    public function download(Customer $customer, string $documentId)
    {
        $tenantId = tenant()->getTenantKey();
        $path = "tenants/{$tenantId}/customers/documents/{$customer->id}/{$documentId}";

        $result = $this->fileResolver->resolveUrl($path, $tenantId);

        if (!$result) {
            abort(404, 'Document not found');
        }

        if (isset($result['url'])) {
            return redirect($result['url']);
        }

        // Fallback pour fichier legacy non migré
        if (isset($result['local_path'])) {
            return response()->download($result['local_path']);
        }

        abort(404);
    }
}
```

## Architecture des fichiers créés

```
app/
├── Console/
│   └── Commands/
│       ├── AnalyzeLegacyFilesCommand.php
│       └── MigrateFilesCommand.php
├── Providers/
│   └── MigrationServiceProvider.php
└── Services/
    └── Migration/
        ├── FileMigrationService.php
        ├── LegacyFileResolver.php
        └── LegacyPathMapper.php

config/
└── migration.php
```

## Dépendances

- `aws/aws-sdk-php` pour S3/MinIO
- Service `ServiceConfigManager` du module Superadmin pour la configuration S3

## Support

Pour tout problème, consultez les logs Laravel et le rapport de migration exporté.
