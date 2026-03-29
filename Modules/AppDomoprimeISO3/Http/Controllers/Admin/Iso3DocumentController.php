<?php

namespace Modules\AppDomoprimeISO3\Http\Controllers\Admin;

use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Routing\Controller;
use Symfony\Component\HttpFoundation\BinaryFileResponse;
use Modules\AppDomoprime\Entities\DomoprimeAsset;
use Modules\AppDomoprime\Entities\DomoprimeBilling;
use Modules\AppDomoprime\Entities\DomoprimeQuotation;
use Modules\AppDomoprime\Entities\DomoprimeQuotationModel;
use Modules\AppDomoprime\Entities\DomoprimeQuotationProductItem;
use Modules\AppDomoprime\Entities\DomoprimeSubventionType;
use Modules\AppDomoprime\Services\PreMeetingDocumentService;
use Modules\CustomersContracts\Entities\CustomerContract;

class Iso3DocumentController extends Controller
{
    /**
     * List all quotations for a contract.
     */
    public function listQuotations(Request $request, int $contractId): JsonResponse
    {
        $contract = CustomerContract::find($contractId);

        if (! $contract) {
            return response()->json([
                'success' => false,
                'message' => 'Contract not found',
            ], 404);
        }

        $quotations = DomoprimeQuotation::where('contract_id', $contractId)
            ->with(['products', 'calculation', 'subventionType', 'creator:id,firstname,lastname'])
            ->orderByDesc('id')
            ->get();

        return response()->json([
            'success' => true,
            'data'    => [
                'quotations' => $quotations,
                'pagination' => null,
            ],
        ]);
    }

    /**
     * List all billings for a contract.
     */
    public function listBillings(Request $request, int $contractId): JsonResponse
    {
        $contract = CustomerContract::find($contractId);

        if (! $contract) {
            return response()->json([
                'success' => false,
                'message' => 'Contract not found',
            ], 404);
        }

        $billings = DomoprimeBilling::where('contract_id', $contractId)
            ->with(['billingProducts', 'quotation', 'calculation', 'subventionType'])
            ->orderByDesc('id')
            ->get();

        return response()->json([
            'success' => true,
            'data'    => [
                'billings'   => $billings,
                'pagination' => null,
            ],
        ]);
    }

    /**
     * List all quotations for a meeting (via linked contract or directly).
     */
    public function listQuotationsForMeeting(Request $request, int $meetingId): JsonResponse
    {
        $meeting = \Modules\CustomersMeetings\Entities\CustomerMeeting::find($meetingId);

        if (! $meeting) {
            return response()->json(['success' => false, 'message' => 'Meeting not found'], 404);
        }

        // Find quotations linked to contracts of this meeting
        $contractIds = CustomerContract::where('meeting_id', $meetingId)->pluck('id');

        $quotations = DomoprimeQuotation::whereIn('contract_id', $contractIds)
            ->with(['products', 'calculation', 'subventionType', 'creator:id,firstname,lastname'])
            ->orderByDesc('id')
            ->get();

        return response()->json([
            'success' => true,
            'data' => [
                'quotations' => $quotations,
                'pagination' => null,
            ],
        ]);
    }

    // ---------------------------------------------------------------
    // Quotation Actions
    // ---------------------------------------------------------------

    /**
     * Disable a quotation (set status to DELETE).
     */
    public function disableQuotation(int $id): JsonResponse
    {
        $quotation = DomoprimeQuotation::findOrFail($id);
        $quotation->update(['status' => 'DELETE']);

        return response()->json(['success' => true, 'message' => 'Quotation disabled']);
    }

    /**
     * Enable a quotation (set status to ACTIVE).
     */
    public function enableQuotation(int $id): JsonResponse
    {
        $quotation = DomoprimeQuotation::findOrFail($id);
        $quotation->update(['status' => 'ACTIVE']);

        return response()->json(['success' => true, 'message' => 'Quotation enabled']);
    }

    /**
     * Permanently delete a quotation and its related products/items.
     */
    public function destroyQuotation(int $id): JsonResponse
    {
        $quotation = DomoprimeQuotation::findOrFail($id);

        // Delete related items first, then products, then quotation
        $quotation->productItems()->delete();
        $quotation->products()->delete();
        $quotation->delete();

        return response()->json(['success' => true, 'message' => 'Quotation deleted permanently']);
    }

    /**
     * Create a billing from a quotation.
     */
    public function createBillingFromQuotation(Request $request, int $id): JsonResponse
    {
        $quotation = DomoprimeQuotation::with(['products.items'])->findOrFail($id);

        $sendEmail = $request->boolean('send_email', false);
        $createAsset = $request->boolean('create_asset', false);

        // Create billing from quotation data
        $billing = DomoprimeBilling::create([
            'reference'                 => str_replace('DEV', 'FAC', $quotation->reference),
            'month'                     => now()->month,
            'day'                       => now()->day,
            'year'                      => now()->year,
            'dated_at'                  => now(),
            'number_of_parts'           => $quotation->number_of_parts,
            'total_sale_with_tax'       => $quotation->total_sale_with_tax,
            'total_sale_without_tax'    => $quotation->total_sale_without_tax,
            'total_tax'                 => $quotation->total_tax,
            'total_purchase_with_tax'   => $quotation->total_purchase_with_tax,
            'total_purchase_without_tax' => $quotation->total_purchase_without_tax,
            'taxes'                     => $quotation->taxes,
            'subvention'                => $quotation->subvention,
            'bbc_subvention'            => $quotation->bbc_subvention,
            'passoire_subvention'       => $quotation->passoire_subvention,
            'prime'                     => $quotation->prime,
            'cee_prime'                 => $quotation->cee_prime,
            'pack_prime'                => $quotation->pack_prime,
            'ana_prime'                 => $quotation->ana_prime,
            'ana_pack_prime'            => $quotation->ana_pack_prime,
            'ite_prime'                 => $quotation->ite_prime,
            'fixed_prime'               => $quotation->fixed_prime,
            'fee_file'                  => $quotation->fee_file,
            'rest_in_charge'            => $quotation->rest_in_charge,
            'home_prime'                => $quotation->home_prime,
            'discount_amount'           => $quotation->discount_amount,
            'qmac_value'               => $quotation->qmac_value,
            'tax_credit'               => $quotation->tax_credit,
            'number_of_children'        => $quotation->number_of_children,
            'number_of_people'          => $quotation->number_of_people,
            'tax_credit_used'           => $quotation->tax_credit_used,
            'tax_credit_limit'          => $quotation->tax_credit_limit,
            'rest_in_charge_after_credit' => $quotation->rest_in_charge_after_credit,
            'tax_credit_available'      => $quotation->tax_credit_available,
            'meeting_id'                => $quotation->meeting_id,
            'contract_id'               => $quotation->contract_id,
            'calculation_id'            => $quotation->calculation_id,
            'company_id'                => $quotation->company_id,
            'polluter_id'               => $quotation->polluter_id,
            'customer_id'               => $quotation->customer_id,
            'creator_id'                => auth()->id(),
            'quotation_id'              => $quotation->id,
            'work_id'                   => $quotation->work_id,
            'subvention_type_id'        => $quotation->subvention_type_id,
            'status_id'                 => $quotation->status_id,
            'comments'                  => $quotation->comments,
            'status'                    => 'ACTIVE',
            'is_last'                   => 'YES',
        ]);

        // Copy products to billing
        foreach ($quotation->products as $product) {
            $billing->billingProducts()->create([
                'product_id'                     => $product->product_id,
                'contract_id'                    => $quotation->contract_id,
                'title'                          => $product->title,
                'entitled'                       => $product->entitled,
                'quantity'                        => $product->quantity,
                'prime'                           => $product->prime,
                'tva_id'                          => $product->tva_id,
                'description'                     => $product->description,
                'details'                         => $product->details,
                'status'                          => $product->status,
                'purchase_price_with_tax'         => $product->purchase_price_with_tax,
                'purchase_price_without_tax'      => $product->purchase_price_without_tax,
                'sale_price_with_tax'             => $product->sale_price_with_tax,
                'sale_price_without_tax'          => $product->sale_price_without_tax,
                'total_purchase_price_with_tax'   => $product->total_purchase_price_with_tax,
                'total_purchase_price_without_tax' => $product->total_purchase_price_without_tax,
                'total_sale_price_with_tax'       => $product->total_sale_price_with_tax,
                'total_sale_price_without_tax'    => $product->total_sale_price_without_tax,
            ]);
        }

        // Handle send_email flag
        if ($sendEmail) {
            try {
                $this->sendBillingEmail($billing->id);
            } catch (\Throwable $e) {
                // Log but don't fail the billing creation
                \Illuminate\Support\Facades\Log::warning('Billing email failed: ' . $e->getMessage());
            }
        }

        // Handle create_asset flag
        if ($createAsset) {
            try {
                $this->createAssetFromBilling($billing->id);
            } catch (\Throwable $e) {
                \Illuminate\Support\Facades\Log::warning('Asset creation failed: ' . $e->getMessage());
            }
        }

        return response()->json([
            'success' => true,
            'message' => 'Billing created from quotation',
            'data'    => $billing->load('billingProducts'),
        ]);
    }

    // ---------------------------------------------------------------
    // Quotation Show / Edit / Subvention Types
    // ---------------------------------------------------------------

    /**
     * Show a single quotation with products and items (for the edit form).
     */
    public function showQuotation(int $id): JsonResponse
    {
        $quotation = DomoprimeQuotation::with([
            'products.items',
            'calculation',
            'subventionType',
            'creator:id,firstname,lastname',
        ])->findOrFail($id);

        return response()->json([
            'success' => true,
            'data'    => $quotation,
        ]);
    }

    /**
     * Update a quotation (date, subvention type, product items quantities/prices).
     * Matches Symfony SaveITEQuotation3FromRequestForViewContract action.
     */
    public function updateQuotation(Request $request, int $id): JsonResponse
    {
        $quotation = DomoprimeQuotation::with(['products.items'])->findOrFail($id);

        // Update quotation-level fields
        $updates = [];

        if ($request->has('dated_at')) {
            $updates['dated_at'] = $request->input('dated_at');
        }

        if ($request->has('subvention_type_id')) {
            $updates['subvention_type_id'] = $request->input('subvention_type_id');
        }

        if ($request->has('discount_amount')) {
            $updates['discount_amount'] = (float) $request->input('discount_amount', 0);
        }

        if ($request->has('ana_prime')) {
            $updates['ana_prime'] = (float) $request->input('ana_prime', 0);
        }

        if ($request->has('prime')) {
            $updates['prime'] = (float) $request->input('prime', 0);
        }

        if (! empty($updates)) {
            $quotation->update($updates);
        }

        // Update product items (quantities and prices)
        if ($request->has('items') && is_array($request->input('items'))) {
            foreach ($request->input('items') as $itemData) {
                if (! isset($itemData['id'])) {
                    continue;
                }

                $item = DomoprimeQuotationProductItem::find($itemData['id']);

                if (! $item || $item->quotation_id !== $quotation->id) {
                    continue;
                }

                $itemUpdates = [];

                if (isset($itemData['quantity'])) {
                    $itemUpdates['quantity'] = (float) $itemData['quantity'];
                }

                if (isset($itemData['sale_price_without_tax'])) {
                    $itemUpdates['sale_price_without_tax'] = (float) $itemData['sale_price_without_tax'];
                }

                if (! empty($itemUpdates)) {
                    $item->update($itemUpdates);
                }
            }
        }

        // Reload and return
        $quotation->refresh();
        $quotation->load(['products.items', 'calculation', 'subventionType', 'creator:id,firstname,lastname']);

        return response()->json([
            'success' => true,
            'data'    => $quotation,
            'message' => 'Quotation updated successfully',
        ]);
    }

    /**
     * List subvention types (for the edit form dropdown).
     */
    public function listSubventionTypes(): JsonResponse
    {
        $types = DomoprimeSubventionType::orderBy('name')->get();

        return response()->json([
            'success' => true,
            'data'    => $types,
        ]);
    }

    // ---------------------------------------------------------------
    // PDF Export endpoints
    // ---------------------------------------------------------------

    /**
     * Export a single quotation as PDF.
     *
     * If the contract has a polluter with a pre-meeting model configured,
     * generates the PDF using PDFtk form filling + logo overlay (same as old Symfony system).
     * Otherwise falls back to DomPDF HTML generation.
     */
    public function exportPdf(int $id): Response|BinaryFileResponse
    {
        $quotation = DomoprimeQuotation::with(['products', 'calculation', 'subventionType'])
            ->findOrFail($id);

        $contract = $quotation->contract_id
            ? CustomerContract::with(['customer', 'polluter', 'company', 'partnerLayer'])->find($quotation->contract_id)
            : null;

        // Try pre-meeting PDF generation (reproduces old Symfony system)
        if ($contract && $contract->polluter_id) {
            $preMeetingService = app(PreMeetingDocumentService::class);
            $pdfPath = $preMeetingService->generate($contract);
            if ($pdfPath && file_exists($pdfPath)) {
                $filename = 'devis_' . ($quotation->reference ?: $quotation->id) . '.pdf';
                return response()->download($pdfPath, $filename, [
                    'Content-Type' => 'application/pdf',
                ])->deleteFileAfterSend(true);
            }
        }

        // Fallback: DomPDF HTML generation
        $html = $this->buildQuotationHtml($quotation, $contract);

        $pdf = Pdf::loadHTML($html)->setPaper('a4');

        $filename = 'devis_' . ($quotation->reference ?: $quotation->id) . '.pdf';

        return $pdf->download($filename);
    }

    /**
     * Export all documents (quotation + billings) as a merged PDF.
     */
    public function exportAllPdf(int $id): Response
    {
        $quotation = DomoprimeQuotation::with(['products', 'billings.billingProducts', 'calculation', 'subventionType'])
            ->findOrFail($id);

        $contract = $quotation->contract_id
            ? CustomerContract::with('customer')->find($quotation->contract_id)
            : null;

        $html = $this->buildQuotationHtml($quotation, $contract);

        // Append billings pages
        foreach ($quotation->billings as $billing) {
            $html .= '<div style="page-break-before: always;"></div>';
            $html .= $this->buildBillingHtml($billing, $contract);
        }

        $pdf = Pdf::loadHTML($html)->setPaper('a4');

        $filename = 'documents_' . ($quotation->reference ?: $quotation->id) . '.pdf';

        return $pdf->download($filename);
    }

    /**
     * Export signed quotation PDF (only if signed).
     */
    public function exportSignedPdf(int $id): Response
    {
        $quotation = DomoprimeQuotation::with(['products', 'calculation', 'subventionType'])
            ->findOrFail($id);

        if ($quotation->is_signed !== 'YES') {
            abort(422, 'Quotation is not signed.');
        }

        $contract = $quotation->contract_id
            ? CustomerContract::with('customer')->find($quotation->contract_id)
            : null;

        $html = $this->buildQuotationHtml($quotation, $contract, true);

        $pdf = Pdf::loadHTML($html)->setPaper('a4');

        $filename = 'devis_signe_' . ($quotation->reference ?: $quotation->id) . '.pdf';

        return $pdf->download($filename);
    }

    // ---------------------------------------------------------------
    // Contract-level document PDF exports
    // ---------------------------------------------------------------

    /**
     * Export pre-meeting document PDF for a contract.
     * Symfony: ExportPolluterPreMeetingDocumentPdf?Contract={id}
     */
    public function exportPreMeetingPdf(int $contractId)
    {
        $contract = CustomerContract::with('customer')->findOrFail($contractId);

        try {
            $service = app(PreMeetingDocumentService::class);
            $pdfPath = $service->generate($contract);

            if ($pdfPath && file_exists($pdfPath)) {
                return response()->download($pdfPath, 'document_pre_visite_' . $contractId . '.pdf');
            }
        } catch (\Throwable $e) {
            // Fallback to simple HTML PDF
        }

        // Fallback: generate a simple PDF
        $customer = $contract->customer;
        $customerName = $customer
            ? trim(($customer->first_name ?? '') . ' ' . ($customer->last_name ?? ''))
            : '-';

        $html = "<html><body style='font-family:sans-serif;margin:30px;'>
            <h1>Document de pré visite</h1>
            <p><strong>Contrat:</strong> " . e($contract->reference ?: $contractId) . "</p>
            <p><strong>Client:</strong> " . e($customerName) . "</p>
            <p><strong>Date:</strong> " . date('d/m/Y') . "</p>
        </body></html>";

        return Pdf::loadHTML($html)->setPaper('a4')->download('document_pre_visite_' . $contractId . '.pdf');
    }

    /**
     * Export after-work document PDF for a contract.
     * Symfony: ExportPolluterAfterWorkDocumentPdf?Contract={id}
     */
    public function exportAfterWorkPdf(int $contractId)
    {
        $contract = CustomerContract::with('customer')->findOrFail($contractId);
        $customer = $contract->customer;
        $customerName = $customer
            ? trim(($customer->first_name ?? '') . ' ' . ($customer->last_name ?? ''))
            : '-';

        $html = "<html><body style='font-family:sans-serif;margin:30px;'>
            <h1>Document fin de travaux</h1>
            <p><strong>Contrat:</strong> " . e($contract->reference ?: $contractId) . "</p>
            <p><strong>Client:</strong> " . e($customerName) . "</p>
            <p><strong>Date:</strong> " . date('d/m/Y') . "</p>
        </body></html>";

        return Pdf::loadHTML($html)->setPaper('a4')->download('document_fin_travaux_' . $contractId . '.pdf');
    }

    /**
     * Export all documents PDF for a contract.
     * Symfony: ExportAllDocumentsPdf?contract={id}
     */
    public function exportAllDocumentsByContractPdf(int $contractId)
    {
        // Find the last quotation for this contract to reuse existing logic
        $quotation = DomoprimeQuotation::where('contract_id', $contractId)
            ->where('status', 'ACTIVE')
            ->orderByDesc('id')
            ->first();

        if ($quotation) {
            return $this->exportAllPdf($quotation->id);
        }

        return response()->json(['success' => false, 'message' => 'No quotation found for contract'], 404);
    }

    /**
     * Export all signed documents PDF for a contract.
     * Symfony: ExportAllSignedDocumentsPdf?contract={id}
     */
    public function exportAllSignedByContractPdf(int $contractId)
    {
        $quotation = DomoprimeQuotation::where('contract_id', $contractId)
            ->where('status', 'ACTIVE')
            ->where('is_signed', 'YES')
            ->orderByDesc('id')
            ->first();

        if ($quotation) {
            return $this->exportSignedPdf($quotation->id);
        }

        return response()->json(['success' => false, 'message' => 'No signed quotation found for contract'], 404);
    }

    // ---------------------------------------------------------------
    // Billing Actions (PDF, Email, Asset)
    // ---------------------------------------------------------------

    /**
     * Export a billing as PDF.
     */
    public function exportBillingPdf(int $id)
    {
        $billing = DomoprimeBilling::with('billingProducts')->findOrFail($id);

        $contract = $billing->contract_id
            ? CustomerContract::with('customer')->find($billing->contract_id)
            : null;

        $html = $this->buildBillingHtml($billing, $contract);
        $pdf = Pdf::loadHTML($html)->setPaper('a4');
        $filename = 'facture_' . ($billing->reference ?: $billing->id) . '.pdf';

        return $pdf->download($filename);
    }

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
        $html = $this->buildBillingHtml($billing, $contract);
        $pdf = Pdf::loadHTML($html)->setPaper('a4');
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
     * Create an asset (avoir) from a billing.
     */
    public function createAssetFromBilling(int $id): JsonResponse
    {
        $billing = DomoprimeBilling::findOrFail($id);

        $asset = DomoprimeAsset::create([
            'reference'              => str_replace('FAC', 'AVO', $billing->reference),
            'month'                  => now()->month,
            'day'                    => now()->day,
            'year'                   => now()->year,
            'dated_at'               => now(),
            'total_asset_with_tax'   => $billing->total_sale_with_tax,
            'total_asset_without_tax' => $billing->total_sale_without_tax,
            'total_tax'              => $billing->total_tax,
            'meeting_id'             => $billing->meeting_id,
            'contract_id'            => $billing->contract_id,
            'company_id'             => $billing->company_id,
            'customer_id'            => $billing->customer_id,
            'billing_id'             => $billing->id,
            'creator_id'             => auth()->id(),
            'work_id'                => $billing->work_id,
            'status_id'              => $billing->status_id ?? 0,
            'comments'               => '',
            'status'                 => 'ACTIVE',
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Asset created from billing',
            'data'    => $asset,
        ]);
    }

    /**
     * Update the last billing from a quotation's data.
     */
    public function updateBillingFromLastQuotation(Request $request, int $id): JsonResponse
    {
        $quotation = DomoprimeQuotation::findOrFail($id);

        $billing = DomoprimeBilling::where('contract_id', $quotation->contract_id)
            ->where('status', 'ACTIVE')
            ->orderByDesc('id')
            ->first();

        if (!$billing) {
            return response()->json([
                'success' => false,
                'message' => 'No active billing found for this contract',
            ], 404);
        }

        $billing->update([
            'total_sale_with_tax'        => $quotation->total_sale_with_tax,
            'total_sale_without_tax'     => $quotation->total_sale_without_tax,
            'total_tax'                  => $quotation->total_tax,
            'total_purchase_with_tax'    => $quotation->total_purchase_with_tax,
            'total_purchase_without_tax' => $quotation->total_purchase_without_tax,
            'taxes'                      => $quotation->taxes,
            'subvention'                 => $quotation->subvention,
            'prime'                      => $quotation->prime,
            'cee_prime'                  => $quotation->cee_prime,
            'ana_prime'                  => $quotation->ana_prime,
            'ite_prime'                  => $quotation->ite_prime,
            'rest_in_charge'             => $quotation->rest_in_charge,
            'discount_amount'            => $quotation->discount_amount,
            'quotation_id'               => $quotation->id,
        ]);

        $sendEmail = $request->boolean('send_email', false);
        if ($sendEmail) {
            $this->sendBillingEmail($billing->id);
        }

        return response()->json([
            'success' => true,
            'message' => 'Last billing updated from quotation',
            'data'    => $billing->fresh(),
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
        $html = $this->buildQuotationHtml($quotation, $contract);
        $pdf = Pdf::loadHTML($html)->setPaper('a4');
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
     * Refresh (regenerate) the quotation reference.
     */
    public function refreshQuotationReference(int $id): JsonResponse
    {
        $quotation = DomoprimeQuotation::findOrFail($id);

        $newRef = 'DEV-' . str_pad($quotation->id, 6, '0', STR_PAD_LEFT)
            . '-' . now()->format('mY');

        $quotation->update(['reference' => $newRef]);

        return response()->json([
            'success'   => true,
            'message'   => 'Reference refreshed',
            'reference' => $newRef,
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

    // ---------------------------------------------------------------
    // HTML builders for DomPDF
    // ---------------------------------------------------------------

    private function buildQuotationHtml(
        DomoprimeQuotation $quotation,
        ?CustomerContract $contract,
        bool $showSignature = false
    ): string {
        $customer = $contract?->customer;
        $customerName = $customer
            ? trim(($customer->first_name ?? '') . ' ' . ($customer->last_name ?? ''))
            : '-';

        $date = $quotation->dated_at?->format('d/m/Y') ?? '-';
        $ref = $quotation->reference ?: '-';
        $totalHt = number_format((float) $quotation->total_sale_without_tax, 2, ',', ' ');
        $totalTtc = number_format((float) $quotation->total_sale_with_tax, 2, ',', ' ');
        $totalTax = number_format((float) $quotation->total_tax, 2, ',', ' ');
        $ceePrime = number_format((float) $quotation->cee_prime, 2, ',', ' ');
        $restInCharge = number_format((float) $quotation->rest_in_charge, 2, ',', ' ');

        $productsRows = '';

        foreach ($quotation->products as $product) {
            $desc = e($product->description ?? '-');
            $qty = $product->quantity ?? 1;
            $pHt = number_format((float) ($product->sale_without_tax ?? 0), 2, ',', ' ');
            $pTtc = number_format((float) ($product->sale_with_tax ?? 0), 2, ',', ' ');
            $productsRows .= "<tr><td>{$desc}</td><td style='text-align:center;'>{$qty}</td><td style='text-align:right;'>{$pHt} €</td><td style='text-align:right;'>{$pTtc} €</td></tr>";
        }

        $signatureBlock = '';

        if ($showSignature && $quotation->is_signed === 'YES') {
            $signedAt = $quotation->signed_at?->format('d/m/Y') ?? '-';
            $signatureBlock = "
                <div style='margin-top:30px; padding:15px; border:1px solid #28a745; border-radius:5px; background:#f0fff0;'>
                    <strong style='color:#28a745;'>✓ DEVIS SIGNÉ</strong><br>
                    Date de signature : {$signedAt}
                </div>";
        }

        return "
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset='utf-8'>
            <style>
                body { font-family: DejaVu Sans, sans-serif; font-size: 11px; color: #333; margin: 30px; }
                h1 { font-size: 18px; color: #1976d2; border-bottom: 2px solid #1976d2; padding-bottom: 8px; }
                .header { display: flex; justify-content: space-between; margin-bottom: 20px; }
                .info-block { margin-bottom: 15px; }
                .info-block strong { display: inline-block; width: 130px; }
                table { width: 100%; border-collapse: collapse; margin-top: 15px; }
                th { background: #1976d2; color: #fff; padding: 8px; text-align: left; font-size: 10px; }
                td { padding: 6px 8px; border-bottom: 1px solid #eee; }
                tr:nth-child(even) { background: #f9f9f9; }
                .totals { margin-top: 20px; text-align: right; }
                .totals div { margin-bottom: 4px; }
                .totals .grand-total { font-size: 14px; font-weight: bold; color: #1976d2; }
                .footer { margin-top: 40px; font-size: 9px; color: #999; text-align: center; border-top: 1px solid #eee; padding-top: 10px; }
            </style>
        </head>
        <body>
            <h1>DEVIS {$ref}</h1>

            <div class='info-block'>
                <strong>Client :</strong> {$customerName}<br>
                <strong>Date :</strong> {$date}<br>
                <strong>Référence :</strong> {$ref}
            </div>

            <table>
                <thead>
                    <tr>
                        <th>Description</th>
                        <th style='text-align:center;'>Qté</th>
                        <th style='text-align:right;'>Prix HT</th>
                        <th style='text-align:right;'>Prix TTC</th>
                    </tr>
                </thead>
                <tbody>
                    {$productsRows}
                </tbody>
            </table>

            <div class='totals'>
                <div><strong>Total HT :</strong> {$totalHt} €</div>
                <div><strong>TVA :</strong> {$totalTax} €</div>
                <div class='grand-total'><strong>Total TTC :</strong> {$totalTtc} €</div>
                <div><strong>Prime CEE :</strong> {$ceePrime} €</div>
                <div><strong>Reste à charge :</strong> {$restInCharge} €</div>
            </div>

            {$signatureBlock}

            <div class='footer'>
                Document généré automatiquement le " . date('d/m/Y H:i') . "
            </div>
        </body>
        </html>";
    }

    private function buildBillingHtml(DomoprimeBilling $billing, ?CustomerContract $contract): string
    {
        $customer = $contract?->customer;
        $customerName = $customer
            ? trim(($customer->first_name ?? '') . ' ' . ($customer->last_name ?? ''))
            : '-';

        $date = $billing->dated_at?->format('d/m/Y') ?? '-';
        $ref = $billing->reference ?: '-';
        $totalHt = number_format((float) $billing->total_sale_without_tax, 2, ',', ' ');
        $totalTtc = number_format((float) $billing->total_sale_with_tax, 2, ',', ' ');
        $totalTax = number_format((float) $billing->total_tax, 2, ',', ' ');

        $productsRows = '';

        foreach ($billing->billingProducts as $product) {
            $desc = e($product->description ?? '-');
            $qty = $product->quantity ?? 1;
            $pHt = number_format((float) ($product->sale_without_tax ?? 0), 2, ',', ' ');
            $pTtc = number_format((float) ($product->sale_with_tax ?? 0), 2, ',', ' ');
            $productsRows .= "<tr><td>{$desc}</td><td style='text-align:center;'>{$qty}</td><td style='text-align:right;'>{$pHt} €</td><td style='text-align:right;'>{$pTtc} €</td></tr>";
        }

        return "
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset='utf-8'>
            <style>
                body { font-family: DejaVu Sans, sans-serif; font-size: 11px; color: #333; margin: 30px; }
                h1 { font-size: 18px; color: #e65100; border-bottom: 2px solid #e65100; padding-bottom: 8px; }
                .info-block { margin-bottom: 15px; }
                .info-block strong { display: inline-block; width: 130px; }
                table { width: 100%; border-collapse: collapse; margin-top: 15px; }
                th { background: #e65100; color: #fff; padding: 8px; text-align: left; font-size: 10px; }
                td { padding: 6px 8px; border-bottom: 1px solid #eee; }
                tr:nth-child(even) { background: #f9f9f9; }
                .totals { margin-top: 20px; text-align: right; }
                .totals div { margin-bottom: 4px; }
                .totals .grand-total { font-size: 14px; font-weight: bold; color: #e65100; }
                .footer { margin-top: 40px; font-size: 9px; color: #999; text-align: center; border-top: 1px solid #eee; padding-top: 10px; }
            </style>
        </head>
        <body>
            <h1>FACTURE {$ref}</h1>

            <div class='info-block'>
                <strong>Client :</strong> {$customerName}<br>
                <strong>Date :</strong> {$date}<br>
                <strong>Référence :</strong> {$ref}
            </div>

            <table>
                <thead>
                    <tr>
                        <th>Description</th>
                        <th style='text-align:center;'>Qté</th>
                        <th style='text-align:right;'>Prix HT</th>
                        <th style='text-align:right;'>Prix TTC</th>
                    </tr>
                </thead>
                <tbody>
                    {$productsRows}
                </tbody>
            </table>

            <div class='totals'>
                <div><strong>Total HT :</strong> {$totalHt} €</div>
                <div><strong>TVA :</strong> {$totalTax} €</div>
                <div class='grand-total'><strong>Total TTC :</strong> {$totalTtc} €</div>
            </div>

            <div class='footer'>
                Document généré automatiquement le " . date('d/m/Y H:i') . "
            </div>
        </body>
        </html>";
    }
}
