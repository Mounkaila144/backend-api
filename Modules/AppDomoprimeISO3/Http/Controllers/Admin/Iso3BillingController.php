<?php

namespace Modules\AppDomoprimeISO3\Http\Controllers\Admin;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Modules\AppDomoprime\Entities\DomoprimeAsset;
use Modules\AppDomoprime\Entities\DomoprimeBilling;
use Modules\AppDomoprime\Entities\DomoprimeQuotation;

/**
 * Handles billing lifecycle for ISO3 contracts:
 * - Listing billings for a contract
 * - Creating a billing from an existing quotation
 * - Refreshing the latest billing from a quotation's totals
 * - Generating an asset (avoir) from a billing
 *
 * PDF rendering and email delivery for billings live in
 * {@see Iso3ExportController} and {@see Iso3EmailController} respectively.
 */
class Iso3BillingController extends Controller
{
    /**
     * List all billings for a contract.
     */
    public function listBillings(Request $request, int $contractId): JsonResponse
    {
        $contract = \Modules\CustomersContracts\Entities\CustomerContract::find($contractId);

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
                'status'                          => $product->status ?: 'ACTIVE',
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
                app(Iso3EmailController::class)->sendBillingEmail($billing->id);
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
            app(Iso3EmailController::class)->sendBillingEmail($billing->id);
        }

        return response()->json([
            'success' => true,
            'message' => 'Last billing updated from quotation',
            'data'    => $billing->fresh(),
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
}
