<?php

namespace Modules\AppDomoprimeISO3\Http\Controllers\Admin;

use Barryvdh\Snappy\Facades\SnappyPdf;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Modules\AppDomoprime\Entities\DomoprimeBilling;
use Modules\AppDomoprime\Entities\DomoprimeQuotation;
use Modules\AppDomoprime\Entities\DomoprimeQuotationModel;
use Modules\AppDomoprimeISO3\Services\Documents\Iso3HtmlBuilder;
use Modules\CustomersContracts\Entities\CustomerContract;

/**
 * Email delivery for ISO3 documents:
 * sends quotation / billing PDFs as attachments to the contract's customer
 * and lists available email model templates for the quotation send dialog.
 *
 * PDF markup is composed by {@see Iso3HtmlBuilder} (a plain service, no controller
 * coupling). The output is then handed to SnappyPdf to produce the actual PDF.
 */
class Iso3EmailController extends Controller
{
    public function __construct(private readonly Iso3HtmlBuilder $html) {}

    /**
     * Send billing email to customer.
     */
    public function sendBillingEmail(int $id): JsonResponse
    {
        $billing = DomoprimeBilling::with('billingProducts')->findOrFail($id);

        $contract = $billing->contract_id
            ? CustomerContract::with('customer')->find($billing->contract_id)
            : null;

        $customer = $contract?->customer;

        if (!$customer || !$customer->email) {
            return response()->json([
                'success' => false,
                'message' => 'Customer has no email address',
            ], 422);
        }

        // Generate PDF
        $pdf = SnappyPdf::loadHTML($this->html->billing($billing, $contract));
        $pdfContent = $pdf->output();

        $filename = 'facture_' . ($billing->reference ?: $billing->id) . '.pdf';

        // Send email
        \Illuminate\Support\Facades\Mail::raw(
            'Veuillez trouver ci-joint votre facture ' . ($billing->reference ?: '') . '.',
            function ($message) use ($customer, $pdfContent, $filename, $billing) {
                $message->to($customer->email)
                    ->subject('Facture ' . ($billing->reference ?: ''))
                    ->attachData($pdfContent, $filename, ['mime' => 'application/pdf']);
            }
        );

        return response()->json([
            'success' => true,
            'message' => 'Billing email sent to ' . $customer->email,
        ]);
    }

    /**
     * Send a quotation email using a model template.
     */
    public function sendQuotationEmail(Request $request, int $id): JsonResponse
    {
        $quotation = DomoprimeQuotation::findOrFail($id);

        $contract = $quotation->contract_id
            ? CustomerContract::with('customer')->find($quotation->contract_id)
            : null;

        $customer = $contract?->customer;

        if (!$customer || !$customer->email) {
            return response()->json([
                'success' => false,
                'message' => 'Customer has no email address',
            ], 422);
        }

        // Generate quotation PDF
        $pdf = SnappyPdf::loadHTML($this->html->quotation($quotation, $contract));
        $pdfContent = $pdf->output();
        $filename = 'devis_' . ($quotation->reference ?: $quotation->id) . '.pdf';

        \Illuminate\Support\Facades\Mail::raw(
            'Veuillez trouver ci-joint votre devis ' . ($quotation->reference ?: '') . '.',
            function ($message) use ($customer, $pdfContent, $filename, $quotation) {
                $message->to($customer->email)
                    ->subject('Devis ' . ($quotation->reference ?: ''))
                    ->attachData($pdfContent, $filename, ['mime' => 'application/pdf']);
            }
        );

        return response()->json([
            'success' => true,
            'message' => 'Quotation email sent to ' . $customer->email,
        ]);
    }

    /**
     * List email model options for quotation sending.
     */
    public function listQuotationEmailModels(int $contractId): JsonResponse
    {
        // Load available email models from partner polluter quotation config
        $models = DomoprimeQuotationModel::with([
            'translations' => fn ($q) => $q->where('lang', app()->getLocale()),
        ])->get()->map(fn ($m) => [
            'id'      => $m->id,
            'subject' => $m->translations->first()?->value ?? $m->name ?? '-',
        ]);

        return response()->json([
            'success' => true,
            'data'    => $models,
        ]);
    }
}
