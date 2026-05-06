<?php

namespace Modules\AppDomoprimeISO3\Services\Documents;

use Modules\AppDomoprime\Entities\DomoprimeQuotation;
use Modules\AppDomoprime\Entities\DomoprimeQuotationModel;
use Modules\AppDomoprime\Entities\DomoprimeQuotationModelI18n;
use Modules\AppDomoprime\Entities\PartnerPolluterQuotation;
use RuntimeException;

/**
 * Resolves the quotation model + i18n body to use when rendering a PDF.
 *
 * Mirrors Symfony's DomoprimeITEDocumentsGenerator behaviour:
 *   1. polluter-specific model from t_partner_polluter_quotation
 *   2. fallback to the tenant default (first available model)
 *   3. load t_domoprime_quotation_model_i18n for the requested lang
 *      (or the first available one if the lang is missing).
 */
class QuotationPdfModelResolver
{
    public function resolve(DomoprimeQuotation $quotation, string $lang = 'fr'): array
    {
        $modelId = $this->resolveModelId($quotation);
        if ($modelId <= 0) {
            throw new RuntimeException('No quotation model configured for this tenant.');
        }

        $i18n = $this->loadI18n($modelId, $lang);
        if (! $i18n || trim((string) $i18n->body) === '') {
            throw new RuntimeException(
                sprintf('Quotation model %d has no body for lang "%s".', $modelId, $lang)
            );
        }

        return [
            'model_id' => (int) $modelId,
            'lang' => (string) $i18n->lang,
            'subject' => (string) ($i18n->value ?? ''),
            'body' => (string) $i18n->body,
        ];
    }

    private function resolveModelId(DomoprimeQuotation $quotation): int
    {
        $polluterId = $this->extractPolluterId($quotation);
        if ($polluterId > 0) {
            $modelId = (int) PartnerPolluterQuotation::query()
                ->where('polluter_id', $polluterId)
                ->whereNotNull('model_id')
                ->value('model_id');
            if ($modelId > 0) {
                return $modelId;
            }
        }

        return (int) DomoprimeQuotationModel::query()->orderBy('id')->value('id');
    }

    private function loadI18n(int $modelId, string $lang): ?DomoprimeQuotationModelI18n
    {
        $i18n = DomoprimeQuotationModelI18n::query()
            ->where('model_id', $modelId)
            ->where('lang', $lang)
            ->first();

        if ($i18n) {
            return $i18n;
        }

        return DomoprimeQuotationModelI18n::query()
            ->where('model_id', $modelId)
            ->orderBy('id')
            ->first();
    }

    private function extractPolluterId(DomoprimeQuotation $quotation): int
    {
        if ($quotation->relationLoaded('contract') && $quotation->contract) {
            $polluter = $quotation->contract->relationLoaded('polluter')
                ? $quotation->contract->polluter
                : null;
            if ($polluter && $polluter->id) {
                return (int) $polluter->id;
            }
            if ($quotation->contract->polluter_id) {
                return (int) $quotation->contract->polluter_id;
            }
        }

        return (int) ($quotation->polluter_id ?? 0);
    }
}
