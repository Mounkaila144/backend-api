<?php

namespace Modules\AppDomoprimeYousignEvidence\Entities;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Modules\AppDomoprime\Entities\DomoprimeBilling;

/**
 * Junction table linking a billing to its Yousign Evidence signature record.
 * Symfony: t_domoprime_yousign_evidence_billing.
 */
class YousignEvidenceBilling extends Model
{
    protected $connection = 'tenant';

    protected $table = 't_domoprime_yousign_evidence_billing';

    public $timestamps = true;

    protected $fillable = [
        'contract_id',
        'billing_id',
        'sign_id',
        'is_last',
        'creator_id',
    ];

    public function file(): BelongsTo
    {
        return $this->belongsTo(YousignEvidenceFile::class, 'sign_id');
    }

    public function billing(): BelongsTo
    {
        return $this->belongsTo(DomoprimeBilling::class, 'billing_id');
    }
}
