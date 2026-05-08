<?php

namespace Modules\AppDomoprimeISO3\Services\Documents;

use Modules\AppDomoprime\Entities\DomoprimeBilling;
use Modules\AppDomoprime\Entities\DomoprimeQuotation;
use Modules\CustomersContracts\Entities\CustomerContract;

/**
 * Renders the inline HTML used by the wkhtmltopdf-based PDF exports for
 * quotations and billings. Lives in a service so it can be injected into
 * any controller that needs the markup (PDF export path AND email path)
 * without controllers having to call `app(OtherController::class)` to
 * borrow each other's methods.
 *
 * No PDF here — pure string composition. The caller hands the HTML to
 * SnappyPdf / wkhtmltopdf.
 */
class Iso3HtmlBuilder
{
    public function quotation(
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

    public function billing(DomoprimeBilling $billing, ?CustomerContract $contract): string
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
