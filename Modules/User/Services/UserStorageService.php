<?php

namespace Modules\User\Services;

use Aws\S3\S3Client;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Modules\Superadmin\Services\ServiceConfigManager;

/**
 * UserStorageService
 * Gère le stockage des fichiers utilisateurs sur S3/MinIO
 * Compatible multi-tenant avec isolation par tenant
 */
class UserStorageService
{
    protected ?S3Client $s3Client = null;
    protected ?array $s3Config = null;
    protected string $disk = 'local';
    protected bool $initialized = false;

    public function __construct(
        protected ServiceConfigManager $configManager
    ) {
        // LAZY INIT: Don't initialize in constructor - wait until first use
        // This avoids creating S3 client and potential network calls during dependency injection
    }

    /**
     * Ensure S3 is initialized (lazy initialization)
     */
    protected function ensureInitialized(): void
    {
        if ($this->initialized) {
            return;
        }
        $this->initialized = true;
        $this->initializeS3();
    }

    /**
     * Initialise le client S3 si la config existe
     */
    protected function initializeS3(): void
    {
        // Vérifier si le SDK AWS est disponible
        if (!class_exists(S3Client::class)) {
            Log::debug('UserStorageService: AWS SDK not installed, using local storage');
            return;
        }

        try {
            $this->s3Config = $this->configManager->get('s3');

            if ($this->s3Config && !empty($this->s3Config['access_key'])) {
                $this->s3Client = new S3Client([
                    'version' => 'latest',
                    'region' => $this->s3Config['region'] ?? 'us-east-1',
                    'credentials' => [
                        'key' => $this->s3Config['access_key'],
                        'secret' => $this->s3Config['secret_key'],
                    ],
                    'endpoint' => $this->s3Config['endpoint'] ?? null,
                    'use_path_style_endpoint' => $this->s3Config['use_path_style'] ?? false,
                ]);
                $this->disk = 's3';
                Log::debug('UserStorageService: S3 connection configured');
            }
        } catch (\Exception $e) {
            Log::warning('UserStorageService: S3 initialization failed, using local storage', [
                'error' => $e->getMessage(),
            ]);
            $this->s3Client = null;
            $this->disk = 'local';
        }
    }

    /**
     * Retourne le chemin de base pour les fichiers d'un tenant
     */
    protected function getTenantPath(): string
    {
        $tenantId = tenancy()->tenant->site_id ?? 'default';
        return "tenants/{$tenantId}/users";
    }

    /**
     * Retourne le chemin complet pour la photo d'un utilisateur
     */
    protected function getUserPicturePath(int $userId, string $filename): string
    {
        return "{$this->getTenantPath()}/{$userId}/pictures/{$filename}";
    }

    /**
     * Upload une photo de profil utilisateur
     *
     * @param int $userId
     * @param UploadedFile $file
     * @return array{success: bool, path: string|null, url: string|null, error: string|null}
     */
    public function uploadProfilePicture(int $userId, UploadedFile $file): array
    {
        $this->ensureInitialized();
        try {
            // Valider le fichier
            $this->validateImage($file);

            // Générer un nom unique pour le fichier
            $extension = $file->getClientOriginalExtension() ?: 'jpg';
            $filename = Str::uuid() . '.' . $extension;
            $path = $this->getUserPicturePath($userId, $filename);

            // Optimiser l'image si possible
            $content = $this->optimizeImage($file);

            if ($this->useS3()) {
                // Upload vers S3/MinIO
                $this->s3Client->putObject([
                    'Bucket' => $this->s3Config['bucket'],
                    'Key' => $path,
                    'Body' => $content,
                    'ContentType' => $file->getMimeType(),
                    'ACL' => 'private',
                    'Metadata' => [
                        'user_id' => (string) $userId,
                        'original_name' => $file->getClientOriginalName(),
                        'uploaded_at' => now()->toIso8601String(),
                    ],
                ]);

                $url = $this->getSignedUrl($path);
            } else {
                // Fallback vers stockage local
                Storage::disk('local')->put($path, $content);
                $url = null; // Pas d'URL publique pour le stockage local
            }

            Log::info('User profile picture uploaded', [
                'user_id' => $userId,
                'path' => $path,
                'disk' => $this->disk,
                'size' => strlen($content),
            ]);

            return [
                'success' => true,
                'path' => $path,
                'url' => $url,
                'filename' => $filename,
                'error' => null,
            ];

        } catch (\Exception $e) {
            Log::error('Failed to upload user profile picture', [
                'user_id' => $userId,
                'error' => $e->getMessage(),
            ]);

            return [
                'success' => false,
                'path' => null,
                'url' => null,
                'error' => $e->getMessage(),
            ];
        }
    }

    /**
     * Supprime une photo de profil utilisateur
     *
     * @param int $userId
     * @param string $filename
     * @return bool
     */
    public function deleteProfilePicture(int $userId, string $filename): bool
    {
        $this->ensureInitialized();
        try {
            $path = $this->getUserPicturePath($userId, $filename);

            if ($this->useS3()) {
                $this->s3Client->deleteObject([
                    'Bucket' => $this->s3Config['bucket'],
                    'Key' => $path,
                ]);
            } else {
                Storage::disk('local')->delete($path);
            }

            Log::info('User profile picture deleted', [
                'user_id' => $userId,
                'path' => $path,
            ]);

            return true;

        } catch (\Exception $e) {
            Log::error('Failed to delete user profile picture', [
                'user_id' => $userId,
                'filename' => $filename,
                'error' => $e->getMessage(),
            ]);

            return false;
        }
    }

    /**
     * Récupère le contenu d'une photo de profil
     *
     * @param int $userId
     * @param string $filename
     * @return string|null
     */
    public function getProfilePicture(int $userId, string $filename): ?string
    {
        $this->ensureInitialized();
        try {
            $path = $this->getUserPicturePath($userId, $filename);

            if ($this->useS3()) {
                $result = $this->s3Client->getObject([
                    'Bucket' => $this->s3Config['bucket'],
                    'Key' => $path,
                ]);

                return (string) $result['Body'];
            } else {
                return Storage::disk('local')->get($path);
            }

        } catch (\Exception $e) {
            Log::error('Failed to get user profile picture', [
                'user_id' => $userId,
                'filename' => $filename,
                'error' => $e->getMessage(),
            ]);

            return null;
        }
    }

    /**
     * Génère une URL signée temporaire pour accéder à une image
     *
     * @param string $path
     * @param int $expirationMinutes
     * @return string|null
     */
    public function getSignedUrl(string $path, int $expirationMinutes = 60): ?string
    {
        $this->ensureInitialized();
        if (!$this->useS3()) {
            return null;
        }

        try {
            $cmd = $this->s3Client->getCommand('GetObject', [
                'Bucket' => $this->s3Config['bucket'],
                'Key' => $path,
            ]);

            $request = $this->s3Client->createPresignedRequest(
                $cmd,
                "+{$expirationMinutes} minutes"
            );

            return (string) $request->getUri();

        } catch (\Exception $e) {
            Log::error('Failed to generate signed URL', [
                'path' => $path,
                'error' => $e->getMessage(),
            ]);

            return null;
        }
    }

    /**
     * Génère une URL signée pour une photo de profil utilisateur
     *
     * @param int $userId
     * @param string $filename
     * @param int $expirationMinutes
     * @return string|null
     */
    public function getProfilePictureUrl(int $userId, string $filename, int $expirationMinutes = 60): ?string
    {
        $path = $this->getUserPicturePath($userId, $filename);
        return $this->getSignedUrl($path, $expirationMinutes);
    }

    /**
     * Upload un fichier générique pour un utilisateur
     *
     * @param int $userId
     * @param UploadedFile $file
     * @param string $folder
     * @return array
     */
    public function uploadUserFile(int $userId, UploadedFile $file, string $folder = 'documents'): array
    {
        $this->ensureInitialized();
        try {
            $extension = $file->getClientOriginalExtension() ?: 'bin';
            $filename = Str::uuid() . '.' . $extension;
            $path = "{$this->getTenantPath()}/{$userId}/{$folder}/{$filename}";
            $content = $file->getContent();

            if ($this->useS3()) {
                $this->s3Client->putObject([
                    'Bucket' => $this->s3Config['bucket'],
                    'Key' => $path,
                    'Body' => $content,
                    'ContentType' => $file->getMimeType(),
                    'ACL' => 'private',
                    'Metadata' => [
                        'user_id' => (string) $userId,
                        'original_name' => $file->getClientOriginalName(),
                        'uploaded_at' => now()->toIso8601String(),
                    ],
                ]);
            } else {
                Storage::disk('local')->put($path, $content);
            }

            Log::info('User file uploaded', [
                'user_id' => $userId,
                'path' => $path,
                'folder' => $folder,
                'size' => strlen($content),
            ]);

            return [
                'success' => true,
                'path' => $path,
                'filename' => $filename,
                'original_name' => $file->getClientOriginalName(),
                'size' => strlen($content),
                'error' => null,
            ];

        } catch (\Exception $e) {
            Log::error('Failed to upload user file', [
                'user_id' => $userId,
                'folder' => $folder,
                'error' => $e->getMessage(),
            ]);

            return [
                'success' => false,
                'path' => null,
                'filename' => null,
                'error' => $e->getMessage(),
            ];
        }
    }

    /**
     * Liste tous les fichiers d'un utilisateur
     *
     * @param int $userId
     * @param string|null $folder
     * @return array
     */
    public function listUserFiles(int $userId, ?string $folder = null): array
    {
        $this->ensureInitialized();
        try {
            $basePath = "{$this->getTenantPath()}/{$userId}";
            if ($folder) {
                $basePath .= "/{$folder}";
            }

            if ($this->useS3()) {
                $result = $this->s3Client->listObjectsV2([
                    'Bucket' => $this->s3Config['bucket'],
                    'Prefix' => $basePath,
                ]);

                $files = [];
                foreach ($result['Contents'] ?? [] as $object) {
                    $files[] = [
                        'path' => $object['Key'],
                        'filename' => basename($object['Key']),
                        'size' => $object['Size'],
                        'last_modified' => $object['LastModified']->format('Y-m-d H:i:s'),
                    ];
                }

                return $files;
            } else {
                $files = Storage::disk('local')->allFiles($basePath);
                return array_map(function ($file) {
                    return [
                        'path' => $file,
                        'filename' => basename($file),
                        'size' => Storage::disk('local')->size($file),
                        'last_modified' => date('Y-m-d H:i:s', Storage::disk('local')->lastModified($file)),
                    ];
                }, $files);
            }

        } catch (\Exception $e) {
            Log::error('Failed to list user files', [
                'user_id' => $userId,
                'folder' => $folder,
                'error' => $e->getMessage(),
            ]);

            return [];
        }
    }

    /**
     * Supprime tous les fichiers d'un utilisateur
     *
     * @param int $userId
     * @return bool
     */
    public function deleteAllUserFiles(int $userId): bool
    {
        $this->ensureInitialized();
        try {
            $basePath = "{$this->getTenantPath()}/{$userId}";

            if ($this->useS3()) {
                // Liste et supprime tous les objets
                $result = $this->s3Client->listObjectsV2([
                    'Bucket' => $this->s3Config['bucket'],
                    'Prefix' => $basePath,
                ]);

                if (!empty($result['Contents'])) {
                    $objects = array_map(function ($object) {
                        return ['Key' => $object['Key']];
                    }, $result['Contents']);

                    $this->s3Client->deleteObjects([
                        'Bucket' => $this->s3Config['bucket'],
                        'Delete' => ['Objects' => $objects],
                    ]);
                }
            } else {
                Storage::disk('local')->deleteDirectory($basePath);
            }

            Log::info('All user files deleted', [
                'user_id' => $userId,
                'path' => $basePath,
            ]);

            return true;

        } catch (\Exception $e) {
            Log::error('Failed to delete all user files', [
                'user_id' => $userId,
                'error' => $e->getMessage(),
            ]);

            return false;
        }
    }

    /**
     * Vérifie si S3 est disponible
     */
    public function useS3(): bool
    {
        $this->ensureInitialized();
        return $this->s3Client !== null && $this->s3Config !== null;
    }

    /**
     * Retourne le disque actuellement utilisé
     */
    public function getCurrentDisk(): string
    {
        return $this->disk;
    }

    /**
     * Valide qu'un fichier est une image valide
     *
     * @param UploadedFile $file
     * @throws \InvalidArgumentException
     */
    protected function validateImage(UploadedFile $file): void
    {
        $allowedMimes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        $maxSize = 5 * 1024 * 1024; // 5 MB

        if (!in_array($file->getMimeType(), $allowedMimes)) {
            throw new \InvalidArgumentException(
                'Invalid file type. Allowed types: JPEG, PNG, GIF, WebP'
            );
        }

        if ($file->getSize() > $maxSize) {
            throw new \InvalidArgumentException(
                'File too large. Maximum size: 5MB'
            );
        }
    }

    /**
     * Optimise une image (redimensionnement si trop grande)
     *
     * @param UploadedFile $file
     * @return string
     */
    protected function optimizeImage(UploadedFile $file): string
    {
        // Si GD est disponible, on peut optimiser l'image
        if (!extension_loaded('gd')) {
            return $file->getContent();
        }

        try {
            $image = @imagecreatefromstring($file->getContent());

            if ($image === false) {
                return $file->getContent();
            }

            $width = imagesx($image);
            $height = imagesy($image);
            $maxDimension = 800;

            // Redimensionner si l'image est trop grande
            if ($width > $maxDimension || $height > $maxDimension) {
                $ratio = min($maxDimension / $width, $maxDimension / $height);
                $newWidth = (int) ($width * $ratio);
                $newHeight = (int) ($height * $ratio);

                $newImage = imagecreatetruecolor($newWidth, $newHeight);

                // Préserver la transparence pour PNG et WebP
                imagealphablending($newImage, false);
                imagesavealpha($newImage, true);

                imagecopyresampled(
                    $newImage,
                    $image,
                    0, 0, 0, 0,
                    $newWidth, $newHeight,
                    $width, $height
                );

                imagedestroy($image);
                $image = $newImage;
            }

            // Convertir en JPEG pour la compression
            ob_start();
            imagejpeg($image, null, 85);
            $content = ob_get_clean();

            imagedestroy($image);

            return $content;

        } catch (\Exception $e) {
            // En cas d'erreur, retourner le contenu original
            return $file->getContent();
        }
    }

    /**
     * Calcule l'espace utilisé par un utilisateur
     *
     * @param int $userId
     * @return int Taille en bytes
     */
    public function getUserStorageUsage(int $userId): int
    {
        $this->ensureInitialized();
        try {
            $basePath = "{$this->getTenantPath()}/{$userId}";

            if ($this->useS3()) {
                $result = $this->s3Client->listObjectsV2([
                    'Bucket' => $this->s3Config['bucket'],
                    'Prefix' => $basePath,
                ]);

                $totalSize = 0;
                foreach ($result['Contents'] ?? [] as $object) {
                    $totalSize += $object['Size'];
                }

                return $totalSize;
            } else {
                $files = Storage::disk('local')->allFiles($basePath);
                $totalSize = 0;
                foreach ($files as $file) {
                    $totalSize += Storage::disk('local')->size($file);
                }
                return $totalSize;
            }

        } catch (\Exception $e) {
            return 0;
        }
    }
}
