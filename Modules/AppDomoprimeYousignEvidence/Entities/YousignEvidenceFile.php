<?php

namespace Modules\AppDomoprimeYousignEvidence\Entities;

use Illuminate\Database\Eloquent\Model;

/**
 * Canonical signature record. One row per Yousign Evidence file (per signer).
 *
 * Symfony source: t_services_yousign_evidence_file (mfObject3 mapping).
 *
 * Notes:
 *   - is_initiator / is_loaded / is_signed are enum('YES','NO'), NOT booleans.
 *   - signed_at is nullable; legacy rows may also have '0000-00-00 00:00:00'.
 *   - Multiple files can share a procedure (a Yousign "signature_request" / batch).
 */
class YousignEvidenceFile extends Model
{
    protected $connection = 'tenant';

    protected $table = 't_services_yousign_evidence_file';

    public $timestamps = true;

    protected $fillable = [
        'id_procedure',
        'id_file',
        'id_request',
        'filename',
        'sha256',
        'firstname',
        'lastname',
        'email',
        'phone',
        'type',
        'status',
        'errors',
        'batch',
        'is_initiator',
        'is_loaded',
        'is_signed',
        'signed_at',
        'state',
    ];

    protected $casts = [
        'signed_at' => 'datetime',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    public function isSigned(): bool
    {
        return $this->is_signed === 'YES';
    }

    public function isInitiator(): bool
    {
        return $this->is_initiator === 'YES';
    }

    public function getSignedAtIso(): ?string
    {
        if (! $this->isSigned()) {
            return null;
        }

        $raw = (string) ($this->getRawOriginal('signed_at') ?? '');

        if ($raw === '' || str_starts_with($raw, '0000-00-00')) {
            return null;
        }

        return $this->signed_at?->toIso8601String();
    }
}
