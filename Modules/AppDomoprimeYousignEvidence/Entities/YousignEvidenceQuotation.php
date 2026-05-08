<?php

namespace Modules\AppDomoprimeYousignEvidence\Entities;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Modules\AppDomoprime\Entities\DomoprimeQuotation;

/**
 * Junction table linking a quotation to its Yousign Evidence signature record.
 * Symfony: t_domoprime_yousign_evidence_quotation.
 */
class YousignEvidenceQuotation extends Model
{
    protected $connection = 'tenant';

    protected $table = 't_domoprime_yousign_evidence_quotation';

    public $timestamps = true;

    protected $fillable = [
        'meeting_id',
        'contract_id',
        'quotation_id',
        'sign_id',
        'is_last',
        'creator_id',
    ];

    public function file(): BelongsTo
    {
        return $this->belongsTo(YousignEvidenceFile::class, 'sign_id');
    }

    public function quotation(): BelongsTo
    {
        return $this->belongsTo(DomoprimeQuotation::class, 'quotation_id');
    }
}
