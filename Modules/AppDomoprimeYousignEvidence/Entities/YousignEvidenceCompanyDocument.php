<?php

namespace Modules\AppDomoprimeYousignEvidence\Entities;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Junction table linking a contract+company-model to its Yousign Evidence signature record.
 * Symfony: t_domoprime_yousign_evidence_company_document.
 */
class YousignEvidenceCompanyDocument extends Model
{
    protected $connection = 'tenant';

    protected $table = 't_domoprime_yousign_evidence_company_document';

    public $timestamps = true;

    protected $fillable = [
        'meeting_id',
        'contract_id',
        'model_id',
        'sign_id',
        'is_last',
        'creator_id',
    ];

    public function file(): BelongsTo
    {
        return $this->belongsTo(YousignEvidenceFile::class, 'sign_id');
    }
}
