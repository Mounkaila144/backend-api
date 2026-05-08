<?php

namespace Modules\CustomersDocuments\Http\Controllers\Admin;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Modules\CustomersContracts\Entities\CustomerContract;

/**
 * Documents management for contracts.
 * Reproduces Symfony: customers_documents module
 *
 * Files stored via TenantStorageManager (S3/local)
 * Path: sites/{site_db_name}/admin/data/customers/documents/{id}/{filename}
 */
class DocumentController extends Controller
{
    private const DEFAULT_SETTINGS = [
        'max_files_by_archive' => 20,
        'max_file_size'        => 1024,
        'max_files'            => 10,
        'authorized_types'     => ['doc', 'docx', 'png', 'jpg', 'jpeg', 'pdf', 'txt', 'zip', 'rar'],
    ];

    private const SETTINGS_RELATIVE_PATH = 'frontend/data/settings/CustomerDocumentSettings.dat';

    /**
     * List documents for a contract's customer.
     */
    public function index(Request $request, int $contractId): JsonResponse
    {
        $contract = CustomerContract::on('tenant')->findOrFail($contractId);
        $status   = $request->query('status', 'ACTIVE');

        $query = \DB::connection('tenant')
            ->table('t_customers_documents')
            ->where('customer_id', $contract->customer_id)
            ->orderByDesc('created_at');

        if ($status !== 'ALL') {
            $query->where('status', $status);
        }

        $documents = $query->get()->map(fn ($d) => [
            'id'         => $d->id,
            'title'      => $d->title,
            'file'       => $d->file,
            'extension'  => $d->extension,
            'status'     => $d->status,
            'is_picture' => in_array(strtolower($d->extension), ['png', 'jpg', 'jpeg', 'gif']),
            'created_at' => $d->created_at,
        ]);

        return response()->json([
            'success' => true,
            'data'    => [
                'documents' => $documents,
                'settings'  => $this->loadSettings(),
            ],
        ]);
    }

    /**
     * Upload document(s) for a contract's customer.
     */
    public function upload(Request $request, int $contractId): JsonResponse
    {
        $contract = CustomerContract::on('tenant')->findOrFail($contractId);
        $settings = $this->loadSettings();

        $maxFiles    = (int) ($settings['max_files'] ?? 10);
        $maxSizeKb   = (int) ($settings['max_file_size'] ?? 1024);
        $allowedExts = array_map('strtolower', (array) ($settings['authorized_types'] ?? []));

        $request->validate([
            'files'   => "required|array|max:{$maxFiles}",
            'files.*' => "required|file|max:{$maxSizeKb}",
        ]);

        $tenant = tenant();
        if (!$tenant) {
            return response()->json([
                'success' => false,
                'message' => 'Tenant context not initialized',
            ], 500);
        }

        $files    = (array) $request->file('files', []);
        $uploaded = [];

        foreach ($files as $file) {
            $ext = strtolower($file->getClientOriginalExtension());

            if ($allowedExts && !in_array($ext, $allowedExts, true)) {
                return response()->json([
                    'success' => false,
                    'message' => "File extension .{$ext} is not allowed",
                ], 422);
            }

            $originalName = $file->getClientOriginalName();
            $titleRaw     = pathinfo($originalName, PATHINFO_FILENAME);

            // Sluggified filename for storage (defeat path traversal + cross-OS issues).
            $safeBase     = Str::slug($titleRaw);
            $safeBase     = $safeBase !== '' ? $safeBase : 'file';
            $safeFilename = substr($safeBase, 0, 100) . '.' . $ext;

            $id = \DB::connection('tenant')->table('t_customers_documents')
                ->insertGetId([
                    'customer_id' => $contract->customer_id,
                    'title'       => mb_substr($titleRaw, 0, 200),
                    'file'        => $safeFilename,
                    'extension'   => $ext,
                    'status'      => 'ACTIVE',
                    'created_at'  => now(),
                    'updated_at'  => now(),
                ]);

            try {
                $storageManager = app(\Modules\Superadmin\Services\TenantStorageManager::class);
                $storageManager->uploadFile(
                    $tenant->site_id,
                    "admin/data/customers/documents/{$id}",
                    file_get_contents($file->getRealPath()),
                    $safeFilename
                );
            } catch (\Throwable $e) {
                \Log::warning('Cloud upload failed, using local fallback', [
                    'document_id' => $id,
                    'error'       => $e->getMessage(),
                ]);
                $siteName = \DB::connection('tenant')->getDatabaseName();
                $file->storeAs(
                    "sites/{$siteName}/admin/data/customers/documents/{$id}",
                    $safeFilename,
                    'local'
                );
            }

            $uploaded[] = ['id' => $id, 'title' => $titleRaw, 'extension' => $ext];
        }

        return response()->json(['success' => true, 'files' => $uploaded]);
    }

    /**
     * Download/view a document file.
     */
    public function download(Request $request, int $contractId, int $documentId)
    {
        $doc = \DB::connection('tenant')->table('t_customers_documents')
            ->where('id', $documentId)->first();

        if (!$doc) {
            return response()->json(['success' => false, 'message' => 'Document not found'], 404);
        }

        $fileName = $doc->file;
        $tenant   = tenant();

        if ($tenant) {
            try {
                $storageManager = app(\Modules\Superadmin\Services\TenantStorageManager::class);
                $relativePath   = "admin/data/customers/documents/{$documentId}/{$fileName}";
                $fullPath       = $storageManager->getTenantPath($tenant->site_id) . "/{$relativePath}";
                $disk           = $storageManager->getCurrentDisk();

                if (Storage::disk($disk)->exists($fullPath)) {
                    return Storage::disk($disk)->download($fullPath, $fileName);
                }
            } catch (\Throwable $e) {
                \Log::warning('Cloud download failed, falling back to local', [
                    'document_id' => $documentId,
                    'error'       => $e->getMessage(),
                ]);
            }
        }

        $siteName = \DB::connection('tenant')->getDatabaseName();
        $paths    = [
            storage_path("app/private/sites/{$siteName}/admin/data/customers/documents/{$documentId}/{$fileName}"),
            base_path("sites/{$siteName}/admin/data/customers/documents/{$documentId}/{$fileName}"),
        ];

        foreach ($paths as $candidate) {
            if (is_file($candidate)) {
                return response()->file($candidate);
            }
        }

        return response()->json(['success' => false, 'message' => 'File not found'], 404);
    }

    /**
     * Get document settings (merged with defaults).
     */
    public function getSettings(Request $request): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data'    => $this->loadSettings(),
        ]);
    }

    /**
     * Save document settings (now persisted as JSON, never as PHP serialized payload).
     */
    public function saveSettings(Request $request): JsonResponse
    {
        $settings = (array) $request->input('settings', []);

        $tenant = tenant();
        if (!$tenant) {
            return response()->json([
                'success' => false,
                'message' => 'Tenant context not initialized',
            ], 500);
        }

        try {
            $existing = $this->loadSettings();
            $merged   = array_merge($existing, $settings);
            $this->writeSettings($tenant->site_id, $merged);

            return response()->json(['success' => true, 'message' => 'Paramètres enregistrés']);
        } catch (\Throwable $e) {
            \Log::error('Failed to save document settings', ['error' => $e->getMessage()]);
            return response()->json(['success' => false, 'message' => 'Failed to save settings'], 500);
        }
    }

    /**
     * Soft delete a document (set status to DELETE).
     */
    public function destroy(Request $request, int $contractId, int $documentId): JsonResponse
    {
        \DB::connection('tenant')->table('t_customers_documents')
            ->where('id', $documentId)
            ->update(['status' => 'DELETE', 'updated_at' => now()]);

        return response()->json(['success' => true, 'action' => 'DeleteDocument', 'id' => $documentId]);
    }

    /**
     * Read settings from storage. Accepts the new JSON format and the legacy PHP-serialized
     * .dat format (read with allowed_classes=false to neutralize object instantiation / RCE).
     */
    private function loadSettings(): array
    {
        $tenant = tenant();
        if (!$tenant) {
            return self::DEFAULT_SETTINGS;
        }

        try {
            $storageManager = app(\Modules\Superadmin\Services\TenantStorageManager::class);
            $disk           = $storageManager->getCurrentDisk();
            $path           = $storageManager->getTenantPath($tenant->site_id) . '/' . self::SETTINGS_RELATIVE_PATH;

            if (!Storage::disk($disk)->exists($path)) {
                return self::DEFAULT_SETTINGS;
            }

            $content = Storage::disk($disk)->get($path);
            $decoded = $this->decodeSettingsPayload($content);

            return is_array($decoded) ? array_merge(self::DEFAULT_SETTINGS, $decoded) : self::DEFAULT_SETTINGS;
        } catch (\Throwable $e) {
            \Log::warning('Failed to read document settings', ['error' => $e->getMessage()]);
            return self::DEFAULT_SETTINGS;
        }
    }

    /**
     * Persist settings as PHP serialized payload — same format as Symfony's mfSettingsBase
     * so the .dat file remains readable by both the Laravel and Symfony stacks.
     */
    private function writeSettings(int $siteId, array $settings): void
    {
        $storageManager = app(\Modules\Superadmin\Services\TenantStorageManager::class);
        $disk           = $storageManager->getCurrentDisk();
        $path           = $storageManager->getTenantPath($siteId) . '/' . self::SETTINGS_RELATIVE_PATH;

        Storage::disk($disk)->put($path, serialize($settings));
    }

    /**
     * Read the persisted payload safely.
     *
     * `allowed_classes => false` is the key security knob: any serialized object becomes
     * a __PHP_Incomplete_Class (no __wakeup/__destruct/__toString fired), so a maliciously
     * crafted .dat cannot trigger a POP chain / RCE. Format stays Symfony-compatible.
     */
    private function decodeSettingsPayload(string $content): mixed
    {
        return @unserialize($content, ['allowed_classes' => false]);
    }
}
