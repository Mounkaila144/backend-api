<?php

namespace Modules\AppDomoprimeISO3\Services\Quotations;

class QuotationReferenceGenerator
{
    public function format(?string $format, array $values): string
    {
        $id = (string) ($values['id'] ?? '');
        $format = trim((string) $format);

        if ($format === '') {
            return "DEV-{$id}";
        }

        return strtr($format, [
            '{id}' => $id,
            '{id_company}' => (string) ($values['id_company'] ?? ''),
            '{id_work}' => (string) ($values['id_work'] ?? ''),
            '{sav_at}' => (string) ($values['sav_at'] ?? ''),
            '{opc_at}' => (string) ($values['opc_at'] ?? ''),
        ]);
    }
}
