<?php

namespace Modules\AppDomoprimeYousignEvidence\Services;

/**
 * Builds Yousign V3 signature_request payloads from domain inputs.
 *
 * Phase C deliverable — currently scaffolded with the minimal shape needed
 * for `createSignatureRequest`. Implement once the first concrete envelope
 * (devis ITE) is signed end-to-end.
 */
class SignatureRequestBuilder
{
    public function buildForQuotation(array $contract, array $quotation, array $signer, array $documents): array
    {
        return [
            'name' => 'Devis ' . ($quotation['reference'] ?? $quotation['id']),
            'delivery_mode' => 'email',
            'ordered_signers' => false,
            'signers' => [
                [
                    'info' => [
                        'first_name' => $signer['firstname'] ?? '',
                        'last_name' => $signer['lastname'] ?? '',
                        'email' => $signer['email'] ?? '',
                        'phone_number' => $signer['phone'] ?? '',
                        'locale' => 'fr',
                    ],
                    'signature_level' => 'electronic_signature',
                    'signature_authentication_mode' => 'no_otp',
                ],
            ],
            'documents' => $documents,
            'metadata' => [
                'contract_id' => (string) ($contract['id'] ?? ''),
                'quotation_id' => (string) ($quotation['id'] ?? ''),
                'kind' => 'quotation',
            ],
        ];
    }

    public function buildForBilling(array $contract, array $billing, array $signer, array $documents): array
    {
        $payload = $this->buildForQuotation($contract, $billing, $signer, $documents);
        $payload['name'] = 'Facture ' . ($billing['reference'] ?? $billing['id']);
        $payload['metadata'] = [
            'contract_id' => (string) ($contract['id'] ?? ''),
            'billing_id' => (string) ($billing['id'] ?? ''),
            'kind' => 'billing',
        ];

        return $payload;
    }
}
