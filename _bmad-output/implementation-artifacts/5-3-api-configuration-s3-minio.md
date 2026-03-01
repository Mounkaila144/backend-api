# Story 5.3: API Configuration S3/Minio

**Status:** review

---

## Story

As a **SuperAdmin**,
I want **des endpoints API pour configurer et tester S3/Minio**,
so that **je peux gérer le storage via l'interface**.

---

## Acceptance Criteria

1. **Given** je suis authentifié
   **When** j'appelle `GET /api/superadmin/config/s3`
   **Then** je reçois la config actuelle (secrets masqués)

2. **Given** une nouvelle config
   **When** j'appelle `PUT /api/superadmin/config/s3`
   **Then** la config est sauvegardée (chiffrée)

3. **Given** une config à tester
   **When** j'appelle `POST /api/superadmin/config/s3/test`
   **Then** je reçois le résultat du test de connexion

---

## Tasks / Subtasks

- [x] **Task 1: Créer ServiceConfigController** (AC: #1, #2)
  - [x] `Modules/Superadmin/Http/Controllers/Superadmin/ServiceConfigController.php`
  - [x] Méthodes `getS3Config`, `updateS3Config`

- [x] **Task 2: Endpoint de test** (AC: #3)
  - [x] Méthode `testS3Connection`
  - [x] Utiliser `S3HealthChecker`

- [x] **Task 3: Configurer les routes** (AC: #1-3)
  - [x] Routes GET, PUT, POST

---

## Dev Notes

### Endpoints

```
GET  /api/superadmin/config/s3
PUT  /api/superadmin/config/s3
POST /api/superadmin/config/s3/test
```

### ServiceConfigController

```php
<?php

namespace Modules\Superadmin\Http\Controllers\Superadmin;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Modules\Superadmin\Services\ServiceConfigManager;
use Modules\Superadmin\Services\Checkers\S3HealthChecker;
use Modules\Superadmin\Http\Requests\UpdateS3ConfigRequest;

class ServiceConfigController extends Controller
{
    public function __construct(
        private ServiceConfigManager $configManager,
        private S3HealthChecker $s3Checker
    ) {}

    /**
     * GET /api/superadmin/config/s3
     */
    public function getS3Config(): JsonResponse
    {
        $config = $this->configManager->getForDisplay('s3');

        return response()->json([
            'data' => $config,
            'schema' => $this->configManager->getServiceSchema('s3'),
        ]);
    }

    /**
     * PUT /api/superadmin/config/s3
     */
    public function updateS3Config(UpdateS3ConfigRequest $request): JsonResponse
    {
        $serviceConfig = $this->configManager->save('s3', $request->validated());

        return response()->json([
            'message' => 'S3 configuration saved',
            'data' => $this->configManager->getForDisplay('s3'),
        ]);
    }

    /**
     * POST /api/superadmin/config/s3/test
     */
    public function testS3Connection(UpdateS3ConfigRequest $request): JsonResponse
    {
        // Tester avec la config fournie (pas encore sauvegardée)
        $config = $request->validated();
        $result = $this->s3Checker->check($config);

        return response()->json([
            'data' => $result->toArray(),
        ]);
    }
}
```

### UpdateS3ConfigRequest

```php
<?php

namespace Modules\Superadmin\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateS3ConfigRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->tokenCan('role:superadmin');
    }

    public function rules(): array
    {
        return [
            'access_key' => ['required', 'string'],
            'secret_key' => ['required', 'string'],
            'bucket' => ['required', 'string'],
            'region' => ['required', 'string'],
            'endpoint' => ['nullable', 'url'],
            'use_path_style' => ['nullable', 'boolean'],
        ];
    }
}
```

### Routes

```php
Route::prefix('config')->group(function () {
    // S3/Minio
    Route::get('s3', [ServiceConfigController::class, 'getS3Config'])
        ->middleware('throttle:superadmin-read');
    Route::put('s3', [ServiceConfigController::class, 'updateS3Config'])
        ->middleware('throttle:superadmin-write');
    Route::post('s3/test', [ServiceConfigController::class, 'testS3Connection'])
        ->middleware('throttle:superadmin-write');
});
```

### Format de Réponse - GET

```json
{
    "data": {
        "access_key": "AKIAIOSFODNN7EXAMPLE",
        "secret_key": "********",
        "bucket": "icall26-storage",
        "region": "eu-west-1",
        "endpoint": "https://minio.example.com",
        "use_path_style": true
    },
    "schema": {
        "required": ["access_key", "secret_key", "bucket", "region"],
        "optional": ["endpoint", "use_path_style"]
    }
}
```

### Format de Réponse - Test

```json
{
    "data": {
        "service": "s3",
        "healthy": true,
        "status": "connected",
        "message": "S3 connection successful",
        "details": {
            "bucket": "icall26-storage",
            "region": "eu-west-1",
            "endpoint": "https://minio.example.com",
            "permissions": ["list", "read", "write", "delete"]
        },
        "latency_ms": 245,
        "checked_at": "2026-01-28T12:00:00+00:00"
    }
}
```

### References

- [Source: _bmad-output/planning-artifacts/prd.md#API-Specifications]
- [Source: _bmad-output/planning-artifacts/epics.md#Story-5.3]

---

## Dev Agent Record

### Agent Model Used
Claude Sonnet 4.5 (2026-01-28)

### Debug Log References
N/A

### Completion Notes List
- Créé ServiceConfigController pour gérer la configuration S3/Minio via API
- Implémenté 3 endpoints: GET (récupération), PUT (sauvegarde), POST (test)
- Les secrets sont masqués dans les réponses GET
- L'endpoint de test permet de valider une config avant sauvegarde
- Routes ajoutées avec throttling approprié

### File List
- Modules/Superadmin/Http/Controllers/Superadmin/ServiceConfigController.php (new)
- Modules/Superadmin/Http/Requests/UpdateS3ConfigRequest.php (new)
- Modules/Superadmin/Routes/superadmin.php (modified)

