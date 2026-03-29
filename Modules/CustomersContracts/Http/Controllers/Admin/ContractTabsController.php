<?php

namespace Modules\CustomersContracts\Http\Controllers\Admin;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Modules\CustomersContracts\Entities\CustomerContract;
use Modules\CustomersContracts\Entities\CustomerContractProduct;
use Modules\CustomersContracts\Entities\CustomerContractComment;
use Modules\CustomersContracts\Entities\CustomerContractCommentHistory;
use Modules\CustomersContracts\Entities\CustomerEmailSent;
use Modules\CustomersContracts\Entities\CustomerSmsSent;
use Modules\CustomersContracts\Entities\CustomerContractDocument;
use Modules\CustomersContracts\Entities\ProductInstallerSchedule;
use Modules\CustomersContracts\Entities\DomoprimeBilling;
use Modules\CustomersContracts\Entities\CustomerWhatsAppSent;
use Modules\CustomersContracts\Entities\PartnerWhatsAppSent;
use Modules\CustomersContracts\Entities\DocumentChecker;
use Modules\CustomersContracts\Entities\ParticipantErdfContract;
use Modules\CustomersContracts\Entities\ParticipantErdfQuotation;
use Modules\CustomersContracts\Entities\ParticipantCityhallContract;
use Modules\CustomersContracts\Entities\ParticipantConsuelContract;
use Modules\CustomersContracts\Entities\ParticipantInstallationContract;

/**
 * Handles data endpoints for each dynamic tab in contract view.
 * Reproduces the data served by Symfony tab components.
 */
class ContractTabsController extends Controller
{
    // ─── Products ────────────────────────────────────────────

    public function products(Request $request, int $contractId): JsonResponse
    {
        $products = CustomerContractProduct::where('contract_id', $contractId)
            ->with('product:id,reference,meta_title,unit,price,purchasing_price')
            ->orderBy('id')
            ->get()
            ->map(function ($cp) {
                return [
                    'id' => $cp->id,
                    'product_id' => $cp->product_id,
                    'reference' => $cp->product->reference ?? null,
                    'name' => $cp->product->meta_title ?? null,
                    'unit' => $cp->product->unit ?? null,
                    'quantity' => (float) $cp->quantity,
                    'purchase_price_ht' => (float) $cp->purchase_price_without_tax,
                    'sale_price_ht' => (float) $cp->sale_price_without_tax,
                    'purchase_price_ttc' => (float) $cp->purchase_price_with_tax,
                    'sale_price_ttc' => (float) $cp->sale_price_with_tax,
                    'total_purchase_ht' => (float) $cp->total_purchase_price_without_tax,
                    'total_sale_ht' => (float) $cp->total_sale_price_without_tax,
                    'total_purchase_ttc' => (float) $cp->total_purchase_price_with_tax,
                    'total_sale_ttc' => (float) $cp->total_sale_price_with_tax,
                    'details' => $cp->details,
                    'is_one_shoot' => (bool) $cp->is_one_shoot,
                    'created_at' => $cp->created_at?->toISOString(),
                ];
            });

        return response()->json(['success' => true, 'data' => $products]);
    }

    // ─── Comments ────────────────────────────────────────────

    public function comments(Request $request, int $contractId): JsonResponse
    {
        $status = $request->query('status', 'ACTIVE');

        $query = CustomerContractComment::where('contract_id', $contractId)
            ->with('history.user:id,firstname,lastname')
            ->orderByDesc('created_at');

        if ($status !== 'ALL') {
            $query->where('status', $status);
        }

        $comments = $query->get()->map(function ($c) {
            $user = $c->history?->user;

            return [
                'id' => $c->id,
                'comment' => $c->comment,
                'status' => $c->status,
                'type' => $c->type,
                'user' => $user ? [
                    'id' => $user->id,
                    'name' => trim($user->firstname . ' ' . $user->lastname),
                ] : null,
                'created_at' => $c->created_at?->toISOString(),
            ];
        });

        return response()->json(['success' => true, 'data' => $comments]);
    }

    public function storeComment(Request $request, int $contractId): JsonResponse
    {
        $request->validate(['comment' => 'required|string']);

        $comment = CustomerContractComment::create([
            'contract_id' => $contractId,
            'comment' => $request->input('comment'),
            'status' => 'ACTIVE',
            'signature' => md5($request->input('comment') . time()),
        ]);

        CustomerContractCommentHistory::create([
            'comment_id' => $comment->id,
            'user_id' => $request->user()->id,
            'user_application' => 'admin',
        ]);

        return response()->json(['success' => true, 'data' => ['id' => $comment->id]]);
    }

    public function deleteComment(Request $request, int $contractId, int $commentId): JsonResponse
    {
        $comment = CustomerContractComment::where('contract_id', $contractId)
            ->where('id', $commentId)
            ->firstOrFail();

        $comment->update(['status' => 'DELETE']);

        return response()->json(['success' => true]);
    }

    // ─── Emails ──────────────────────────────────────────────

    public function emails(Request $request, int $contractId): JsonResponse
    {
        // Emails are linked to customer, not contract directly
        $contract = CustomerContract::on('tenant')->findOrFail($contractId);
        $customerId = $contract->customer_id;

        $emails = CustomerEmailSent::where('customer_id', $customerId)
            ->with('history.user:id,firstname,lastname')
            ->orderByDesc('created_at')
            ->get()
            ->map(function ($e) {
                $user = $e->history?->user;

                return [
                    'id' => $e->id,
                    'email' => $e->email,
                    'subject' => $e->subject,
                    'body' => $e->body,
                    'is_sent' => $e->is_sent === 'YES',
                    'sent_at' => $e->sent_at?->toISOString(),
                    'user' => $user ? [
                        'id' => $user->id,
                        'name' => trim($user->firstname . ' ' . $user->lastname),
                    ] : null,
                    'created_at' => $e->created_at?->toISOString(),
                ];
            });

        return response()->json(['success' => true, 'data' => $emails]);
    }

    // ─── SMS ─────────────────────────────────────────────────

    public function sms(Request $request, int $contractId): JsonResponse
    {
        $contract = CustomerContract::on('tenant')->findOrFail($contractId);
        $customerId = $contract->customer_id;

        $smsList = CustomerSmsSent::where('customer_id', $customerId)
            ->orderByDesc('created_at')
            ->get()
            ->map(function ($s) {
                return [
                    'id' => $s->id,
                    'mobile' => $s->mobile,
                    'message' => $s->message,
                    'send_at' => $s->send_at?->toISOString(),
                    'created_at' => $s->created_at?->toISOString(),
                ];
            });

        return response()->json(['success' => true, 'data' => $smsList]);
    }

    // ─── Documents ───────────────────────────────────────────

    public function documents(Request $request, int $contractId): JsonResponse
    {
        $documents = CustomerContractDocument::where('contract_id', $contractId)
            ->orderByDesc('created_at')
            ->get()
            ->map(function ($d) {
                return [
                    'id' => $d->id,
                    'title' => $d->title,
                    'file' => $d->file,
                    'extension' => $d->extension,
                    'created_at' => $d->created_at?->toISOString(),
                ];
            });

        return response()->json(['success' => true, 'data' => $documents]);
    }

    // ─── Installations / Schedule ────────────────────────────

    public function installations(Request $request, int $contractId): JsonResponse
    {
        $schedules = ProductInstallerSchedule::where('contract_id', $contractId)
            ->active()
            ->with([
                'product:id,reference,meta_title',
                'installer:id,firstname,lastname',
            ])
            ->orderByDesc('in_at')
            ->get()
            ->map(function ($s) {
                return [
                    'id' => $s->id,
                    'product' => $s->product ? [
                        'id' => $s->product->id,
                        'reference' => $s->product->reference,
                        'name' => $s->product->meta_title,
                    ] : null,
                    'installer' => $s->installer && $s->installer->id ? [
                        'id' => $s->installer->id,
                        'name' => trim($s->installer->firstname . ' ' . $s->installer->lastname),
                    ] : null,
                    'in_at' => $s->in_at?->toISOString(),
                    'details' => $s->details,
                    'status' => $s->status,
                    'created_at' => $s->created_at?->toISOString(),
                ];
            });

        return response()->json(['success' => true, 'data' => $schedules]);
    }

    // ─── Localisation (Map) ──────────────────────────────────

    public function localisation(Request $request, int $contractId): JsonResponse
    {
        $contract = CustomerContract::on('tenant')->findOrFail($contractId);

        // Get customer address with coordinates
        $address = \DB::connection('tenant')
            ->table('t_customers_address')
            ->where('customer_id', $contract->customer_id)
            ->where('status', 'ACTIVE')
            ->first();

        if (!$address) {
            return response()->json([
                'success' => true,
                'data' => null,
            ]);
        }

        return response()->json([
            'success' => true,
            'data' => [
                'lat' => (float) $address->lat,
                'lng' => (float) $address->lng,
                'address1' => $address->address1,
                'address2' => $address->address2 ?? '',
                'postcode' => $address->postcode,
                'city' => $address->city,
                'country' => $address->country ?? 'France',
                'full_address' => trim(
                    ($address->address1 ?? '') . ' ' .
                    ($address->postcode ?? '') . ' ' .
                    ($address->city ?? '')
                ),
            ],
        ]);
    }

    // ─── Billing (Factures) ──────────────────────────────────

    /**
     * Lists billings (factures) for a contract.
     * Symfony: ajaxListPartialBillingForContractAction
     * Columns: Date, Reference, Total Ventes HT, Montant de la taxe, Total Ventes TTC,
     *          Prime, Credit impots, Qmac, Nb personnes, Nb enfants,
     *          Credit impot utilise, Reste a charge, Credit limit,
     *          Reste a charge apres credit, Credit impots disponible, Cree par, Cree le
     */
    public function billing(Request $request, int $contractId): JsonResponse
    {
        // Reproduces Symfony DomoprimeBillingBase computed values:
        // - TotalSaleTax = total_sale_with_tax - total_sale_without_tax (CALCULATED, not DB field)
        // - Prime = cee_prime (NOT the 'prime' field)
        // - RestToPayWithTax = (total_sale_with_tax + added_wall + added_floor + added_top + fee_file) - total_sale_with_tax
        //   where fee_file is hardcoded to 1.00 in Symfony
        $billings = \DB::connection('tenant')
            ->table('t_domoprime_billing as b')
            ->leftJoin('t_users as u', 'u.id', '=', 'b.creator_id')
            ->where('b.contract_id', $contractId)
            ->orderByDesc('b.created_at')
            ->select([
                'b.id', 'b.reference', 'b.dated_at',
                'b.total_sale_without_tax', 'b.total_sale_with_tax',
                'b.cee_prime', 'b.tax_credit', 'b.qmac_value',
                'b.number_of_people', 'b.number_of_children',
                'b.tax_credit_used', 'b.tax_credit_limit',
                'b.rest_in_charge_after_credit', 'b.tax_credit_available',
                'b.total_added_with_tax_wall', 'b.total_added_with_tax_floor', 'b.total_added_with_tax_top',
                'b.fee_file',
                'b.status', 'b.created_at',
                'u.firstname as creator_firstname', 'u.lastname as creator_lastname',
            ])
            ->get()
            ->map(function ($b) {
                $totalSaleWithTax = (float) $b->total_sale_with_tax;
                $totalSaleWithoutTax = (float) $b->total_sale_without_tax;

                // Symfony: getTotalSaleTax() = getTotalSaleWithTax() - getTotalSaleWithoutTax()
                $totalSaleTax = $totalSaleWithTax - $totalSaleWithoutTax;

                // Symfony: getTotalAddedWithTax() = wall + floor + top
                $totalAddedWithTax = (float) $b->total_added_with_tax_wall
                    + (float) $b->total_added_with_tax_floor
                    + (float) $b->total_added_with_tax_top;

                // Symfony: getFeeFile() is hardcoded to 1.00
                $feeFile = 1.00;

                // Symfony: getRestToPayWithTax() = getTotalSaleAndAdderAndFeeWithTax() - getTotalSaleWithTax()
                //   where getTotalSaleAndAdderAndFeeWithTax = totalSaleWithTax + totalAddedWithTax + feeFile
                $restToPayWithTax = ($totalSaleWithTax + $totalAddedWithTax + $feeFile) - $totalSaleWithTax;

                return [
                    'id' => $b->id,
                    'reference' => $b->reference,
                    'dated_at' => $b->dated_at,
                    'total_sale_ht' => $totalSaleWithoutTax,
                    'total_tax' => $totalSaleTax,
                    'total_sale_ttc' => $totalSaleWithTax,
                    'prime' => (float) $b->cee_prime,
                    'tax_credit' => (float) $b->tax_credit,
                    'qmac_value' => (float) $b->qmac_value,
                    'number_of_people' => (float) $b->number_of_people,
                    'number_of_children' => (float) $b->number_of_children,
                    'tax_credit_used' => (float) $b->tax_credit_used,
                    'rest_in_charge' => $restToPayWithTax,
                    'tax_credit_limit' => (float) $b->tax_credit_limit,
                    'rest_in_charge_after_credit' => (float) $b->rest_in_charge_after_credit,
                    'tax_credit_available' => (float) $b->tax_credit_available,
                    'creator' => $b->creator_firstname
                        ? mb_strtoupper(trim($b->creator_firstname . ' ' . $b->creator_lastname))
                        : null,
                    'status' => $b->status,
                    'created_at' => $b->created_at,
                ];
            });

        return response()->json(['success' => true, 'data' => $billings]);
    }

    // ─── WhatsApp (Customer) ─────────────────────────────────

    public function whatsapp(Request $request, int $contractId): JsonResponse
    {
        $contract = CustomerContract::on('tenant')->findOrFail($contractId);

        $messages = CustomerWhatsAppSent::where('customer_id', $contract->customer_id)
            ->with('history.user:id,firstname,lastname')
            ->orderByDesc('created_at')
            ->get()
            ->map(function ($m) {
                $user = $m->history?->user;

                return [
                    'id' => $m->id,
                    'mobile' => $m->mobile,
                    'message' => $m->message,
                    'user' => $user ? [
                        'id' => $user->id,
                        'name' => trim($user->firstname . ' ' . $user->lastname),
                    ] : null,
                    'send_at' => $m->send_at?->toISOString(),
                    'created_at' => $m->created_at?->toISOString(),
                ];
            });

        return response()->json(['success' => true, 'data' => $messages]);
    }

    // ─── WhatsApp (Partner) ──────────────────────────────────

    public function partnerWhatsapp(Request $request, int $contractId): JsonResponse
    {
        $messages = PartnerWhatsAppSent::where('contract_id', $contractId)
            ->with('history.user:id,firstname,lastname')
            ->orderByDesc('created_at')
            ->get()
            ->map(function ($m) {
                $user = $m->history?->user;

                return [
                    'id' => $m->id,
                    'mobile' => $m->mobile,
                    'message' => $m->message,
                    'user' => $user ? [
                        'id' => $user->id,
                        'name' => trim($user->firstname . ' ' . $user->lastname),
                    ] : null,
                    'send_at' => $m->send_at?->toISOString(),
                    'created_at' => $m->created_at?->toISOString(),
                ];
            });

        return response()->json(['success' => true, 'data' => $messages]);
    }

    // ─── Doc Check ───────────────────────────────────────────

    /**
     * Doc Check tab - lists active checkers with checks, files, status.
     * Reproduces Symfony: listForViewContract → listCheckForCheckerForViewContract
     */
    public function docCheck(Request $request, int $contractId): JsonResponse
    {
        $lang = $request->query('lang', 'fr');

        $checkers = \DB::connection('tenant')
            ->table('t_customers_contracts_documents_checker')
            ->where('is_active', 'YES')->where('status', 'ACTIVE')
            ->orderBy('id')->get();

        $statuses = \DB::connection('tenant')
            ->table('t_customers_contracts_documents_checker_status as s')
            ->leftJoin('t_customers_contracts_documents_checker_status_i18n as i', function ($j) use ($lang) {
                $j->on('i.status_id', '=', 's.id')->where('i.lang', '=', $lang);
            })
            ->select('s.id', 's.name', 's.icon', 's.color', 'i.value as label')
            ->get();

        $result = [];

        foreach ($checkers as $checker) {
            $check = \DB::connection('tenant')
                ->table('t_customers_contracts_document_check')
                ->where('contract_id', $contractId)
                ->where('document_id', $checker->id)
                ->first();

            $files = [];
            if ($check) {
                $files = \DB::connection('tenant')
                    ->table('t_customers_contracts_document_file_check')
                    ->where('check_id', $check->id)
                    ->where('contract_id', $contractId)
                    ->where('status', 'ACTIVE')
                    ->orderBy('id')
                    ->get()
                    ->map(fn ($f) => [
                        'id' => $f->id,
                        'title' => $f->title,
                        'extension' => $f->extension,
                        'created_at' => $f->created_at,
                    ])
                    ->toArray();
            }

            $statusLabel = null;
            $statusColor = null;
            if ($check && $check->status_id) {
                $s = $statuses->firstWhere('id', $check->status_id);
                $statusLabel = $s?->label ?? $s?->name;
                $statusColor = $s?->color;
            }

            $result[] = [
                'checker_id' => $checker->id,
                'checker_name' => $checker->name,
                'check_id' => $check?->id,
                'status_id' => $check?->status_id,
                'status_label' => $statusLabel,
                'status_color' => $statusColor,
                'comment' => $check?->comment ?? '',
                'is_hold' => $check?->is_hold ?? 'NO',
                'files' => $files,
                'files_count' => count($files),
            ];
        }

        return response()->json([
            'success' => true,
            'data' => [
                'checkers' => $result,
                'statuses' => $statuses->map(fn ($s) => [
                    'id' => $s->id,
                    'label' => $s->label ?? $s->name,
                    'color' => $s->color,
                ]),
            ],
        ]);
    }

    // ─── Doc Check File Actions ─────────────────────────────

    public function docCheckDownloadFile(Request $request, int $contractId, int $fileId)
    {
        $file = \DB::connection('tenant')
            ->table('t_customers_contracts_document_file_check')
            ->where('id', $fileId)
            ->where('contract_id', $contractId)
            ->first();

        if (!$file) {
            return response()->json(['success' => false, 'message' => 'File not found'], 404);
        }

        $fileName = $file->file;

        // Try via TenantStorageManager first (S3 or local)
        try {
            $tenant = \App\Models\Tenant::first();
            $storageManager = app(\Modules\Superadmin\Services\TenantStorageManager::class);
            $relativePath = "admin/data/contracts/documents/check/{$fileId}/{$fileName}";
            $fullPath = $storageManager->getTenantPath($tenant->site_id) . "/{$relativePath}";
            $disk = $storageManager->getCurrentDisk();

            if (\Illuminate\Support\Facades\Storage::disk($disk)->exists($fullPath)) {
                return \Illuminate\Support\Facades\Storage::disk($disk)->download($fullPath, $fileName);
            }
        } catch (\Exception $e) {
            // Fallback below
        }

        // Fallback: check local paths
        $siteName = \DB::connection('tenant')->getDatabaseName();
        $localPaths = [
            storage_path("app/private/sites/{$siteName}/admin/data/contracts/documents/check/{$fileId}/{$fileName}"),
            storage_path("app/private/tenants/{$siteName}/admin/data/contracts/documents/check/{$fileId}/{$fileName}"),
            base_path("sites/{$siteName}/admin/data/contracts/documents/check/{$fileId}/{$fileName}"),
        ];

        foreach ($localPaths as $candidate) {
            if (file_exists($candidate)) {
                return response()->file($candidate);
            }
        }

        return response()->json(['success' => false, 'message' => 'File not found'], 404);
    }

    public function docCheckDeleteFile(Request $request, int $contractId, int $fileId): JsonResponse
    {
        \DB::connection('tenant')->table('t_customers_contracts_document_file_check')
            ->where('id', $fileId)
            ->where('contract_id', $contractId)
            ->delete();

        return response()->json(['success' => true, 'action' => 'DeleteFileCheck', 'id' => $fileId]);
    }

    public function docCheckDisableFile(Request $request, int $contractId, int $fileId): JsonResponse
    {
        \DB::connection('tenant')->table('t_customers_contracts_document_file_check')
            ->where('id', $fileId)
            ->where('contract_id', $contractId)
            ->update(['status' => 'DELETE']);

        return response()->json(['success' => true, 'action' => 'DisableFileCheck', 'id' => $fileId]);
    }

    public function docCheckEnableFile(Request $request, int $contractId, int $fileId): JsonResponse
    {
        \DB::connection('tenant')->table('t_customers_contracts_document_file_check')
            ->where('id', $fileId)
            ->where('contract_id', $contractId)
            ->update(['status' => 'ACTIVE']);

        return response()->json(['success' => true, 'action' => 'EnableFileCheck', 'id' => $fileId]);
    }

    public function docCheckUpload(Request $request, int $contractId): JsonResponse
    {
        $checkerId = $request->input('checker_id');
        $checkId = $request->input('check_id');

        if (!$checkId) {
            // Create check record if not exists
            $check = \DB::connection('tenant')->table('t_customers_contracts_document_check')
                ->where('contract_id', $contractId)
                ->where('document_id', $checkerId)
                ->first();

            if (!$check) {
                $checkId = \DB::connection('tenant')->table('t_customers_contracts_document_check')
                    ->insertGetId([
                        'contract_id' => $contractId,
                        'document_id' => $checkerId,
                        'comment' => '',
                        'status_id' => null,
                        'is_loaded' => 'NO',
                        'is_hold' => 'NO',
                        'created_at' => now(),
                    ]);
            } else {
                $checkId = $check->id;
            }
        }

        $files = $request->file('files', []);
        $uploaded = [];

        foreach ((array) $files as $file) {
            $ext = $file->getClientOriginalExtension();
            $title = pathinfo($file->getClientOriginalName(), PATHINFO_FILENAME);

            $id = \DB::connection('tenant')->table('t_customers_contracts_document_file_check')
                ->insertGetId([
                    'check_id' => $checkId,
                    'contract_id' => $contractId,
                    'title' => $title,
                    'file' => $file->getClientOriginalName(),
                    'extension' => $ext,
                    'status' => 'ACTIVE',
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);

            // Store file via TenantStorageManager (S3 or local)
            try {
                $tenant = \App\Models\Tenant::first();
                $storageManager = app(\Modules\Superadmin\Services\TenantStorageManager::class);
                $storageManager->uploadFile(
                    $tenant->site_id,
                    "admin/data/contracts/documents/check/{$id}",
                    file_get_contents($file->getRealPath()),
                    $file->getClientOriginalName()
                );
            } catch (\Exception $e) {
                // Fallback to local storage
                $siteName = \DB::connection('tenant')->getDatabaseName();
                $dir = "sites/{$siteName}/admin/data/contracts/documents/check/{$id}";
                $file->storeAs($dir, $file->getClientOriginalName(), 'local');
            }

            $uploaded[] = ['id' => $id, 'title' => $title, 'extension' => $ext];
        }

        return response()->json(['success' => true, 'files' => $uploaded, 'check_id' => $checkId]);
    }

    // ─── Steps / Participants ────────────────────────────────

    public function steps(Request $request, int $contractId): JsonResponse
    {
        $lang = $request->query('lang', 'fr');

        // ERDF (ENEDIS) Contract
        $erdf = \DB::connection('tenant')->table('t_participants_erdf_contract')
            ->where('contract_id', $contractId)->first();
        $erdfStatus = null;
        if ($erdf && $erdf->status_id) {
            $erdfStatus = \DB::connection('tenant')->table('t_participants_erdf_status_i18n')
                ->where('status_id', $erdf->status_id)->where('lang', $lang)->first();
        }

        // ERDF Quotation
        $erdfQuotation = \DB::connection('tenant')->table('t_participants_erdf_quotation')
            ->where('contract_id', $contractId)->first();

        // CityHall (Mairie)
        $cityhall = \DB::connection('tenant')->table('t_participants_cityhall_contract')
            ->where('contract_id', $contractId)->first();
        $cityhallStatus = null;
        if ($cityhall && $cityhall->status_id) {
            $cityhallStatus = \DB::connection('tenant')->table('t_participants_cityhall_status_i18n')
                ->where('status_id', $cityhall->status_id)->where('lang', $lang)->first();
        }

        // Consuel
        $consuel = \DB::connection('tenant')->table('t_participants_consuel_contract as c')
            ->leftJoin('t_users as u', 'u.id', '=', 'c.installer_id')
            ->where('c.contract_id', $contractId)
            ->select('c.*', 'u.firstname as installer_firstname', 'u.lastname as installer_lastname')
            ->first();
        $consuelStatus = null;
        if ($consuel && $consuel->status_id) {
            $consuelStatus = \DB::connection('tenant')->table('t_participants_consuel_status_i18n')
                ->where('status_id', $consuel->status_id)->where('lang', $lang)->first();
        }

        // Installation
        $installation = \DB::connection('tenant')->table('t_participants_installation_contract as i')
            ->leftJoin('t_users as u', 'u.id', '=', 'i.installer_id')
            ->where('i.contract_id', $contractId)
            ->select('i.*', 'u.firstname as installer_firstname', 'u.lastname as installer_lastname')
            ->first();

        return response()->json([
            'success' => true,
            'data' => [
                'erdf' => $erdf ? [
                    'id' => $erdf->id,
                    'status' => $erdfStatus?->value ?? null,
                    'status_id' => $erdf->status_id,
                    'opened_at' => $erdf->opened_at,
                    'resend_at' => $erdf->resend_at,
                    'remarks' => $erdf->remarks,
                ] : null,
                'erdf_quotation' => $erdfQuotation ? [
                    'id' => $erdfQuotation->id,
                    'opened_at' => $erdfQuotation->opened_at,
                    'amount' => (float) $erdfQuotation->amount,
                    'received_at' => $erdfQuotation->received_at,
                    'check_at' => $erdfQuotation->check_at,
                    'check_amount' => (float) $erdfQuotation->check_amount,
                    'remarks' => $erdfQuotation->remarks,
                ] : null,
                'cityhall' => $cityhall ? [
                    'id' => $cityhall->id,
                    'status' => $cityhallStatus?->value ?? null,
                    'status_id' => $cityhall->status_id,
                    'send_at' => $cityhall->send_at,
                    'ack_at' => $cityhall->ack_at,
                    'state_at' => $cityhall->state_at,
                    'resend_at' => $cityhall->resend_at,
                    'remarks' => $cityhall->remarks,
                ] : null,
                'consuel' => $consuel ? [
                    'id' => $consuel->id,
                    'status' => $consuelStatus?->value ?? null,
                    'status_id' => $consuel->status_id,
                    'send_at' => $consuel->send_at,
                    'conformity' => $consuel->conformity,
                    'modified_at' => $consuel->modified_at,
                    'visited_at' => $consuel->visited_at,
                    'revisited_at' => $consuel->revisited_at,
                    'installer' => $consuel->installer_firstname
                        ? trim($consuel->installer_firstname . ' ' . $consuel->installer_lastname)
                        : null,
                    'work_before' => $consuel->work_before,
                    'remarks' => $consuel->remarks,
                ] : null,
                'installation' => $installation ? [
                    'id' => $installation->id,
                    'counter_at' => $installation->counter_at,
                    'type' => $installation->type,
                    'installer' => $installation->installer_firstname
                        ? trim($installation->installer_firstname . ' ' . $installation->installer_lastname)
                        : null,
                    'linked_at' => $installation->linked_at,
                    'worked_at' => $installation->worked_at,
                ] : null,
            ],
        ]);
    }

    /**
     * Save a single participant step independently.
     * Reproduces Symfony's ajaxSaveAction for each participant module.
     *
     * @param string $participant erdf|erdf_quotation|cityhall|consuel|installation
     */
    public function saveStep(Request $request, int $contractId, string $participant): JsonResponse
    {
        $data = $request->input('data', []);
        $now = now();

        $tableMap = [
            'erdf' => 't_participants_erdf_contract',
            'erdf_quotation' => 't_participants_erdf_quotation',
            'cityhall' => 't_participants_cityhall_contract',
            'consuel' => 't_participants_consuel_contract',
            'installation' => 't_participants_installation_contract',
        ];

        $table = $tableMap[$participant] ?? null;
        if (!$table) {
            return response()->json(['success' => false, 'message' => 'Unknown participant type'], 400);
        }

        // Remove null/empty date fields that would cause "0000-00-00" issues
        $cleanData = [];
        foreach ($data as $key => $value) {
            if ($key === 'id') continue;
            if (str_ends_with($key, '_at') && empty($value)) {
                $cleanData[$key] = null;
            } else {
                $cleanData[$key] = $value;
            }
        }
        $cleanData['updated_at'] = $now;

        $existing = \DB::connection('tenant')->table($table)
            ->where('contract_id', $contractId)->first();

        if ($existing) {
            \DB::connection('tenant')->table($table)
                ->where('id', $existing->id)
                ->update($cleanData);
        } else {
            $cleanData['contract_id'] = $contractId;
            $cleanData['created_at'] = $now;

            // Set required defaults for new records (like Symfony's default_status_id)
            $defaults = [
                'erdf' => ['status_id' => 0],
                'cityhall' => ['status_id' => 0],
                'consuel' => ['status_id' => 0, 'installer_id' => 0],
                'installation' => ['installer_id' => 0],
            ];

            if (isset($defaults[$participant])) {
                foreach ($defaults[$participant] as $field => $defaultVal) {
                    if (!isset($cleanData[$field])) {
                        $cleanData[$field] = $defaultVal;
                    }
                }
            }

            \DB::connection('tenant')->table($table)->insert($cleanData);
        }

        return response()->json(['success' => true, 'message' => 'Informations enregistrées']);
    }

    // ─── Requests (Domoprime Calculations) ───────────────────

    /**
     * Lists calculation requests for a contract.
     * Symfony: ajaxListPartialRequestForContractAction → t_domoprime_calculation via meeting_id
     */
    public function requests(Request $request, int $contractId): JsonResponse
    {
        $contract = CustomerContract::on('tenant')->findOrFail($contractId);

        // Symfony filters strictly by meeting_id (via contract->getMeeting()->get('id'))
        // If contract has no meeting, the result is empty (same as Symfony)
        $meetingId = $contract->meeting_id;

        if (!$meetingId) {
            return response()->json(['success' => true, 'data' => []]);
        }

        $lang = $request->query('lang', 'fr');

        $calculations = \DB::connection('tenant')
            ->table('t_domoprime_calculation as c')
            ->leftJoin('t_domoprime_region as r', 'r.id', '=', 'c.region_id')
            ->leftJoin('t_domoprime_zone as z', 'z.id', '=', 'c.zone_id')
            ->leftJoin('t_domoprime_sector as s', 's.id', '=', 'c.sector_id')
            ->leftJoin('t_domoprime_energy_i18n as ei', function ($j) use ($lang) {
                $j->on('ei.energy_id', '=', 'c.energy_id')->where('ei.lang', '=', $lang);
            })
            ->leftJoin('t_domoprime_class_i18n as ci', function ($j) use ($lang) {
                $j->on('ci.class_id', '=', 'c.class_id')->where('ci.lang', '=', $lang);
            })
            ->leftJoin('t_users as u', 'u.id', '=', 'c.user_id')
            ->leftJoin('t_users as a', 'a.id', '=', 'c.accepted_by_id')
            ->where('c.meeting_id', $meetingId)
            ->orderByDesc('c.created_at')
            ->select([
                'c.id', 'c.revenue', 'c.number_of_people',
                'c.qmac', 'c.qmac_value', 'c.status', 'c.isLast', 'c.causes',
                'c.created_at',
                'r.name as region_name',
                'z.code as zone_code',
                's.name as sector_name',
                'ei.value as energy_name',
                'ci.value as class_name',
                'u.firstname as user_firstname', 'u.lastname as user_lastname',
                'a.firstname as accepted_firstname', 'a.lastname as accepted_lastname',
            ])
            ->get()
            ->map(function ($c) {
                return [
                    'id' => $c->id,
                    'region' => $c->region_name,
                    'zone' => $c->zone_code,
                    'sector' => $c->sector_name,
                    'energy' => $c->energy_name,
                    'class' => $c->class_name,
                    'revenue' => (float) $c->revenue,
                    'number_of_people' => (float) $c->number_of_people,
                    'qmac' => (float) $c->qmac,
                    'qmac_value' => (float) $c->qmac_value,
                    'status' => $c->status,
                    'is_last' => $c->isLast,
                    'causes' => $c->causes,
                    'user' => $c->user_firstname ? trim($c->user_firstname . ' ' . $c->user_lastname) : null,
                    'accepted_by' => $c->accepted_firstname ? trim($c->accepted_firstname . ' ' . $c->accepted_lastname) : null,
                    'created_at' => $c->created_at,
                ];
            });

        return response()->json(['success' => true, 'data' => $calculations]);
    }

    // ─── Avoirs (Domoprime Assets) ───────────────────────────

    /**
     * Lists assets (avoirs) for a contract.
     * Symfony: ajaxListPartialAssetForContractAction → t_domoprime_asset
     */
    public function assets(Request $request, int $contractId): JsonResponse
    {
        $assets = \DB::connection('tenant')
            ->table('t_domoprime_asset as a')
            ->leftJoin('t_users as u', 'u.id', '=', 'a.creator_id')
            ->where('a.contract_id', $contractId)
            ->orderByDesc('a.created_at')
            ->select([
                'a.id', 'a.reference', 'a.dated_at',
                'a.total_asset_without_tax', 'a.total_asset_with_tax', 'a.total_tax',
                'a.billing_id', 'a.comments', 'a.status',
                'a.created_at',
                'u.firstname as creator_firstname', 'u.lastname as creator_lastname',
            ])
            ->get()
            ->map(function ($a) {
                $totalWithTax = (float) $a->total_asset_with_tax;
                $totalWithoutTax = (float) $a->total_asset_without_tax;
                // Symfony: getFormattedTotalTax() = total_with_tax - total_without_tax
                $totalTax = $totalWithTax - $totalWithoutTax;

                return [
                    'id' => $a->id,
                    'reference' => $a->reference,
                    'dated_at' => $a->dated_at,
                    'total_ht' => $totalWithoutTax,
                    'total_ttc' => $totalWithTax,
                    'total_tax' => $totalTax,
                    'creator' => $a->creator_firstname
                        ? mb_strtoupper(trim($a->creator_firstname . ' ' . $a->creator_lastname))
                        : null,
                    'created_at' => $a->created_at,
                ];
            });

        return response()->json(['success' => true, 'data' => $assets]);
    }

    // ─── Attributions ────────────────────────────────────────

    /**
     * Save attributions independently (like Symfony's ajaxSaveAttributionsAction).
     * Updates team_id on the contract and user_id/attribution_id on each contributor.
     */
    public function saveAttributions(Request $request, int $contractId): JsonResponse
    {
        $contract = CustomerContract::on('tenant')->findOrFail($contractId);
        $data = $request->input('attributions', []);

        // Update team_id if provided
        if (isset($data['team_id'])) {
            \DB::connection('tenant')
                ->table('t_customers_contract')
                ->where('id', $contractId)
                ->update(['team_id' => $data['team_id'] ?: 0]);
        }

        // Update each contributor
        // Use NULL instead of 0 for user_id/team_id/attribution_id to respect FK constraints
        if (!empty($data['contributors']) && is_array($data['contributors'])) {
            foreach ($data['contributors'] as $type => $values) {
                $updateData = [];
                if (isset($values['user_id'])) {
                    $updateData['user_id'] = !empty($values['user_id']) ? (int) $values['user_id'] : null;
                }
                if (isset($values['team_id'])) {
                    $updateData['team_id'] = !empty($values['team_id']) ? (int) $values['team_id'] : null;
                }
                if (isset($values['attribution_id'])) {
                    $updateData['attribution_id'] = !empty($values['attribution_id']) ? (int) $values['attribution_id'] : null;
                }
                if (isset($values['payment_at'])) {
                    $updateData['payment_at'] = !empty($values['payment_at']) ? $values['payment_at'] : null;
                }
                if (!empty($updateData)) {
                    \DB::connection('tenant')
                        ->table('t_customers_contracts_contributor')
                        ->where('contract_id', $contractId)
                        ->where('type', $type)
                        ->update($updateData);
                }
            }
        }

        return response()->json(['success' => true, 'message' => 'Attributions enregistrées']);
    }

    /**
     * Get edit form data for attributions.
     * Returns contributors with available users (by function) and attribution options.
     * Reproduces Symfony's CustomerAttributionsForm / ContributorsForm.
     */
    public function attributionsEdit(Request $request, int $contractId): JsonResponse
    {
        $lang = $request->query('lang', 'fr');
        $contract = CustomerContract::on('tenant')->findOrFail($contractId);
        $user = $request->user();

        // Get attributions list
        $attributions = \DB::connection('tenant')
            ->table('t_users_attribution_i18n')
            ->where('lang', $lang)
            ->get()
            ->map(fn ($a) => ['id' => $a->attribution_id, 'name' => $a->value]);

        // Contributor types with credentials (like Symfony's ContributorsForm)
        $contributorTypes = [
            'telepro' => ['label' => 'SOURCE', 'credential' => 'contract_attributions_modify_telepro', 'is_team' => false],
            'sale_1' => ['label' => 'ACCES 1', 'credential' => 'contract_attributions_modify_sale1', 'is_team' => false],
            'sale_2' => ['label' => 'ACCES 2', 'credential' => 'contract_attributions_modify_sale2', 'is_team' => false],
            'manager' => ['label' => 'Responsable commercial', 'credential' => 'contract_attributions_modify_managers', 'is_team' => false],
            'assistant' => ['label' => 'Assistant', 'credential' => 'contract_attributions_modify_assistant', 'is_team' => false],
            'team' => ['label' => 'Équipe', 'credential' => 'contract_attributions_modify_team', 'is_team' => true],
        ];

        // Get all users for dropdowns
        $allUsers = \DB::connection('tenant')
            ->table('t_users')
            ->select('id', 'firstname', 'lastname', 'is_active')
            ->orderBy('firstname')
            ->get()
            ->map(fn ($u) => [
                'id' => $u->id,
                'name' => mb_strtoupper(trim($u->firstname . ' ' . $u->lastname)),
                'is_active' => $u->is_active === 'YES' || $u->is_active === 1,
            ]);

        // Get teams for team-type contributor
        $teams = \DB::connection('tenant')
            ->table('t_users_team')
            ->orderBy('name')
            ->get()
            ->map(fn ($t) => ['id' => $t->id, 'name' => $t->name, 'is_active' => true]);

        // Get current contributors
        $currentContributors = \DB::connection('tenant')
            ->table('t_customers_contracts_contributor')
            ->where('contract_id', $contractId)
            ->get()
            ->keyBy('type');

        $contributors = [];

        foreach ($contributorTypes as $type => $config) {
            if (!$user->hasCredential([['superadmin', 'admin', $config['credential']]])) {
                continue;
            }

            $current = $currentContributors->get($type);

            $contributors[] = [
                'type' => $type,
                'type_label' => $config['label'],
                'is_team' => $config['is_team'],
                'user_id' => $current?->user_id ?: null,
                'team_id' => $current?->team_id ?: null,
                'attribution_id' => $current?->attribution_id ?: null,
                'payment_at' => $current?->payment_at,
                'users' => $config['is_team'] ? $teams : $allUsers,
                'attributions' => $attributions,
            ];
        }

        return response()->json([
            'success' => true,
            'data' => ['contributors' => $contributors],
        ]);
    }

    /**
     * Lists contributors (attributions) for a contract.
     * Reproduces Symfony: customers_contracts_attributions.tpl
     * Shows team + contributors with type, user name, attribution label
     */
    public function attributions(Request $request, int $contractId): JsonResponse
    {
        $lang = $request->query('lang', 'fr');
        $contract = CustomerContract::on('tenant')->findOrFail($contractId);

        // Get team name
        $team = null;
        if ($contract->team_id) {
            $teamRow = \DB::connection('tenant')->table('t_users_team')->find($contract->team_id);
            $team = $teamRow ? ['id' => $teamRow->id, 'name' => $teamRow->name] : null;
        }

        // Get contributors with user names and attribution labels
        $contributors = \DB::connection('tenant')
            ->table('t_customers_contracts_contributor as c')
            ->leftJoin('t_users as u', 'u.id', '=', 'c.user_id')
            ->leftJoin('t_users_attribution_i18n as ai', function ($j) use ($lang) {
                $j->on('ai.attribution_id', '=', 'c.attribution_id')->where('ai.lang', '=', $lang);
            })
            ->where('c.contract_id', $contractId)
            ->select(
                'c.id', 'c.type', 'c.user_id', 'c.team_id', 'c.attribution_id', 'c.payment_at',
                'u.firstname', 'u.lastname',
                'ai.value as attribution_label'
            )
            ->orderBy('c.id')
            ->get()
            ->map(function ($c) {
                // Map type to French label (like Symfony template)
                $typeLabels = [
                    'telepro' => 'Télépro',
                    'sale_1' => 'Commercial 1',
                    'sale_2' => 'Commercial 2',
                    'manager' => 'Responsable',
                    'assistant' => 'Assistant',
                    'team' => 'Équipe',
                ];

                return [
                    'id' => $c->id,
                    'type' => $c->type,
                    'type_label' => $typeLabels[$c->type] ?? $c->type,
                    'user' => $c->firstname
                        ? mb_strtoupper(trim($c->firstname . ' ' . $c->lastname))
                        : null,
                    'attribution' => $c->attribution_label ?? null,
                    'payment_at' => $c->payment_at,
                ];
            });

        return response()->json([
            'success' => true,
            'data' => [
                'team' => $team,
                'contributors' => $contributors,
            ],
        ]);
    }
}
