<?php

namespace Modules\CustomersDocuments\Http\Controllers\Admin;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\Storage;
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
    /**
     * List documents for a contract's customer.
     * Reproduces: listForContractAction + ajaxListPartialDocumentForContract
     */
    public function index(Request $request, int $contractId): JsonResponse
    {
        $contract = CustomerContract::on('tenant')->findOrFail($contractId);
        $status = $request->query('status', 'ACTIVE');

        $query = \DB::connection('tenant')
            ->table('t_customers_documents')
            ->where('customer_id', $contract->customer_id)
            ->orderByDesc('created_at');

        if ($status !== 'ALL') {
            $query->where('status', $status);
        }

        $documents = $query->get()->map(fn ($d) => [
            'id' => $d->id,
            'title' => $d->title,
            'file' => $d->file,
            'extension' => $d->extension,
            'status' => $d->status,
            'is_picture' => in_array(strtolower($d->extension), ['png', 'jpg', 'jpeg', 'gif']),
            'created_at' => $d->created_at,
        ]);

        // Settings
        $settings = [
            'max_files' => 10,
            'max_file_size' => 1024,
            'authorized_types' => ['doc', 'png', 'jpg', 'pdf', 'txt', 'zip', 'rar'],
        ];

        return response()->json([
            'success' => true,
            'data' => [
                'documents' => $documents,
                'settings' => $settings,
            ],
        ]);
    }

    /**
     * Upload document(s) for a contract's customer.
     * Reproduces: UploadAction
     * Files stored on cloud via TenantStorageManager.
     */
    public function upload(Request $request, int $contractId): JsonResponse
    {
        $contract = CustomerContract::on('tenant')->findOrFail($contractId);
        $files = $request->file('files', []);
        $uploaded = [];

        foreach ((array) $files as $file) {
            $ext = $file->getClientOriginalExtension();
            $title = pathinfo($file->getClientOriginalName(), PATHINFO_FILENAME);

            $id = \DB::connection('tenant')->table('t_customers_documents')
                ->insertGetId([
                    'customer_id' => $contract->customer_id,
                    'title' => $title,
                    'file' => $file->getClientOriginalName(),
                    'extension' => $ext,
                    'status' => 'ACTIVE',
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);

            // Store on cloud via TenantStorageManager
            try {
                $tenant = \App\Models\Tenant::first();
                $storageManager = app(\Modules\Superadmin\Services\TenantStorageManager::class);
                $storageManager->uploadFile(
                    $tenant->site_id,
                    "admin/data/customers/documents/{$id}",
                    file_get_contents($file->getRealPath()),
                    $file->getClientOriginalName()
                );
            } catch (\Exception $e) {
                // Fallback local
                $siteName = \DB::connection('tenant')->getDatabaseName();
                $file->storeAs("sites/{$siteName}/admin/data/customers/documents/{$id}", $file->getClientOriginalName(), 'local');
            }

            $uploaded[] = ['id' => $id, 'title' => $title, 'extension' => $ext];
        }

        return response()->json(['success' => true, 'files' => $uploaded]);
    }

    /**
     * Download/view a document file.
     * Searches: TenantStorageManager (cloud) → local fallback → Symfony path
     */
    public function download(Request $request, int $contractId, int $documentId)
    {
        $doc = \DB::connection('tenant')->table('t_customers_documents')
            ->where('id', $documentId)->first();

        if (!$doc) {
            return response()->json(['success' => false, 'message' => 'Document not found'], 404);
        }

        $fileName = $doc->file;

        // Try cloud via TenantStorageManager
        try {
            $tenant = \App\Models\Tenant::first();
            $storageManager = app(\Modules\Superadmin\Services\TenantStorageManager::class);
            $relativePath = "admin/data/customers/documents/{$documentId}/{$fileName}";
            $fullPath = $storageManager->getTenantPath($tenant->site_id) . "/{$relativePath}";
            $disk = $storageManager->getCurrentDisk();

            if (Storage::disk($disk)->exists($fullPath)) {
                return Storage::disk($disk)->download($fullPath, $fileName);
            }
        } catch (\Exception $e) {
            // Fallback below
        }

        // Local fallback paths
        $siteName = \DB::connection('tenant')->getDatabaseName();
        $paths = [
            storage_path("app/private/sites/{$siteName}/admin/data/customers/documents/{$documentId}/{$fileName}"),
            base_path("sites/{$siteName}/admin/data/customers/documents/{$documentId}/{$fileName}"),
        ];

        foreach ($paths as $candidate) {
            if (file_exists($candidate)) {
                return response()->file($candidate);
            }
        }

        return response()->json(['success' => false, 'message' => 'File not found'], 404);
    }

    /**
     * Get document settings.
     * Reproduces: ajaxSettingsAction + CustomerDocumentSettings
     *
     * Settings are stored as PHP serialized data in:
     * sites/{site_db_name}/frontend/data/settings/CustomerDocumentSettings.dat
     * (same file name and format as Symfony)
     */
    public function getSettings(Request $request): JsonResponse
    {
        $defaults = [
            'max_files_by_archive' => 20,
            'max_file_size' => 1024,
            'max_files' => 10,
            'authorized_types' => ['doc', 'png', 'jpg', 'pdf', 'txt', 'zip', 'rar'],
        ];

        // Load from CustomerDocumentSettings.dat (PHP serialized, same as Symfony)
        try {
            $tenant = \App\Models\Tenant::first();
            $storageManager = app(\Modules\Superadmin\Services\TenantStorageManager::class);
            $disk = $storageManager->getCurrentDisk();
            $settingsPath = $storageManager->getTenantPath($tenant->site_id)
                . '/frontend/data/settings/CustomerDocumentSettings.dat';

            if (Storage::disk($disk)->exists($settingsPath)) {
                $content = Storage::disk($disk)->get($settingsPath);
                $saved = @unserialize($content);
                if (is_array($saved)) {
                    $defaults = array_merge($defaults, $saved);
                }
            }
        } catch (\Exception $e) {
            // Use defaults
        }

        return response()->json(['success' => true, 'data' => $defaults]);
    }

    /**
     * Save document settings.
     * Reproduces: ajaxSettingsAction POST
     *
     * Saves as PHP serialized to CustomerDocumentSettings.dat
     * (same format as Symfony's mfSettingsBase->save())
     */
    public function saveSettings(Request $request): JsonResponse
    {
        $settings = $request->input('settings', []);

        try {
            $tenant = \App\Models\Tenant::first();
            $storageManager = app(\Modules\Superadmin\Services\TenantStorageManager::class);
            $disk = $storageManager->getCurrentDisk();
            $settingsPath = $storageManager->getTenantPath($tenant->site_id)
                . '/frontend/data/settings/CustomerDocumentSettings.dat';

            // Load existing settings to merge (preserve fields not in this form)
            $existing = [];
            if (Storage::disk($disk)->exists($settingsPath)) {
                $content = Storage::disk($disk)->get($settingsPath);
                $existing = @unserialize($content) ?: [];
            }

            // Merge new settings into existing
            $merged = array_merge($existing, $settings);

            // Save as PHP serialized (same format as Symfony)
            Storage::disk($disk)->put($settingsPath, serialize($merged));

            return response()->json(['success' => true, 'message' => 'Paramètres enregistrés']);
        } catch (\Exception $e) {
            \Log::error('Failed to save document settings', ['error' => $e->getMessage()]);
            return response()->json(['success' => false, 'message' => 'Failed to save settings'], 500);
        }
    }

    /**
     * Soft delete a document (set status to DELETE).
     * Reproduces: ajaxDeleteDocumentAction
     */
    public function destroy(Request $request, int $contractId, int $documentId): JsonResponse
    {
        \DB::connection('tenant')->table('t_customers_documents')
            ->where('id', $documentId)
            ->update(['status' => 'DELETE', 'updated_at' => now()]);

        return response()->json(['success' => true, 'action' => 'DeleteDocument', 'id' => $documentId]);
    }
}
