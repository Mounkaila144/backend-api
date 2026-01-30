<?php

namespace Modules\Superadmin\Entities;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Crypt;

class ServiceConfig extends Model
{
    protected $connection = 'mysql';
    protected $table = 't_service_config';
    public $timestamps = false;

    protected $fillable = [
        'service_name',
        'config',
        'updated_at',
        'updated_by',
    ];

    protected $casts = [
        'updated_at' => 'datetime',
    ];

    /**
     * Champs sensibles qui doivent être chiffrés
     */
    protected static array $sensitiveFields = [
        'aws_secret_key',
        'secret_key',
        'password',
        'api_key',
        'master_key',
    ];

    /**
     * Retourne la liste des champs sensibles
     */
    public static function getSensitiveFields(): array
    {
        return static::$sensitiveFields;
    }

    /**
     * Récupère la config avec les champs sensibles déchiffrés
     */
    public function getDecryptedConfig(): array
    {
        $config = json_decode($this->attributes['config'] ?? '{}', true);

        foreach (static::$sensitiveFields as $field) {
            if (isset($config[$field]) && !empty($config[$field])) {
                try {
                    $config[$field] = Crypt::decryptString($config[$field]);
                } catch (\Exception $e) {
                    // Valeur non chiffrée ou erreur - garder telle quelle
                }
            }
        }

        return $config;
    }

    /**
     * Sauvegarde la config en chiffrant les champs sensibles
     */
    public function setEncryptedConfig(array $config): void
    {
        foreach (static::$sensitiveFields as $field) {
            if (isset($config[$field]) && !empty($config[$field])) {
                $config[$field] = Crypt::encryptString($config[$field]);
            }
        }

        $this->attributes['config'] = json_encode($config);
    }

    /**
     * Accessor pour config - retourne déchiffré
     */
    public function getConfigAttribute($value): array
    {
        return $this->getDecryptedConfig();
    }

    /**
     * Mutator pour config - chiffre avant sauvegarde
     */
    public function setConfigAttribute(array $value): void
    {
        $this->setEncryptedConfig($value);
    }

    /**
     * Récupère la config pour affichage (masque les secrets)
     */
    public function getConfigForDisplay(): array
    {
        $config = $this->getDecryptedConfig();

        foreach (static::$sensitiveFields as $field) {
            if (isset($config[$field])) {
                $config[$field] = '********';
            }
        }

        return $config;
    }
}
