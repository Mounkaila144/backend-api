<?php

namespace Modules\User\Http\Controllers\Admin;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Routing\Controller;
use Modules\User\Entities\User;
use Modules\User\Services\UserStorageService;

/**
 * UserPictureController
 * Gère les photos de profil utilisateur (upload vers S3/MinIO)
 */
class UserPictureController extends Controller
{
    public function __construct(
        protected UserStorageService $storageService
    ) {
    }

    /**
     * Upload une photo de profil
     * POST /api/admin/users/{id}/picture
     *
     * @param Request $request
     * @param int $id
     * @return JsonResponse
     */
    public function upload(Request $request, int $id): JsonResponse
    {
        $request->validate([
            'picture' => 'required|image|mimes:jpeg,png,gif,webp|max:5120', // 5MB max
        ]);

        // Vérifier que l'utilisateur existe
        $user = User::findOrFail($id);

        // Supprimer l'ancienne photo si elle existe
        if ($user->picture && !str_starts_with($user->picture, 'http')) {
            $this->storageService->deleteProfilePicture($id, $user->picture);
        }

        // Upload la nouvelle photo
        $result = $this->storageService->uploadProfilePicture($id, $request->file('picture'));

        if (!$result['success']) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to upload picture',
                'error' => $result['error'],
            ], 500);
        }

        // Mettre à jour le champ picture de l'utilisateur
        $user->update(['picture' => $result['filename']]);

        return response()->json([
            'success' => true,
            'message' => 'Picture uploaded successfully',
            'data' => [
                'filename' => $result['filename'],
                'url' => $result['url'],
                'storage' => $this->storageService->getCurrentDisk(),
            ],
        ]);
    }

    /**
     * Récupère l'URL signée de la photo de profil
     * GET /api/admin/users/{id}/picture
     *
     * @param int $id
     * @return JsonResponse
     */
    public function show(int $id): JsonResponse
    {
        $user = User::findOrFail($id);

        if (!$user->picture) {
            return response()->json([
                'success' => false,
                'message' => 'No picture found',
            ], 404);
        }

        // Si c'est une URL externe, la retourner directement
        if (str_starts_with($user->picture, 'http')) {
            return response()->json([
                'success' => true,
                'data' => [
                    'url' => $user->picture,
                    'type' => 'external',
                ],
            ]);
        }

        // Générer l'URL signée
        $url = $this->storageService->getProfilePictureUrl($id, $user->picture, 60);

        if (!$url && $this->storageService->getCurrentDisk() === 'local') {
            // Pour le stockage local, retourner l'URL de téléchargement
            return response()->json([
                'success' => true,
                'data' => [
                    'url' => route('admin.users.picture.download', ['id' => $id]),
                    'type' => 'local',
                ],
            ]);
        }

        return response()->json([
            'success' => true,
            'data' => [
                'url' => $url,
                'type' => $this->storageService->useS3() ? 's3' : 'local',
                'expires_in' => 3600, // 1 heure
            ],
        ]);
    }

    /**
     * Télécharge la photo de profil (pour le stockage local)
     * GET /api/admin/users/{id}/picture/download
     *
     * @param int $id
     * @return Response|JsonResponse
     */
    public function download(int $id): Response|JsonResponse
    {
        $user = User::findOrFail($id);

        if (!$user->picture) {
            return response()->json([
                'success' => false,
                'message' => 'No picture found',
            ], 404);
        }

        $content = $this->storageService->getProfilePicture($id, $user->picture);

        if (!$content) {
            return response()->json([
                'success' => false,
                'message' => 'Picture not found in storage',
            ], 404);
        }

        // Déterminer le type MIME
        $extension = pathinfo($user->picture, PATHINFO_EXTENSION);
        $mimeTypes = [
            'jpg' => 'image/jpeg',
            'jpeg' => 'image/jpeg',
            'png' => 'image/png',
            'gif' => 'image/gif',
            'webp' => 'image/webp',
        ];
        $mimeType = $mimeTypes[$extension] ?? 'application/octet-stream';

        return response($content, 200, [
            'Content-Type' => $mimeType,
            'Content-Disposition' => 'inline; filename="' . $user->picture . '"',
            'Cache-Control' => 'private, max-age=3600',
        ]);
    }

    /**
     * Supprime la photo de profil
     * DELETE /api/admin/users/{id}/picture
     *
     * @param int $id
     * @return JsonResponse
     */
    public function destroy(int $id): JsonResponse
    {
        $user = User::findOrFail($id);

        if (!$user->picture) {
            return response()->json([
                'success' => false,
                'message' => 'No picture to delete',
            ], 404);
        }

        // Supprimer le fichier du stockage
        if (!str_starts_with($user->picture, 'http')) {
            $this->storageService->deleteProfilePicture($id, $user->picture);
        }

        // Mettre à jour l'utilisateur
        $user->update(['picture' => null]);

        return response()->json([
            'success' => true,
            'message' => 'Picture deleted successfully',
        ]);
    }

    /**
     * Retourne les informations de stockage de l'utilisateur
     * GET /api/admin/users/{id}/storage-info
     *
     * @param int $id
     * @return JsonResponse
     */
    public function storageInfo(int $id): JsonResponse
    {
        User::findOrFail($id);

        $files = $this->storageService->listUserFiles($id);
        $usage = $this->storageService->getUserStorageUsage($id);

        return response()->json([
            'success' => true,
            'data' => [
                'files_count' => count($files),
                'files' => $files,
                'total_size' => $usage,
                'total_size_human' => $this->formatBytes($usage),
                'storage_type' => $this->storageService->getCurrentDisk(),
            ],
        ]);
    }

    /**
     * Formate les bytes en unité lisible
     *
     * @param int $bytes
     * @return string
     */
    protected function formatBytes(int $bytes): string
    {
        $units = ['B', 'KB', 'MB', 'GB', 'TB'];
        $bytes = max($bytes, 0);
        $pow = floor(($bytes ? log($bytes) : 0) / log(1024));
        $pow = min($pow, count($units) - 1);
        $bytes /= pow(1024, $pow);

        return round($bytes, 2) . ' ' . $units[$pow];
    }
}
