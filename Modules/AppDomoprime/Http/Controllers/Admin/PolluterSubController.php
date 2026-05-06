<?php

namespace Modules\AppDomoprime\Http\Controllers\Admin;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\Validator;
use Modules\AppDomoprime\Entities\DomoprimeAfterWorkModel;
use Modules\AppDomoprime\Entities\DomoprimeBillingModel;
use Modules\AppDomoprime\Entities\DomoprimeClass;
use Modules\AppDomoprime\Entities\DomoprimePolluterClassPricing;
use Modules\AppDomoprime\Entities\DomoprimePolluterProperty;
use Modules\AppDomoprime\Entities\DomoprimePolluterRecipient;
use Modules\AppDomoprime\Entities\DomoprimePreMeetingModel;
use Modules\AppDomoprime\Entities\DomoprimeQuotationModel;
use Modules\AppDomoprime\Entities\CustomerMeetingFormDocument;
use Modules\AppDomoprime\Entities\PartnerLayerCompany;
use Modules\AppDomoprime\Entities\PartnerPolluterAfterWork;
use Modules\AppDomoprime\Entities\PartnerPolluterBilling;
use Modules\AppDomoprime\Entities\PartnerPolluterContact;
use Modules\AppDomoprime\Entities\PartnerPolluterDocument;
use Modules\AppDomoprime\Entities\PartnerPolluterModel;
use Modules\AppDomoprime\Entities\PartnerPolluterModelI18n;
use Modules\AppDomoprime\Entities\PartnerPolluterPreMeeting;
use Modules\AppDomoprime\Entities\PartnerPolluterQuotation;
use Modules\AppDomoprime\Entities\PartnerRecipientCompany;
use Modules\PartnerPolluter\Entities\PartnerPolluterCompany;
use Modules\PartnerPolluter\Entities\PartnerPolluterProduct;
use Modules\Product\Entities\Product;

/**
 * Sub-CRUDs for the polluter detail page.
 * Mirrors theme32a actions: contacts, layer, pricing, recipients, models, etc.
 */
class PolluterSubController extends Controller
{
    // ═════════════════════════════════════════════════════════════════════════
    //  CONTACTS  (t_partner_polluter_contact)
    //  Symfony actions: ListPollutingContact, NewPollutingContact,
    //                   ViewPollutingContact, SavePollutingContact, DeletePollutingContact
    // ═════════════════════════════════════════════════════════════════════════

    public function contactsIndex(int $polluterId): JsonResponse
    {
        if (!PartnerPolluterCompany::where('id', $polluterId)->exists()) {
            return $this->notFound('Polluter');
        }

        $items = PartnerPolluterContact::where('company_id', $polluterId)
            ->where('status', 'ACTIVE')
            ->orderBy('lastname')
            ->orderBy('firstname')
            ->get()
            ->map(fn ($c) => $this->formatContact($c));

        return response()->json(['success' => true, 'data' => $items]);
    }

    public function contactStore(Request $request, int $polluterId): JsonResponse
    {
        if (!PartnerPolluterCompany::where('id', $polluterId)->exists()) {
            return $this->notFound('Polluter');
        }

        $validator = Validator::make($request->all(), $this->contactRules());
        if ($validator->fails()) {
            return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
        }

        $data = $validator->validated();
        $data['company_id'] = $polluterId;
        $data['status']     = 'ACTIVE';

        $contact = PartnerPolluterContact::create($data);

        return response()->json([
            'success' => true,
            'message' => 'Contact created successfully.',
            'data'    => $this->formatContact($contact),
        ], 201);
    }

    public function contactUpdate(Request $request, int $polluterId, int $id): JsonResponse
    {
        $contact = PartnerPolluterContact::where('company_id', $polluterId)->find($id);
        if (!$contact) {
            return $this->notFound('Contact');
        }

        $rules = array_map(
            fn ($r) => is_string($r) ? str_replace('required|', 'sometimes|', $r) : $r,
            $this->contactRules(),
        );

        $validator = Validator::make($request->all(), $rules);
        if ($validator->fails()) {
            return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
        }

        $contact->update($validator->validated());

        return response()->json([
            'success' => true,
            'message' => 'Contact updated successfully.',
            'data'    => $this->formatContact($contact->fresh()),
        ]);
    }

    public function contactDestroy(int $polluterId, int $id): JsonResponse
    {
        $contact = PartnerPolluterContact::where('company_id', $polluterId)->find($id);
        if (!$contact) {
            return $this->notFound('Contact');
        }

        // Soft delete via status (Symfony pattern)
        $contact->update(['status' => 'DELETE']);

        return response()->json([
            'success' => true,
            'message' => 'Contact deleted successfully.',
            'data'    => ['id' => $id],
        ]);
    }

    protected function formatContact(PartnerPolluterContact $c): array
    {
        return [
            'id'         => $c->id,
            'company_id' => $c->company_id,
            'sex'        => $c->sex,
            'firstname'  => $c->firstname,
            'lastname'   => $c->lastname,
            'email'      => $c->email,
            'phone'      => $c->phone,
            'mobile'     => $c->mobile,
            'fax'        => $c->fax,
            'function'   => $c->function,
            'status'     => $c->status,
            'created_at' => $c->created_at?->format('Y-m-d H:i:s'),
        ];
    }

    protected function contactRules(): array
    {
        return [
            'sex'       => 'nullable|in:Mr,Ms,Mrs',
            'firstname' => 'required|string|max:16',
            'lastname'  => 'required|string|max:32',
            'email'     => 'nullable|email|max:255',
            'phone'     => 'nullable|string|max:20',
            'mobile'    => 'nullable|string|max:20',
            'fax'       => 'nullable|string|max:20',
            'function'  => 'nullable|string|max:64',
        ];
    }

    // ═════════════════════════════════════════════════════════════════════════
    //  RECIPIENT  (singleton — t_domoprime_polluter_recipient)
    //  Symfony actions: ViewRecipientForPolluter, SaveRecipientForPolluter
    // ═════════════════════════════════════════════════════════════════════════

    public function recipientShow(int $polluterId): JsonResponse
    {
        if (!PartnerPolluterCompany::where('id', $polluterId)->exists()) {
            return $this->notFound('Polluter');
        }

        $link = DomoprimePolluterRecipient::with('recipient')
            ->where('polluter_id', $polluterId)
            ->first();

        $options = PartnerRecipientCompany::where('status', '!=', 'DELETED')
            ->where('is_active', 'YES')
            ->orderBy('name')
            ->get(['id', 'name', 'commercial', 'city']);

        return response()->json([
            'success' => true,
            'data'    => [
                'recipient_id'   => $link?->recipient_id,
                'recipient_name' => $link?->recipient?->name,
                'options'        => $options,
            ],
        ]);
    }

    public function recipientSave(Request $request, int $polluterId): JsonResponse
    {
        if (!PartnerPolluterCompany::where('id', $polluterId)->exists()) {
            return $this->notFound('Polluter');
        }

        $validator = Validator::make($request->all(), [
            'recipient_id' => 'nullable|integer|exists:tenant.t_partner_recipient_company,id',
        ]);
        if ($validator->fails()) {
            return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
        }

        $recipientId = $request->input('recipient_id');

        if ($recipientId) {
            DomoprimePolluterRecipient::updateOrCreate(
                ['polluter_id' => $polluterId],
                ['recipient_id' => $recipientId],
            );
            $message = 'Recipient assigned successfully.';
        } else {
            // Symfony: empty recipient_id => delete the link
            DomoprimePolluterRecipient::where('polluter_id', $polluterId)->delete();
            $message = 'Recipient cleared successfully.';
        }

        $link = DomoprimePolluterRecipient::with('recipient')
            ->where('polluter_id', $polluterId)
            ->first();

        return response()->json([
            'success' => true,
            'message' => $message,
            'data'    => [
                'recipient_id'   => $link?->recipient_id,
                'recipient_name' => $link?->recipient?->name,
            ],
        ]);
    }

    // ═════════════════════════════════════════════════════════════════════════
    //  LAYER  (singleton — column layer_id on t_partner_polluter_company)
    //  Symfony actions: ViewLayerForPolluter, SaveLayerForPolluter
    // ═════════════════════════════════════════════════════════════════════════

    public function layerShow(int $polluterId): JsonResponse
    {
        $polluter = PartnerPolluterCompany::find($polluterId);
        if (!$polluter) {
            return $this->notFound('Polluter');
        }

        $options = PartnerLayerCompany::where('status', '!=', 'DELETED')
            ->where('is_active', 'YES')
            ->orderBy('name')
            ->get(['id', 'name', 'commercial', 'rge', 'city']);

        $current = $polluter->layer_id
            ? PartnerLayerCompany::find($polluter->layer_id)
            : null;

        return response()->json([
            'success' => true,
            'data'    => [
                'layer_id'   => $polluter->layer_id,
                'layer_name' => $current?->name,
                'options'    => $options,
            ],
        ]);
    }

    public function layerSave(Request $request, int $polluterId): JsonResponse
    {
        $polluter = PartnerPolluterCompany::find($polluterId);
        if (!$polluter) {
            return $this->notFound('Polluter');
        }

        $validator = Validator::make($request->all(), [
            'layer_id' => 'nullable|integer|exists:tenant.t_partner_layer_company,id',
        ]);
        if ($validator->fails()) {
            return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
        }

        $polluter->update(['layer_id' => $request->input('layer_id') ?: null]);

        $current = $polluter->fresh()->layer_id
            ? PartnerLayerCompany::find($polluter->layer_id)
            : null;

        return response()->json([
            'success' => true,
            'message' => 'Layer updated successfully.',
            'data'    => [
                'layer_id'   => $polluter->fresh()->layer_id,
                'layer_name' => $current?->name,
            ],
        ]);
    }

    // ═════════════════════════════════════════════════════════════════════════
    //  MODEL SELECTORS  (singletons — quotation, billing, premeeting, afterwork)
    //  Symfony actions: View<X>ModelForPolluter, Save<X>ModelForPolluter
    //
    //  Quotation has 3 fields: model_id, pre_model_id, post_company_model_id
    //  Others have a single model_id
    // ═════════════════════════════════════════════════════════════════════════

    /** @var array<string, array{table: class-string, options: class-string, fields: string[]}> */
    protected array $modelMap = [];

    protected function modelMap(): array
    {
        if (empty($this->modelMap)) {
            $this->modelMap = [
                'quotation' => [
                    'link'    => PartnerPolluterQuotation::class,
                    'options' => DomoprimeQuotationModel::class,
                    'fields'  => ['model_id', 'pre_model_id', 'post_company_model_id'],
                ],
                'billing' => [
                    'link'    => PartnerPolluterBilling::class,
                    'options' => DomoprimeBillingModel::class,
                    'fields'  => ['model_id'],
                ],
                'premeeting' => [
                    'link'    => PartnerPolluterPreMeeting::class,
                    'options' => DomoprimePreMeetingModel::class,
                    'fields'  => ['model_id'],
                ],
                'afterwork' => [
                    'link'    => PartnerPolluterAfterWork::class,
                    'options' => DomoprimeAfterWorkModel::class,
                    'fields'  => ['model_id'],
                ],
            ];
        }

        return $this->modelMap;
    }

    public function modelShow(Request $request, int $polluterId, string $type): JsonResponse
    {
        $cfg = $this->modelMap()[$type] ?? null;
        if (!$cfg) {
            return $this->notFound("Model type [{$type}]");
        }
        if (!PartnerPolluterCompany::where('id', $polluterId)->exists()) {
            return $this->notFound('Polluter');
        }

        $lang = $request->query('lang', 'fr');

        /** @var class-string $linkClass */
        $linkClass = $cfg['link'];
        /** @var class-string $optClass */
        $optClass = $cfg['options'];

        $link = $linkClass::where('polluter_id', $polluterId)->first();

        // Each model has a translations relation (lang/value)
        $options = $optClass::with(['translations' => fn ($q) => $q->where('lang', $lang)])
            ->orderBy('id')
            ->get()
            ->map(fn ($m) => [
                'id'   => $m->id,
                'name' => $m->translations->first()?->value ?? $m->name,
            ])
            ->values();

        $values = [];
        foreach ($cfg['fields'] as $f) {
            $values[$f] = $link?->{$f};
        }

        return response()->json([
            'success' => true,
            'data'    => [
                'type'    => $type,
                'fields'  => $cfg['fields'],
                'values'  => $values,
                'options' => $options,
            ],
        ]);
    }

    public function modelSave(Request $request, int $polluterId, string $type): JsonResponse
    {
        $cfg = $this->modelMap()[$type] ?? null;
        if (!$cfg) {
            return $this->notFound("Model type [{$type}]");
        }
        if (!PartnerPolluterCompany::where('id', $polluterId)->exists()) {
            return $this->notFound('Polluter');
        }

        $rules = [];
        foreach ($cfg['fields'] as $f) {
            $rules[$f] = 'nullable|integer';
        }

        $validator = Validator::make($request->all(), $rules);
        if ($validator->fails()) {
            return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
        }

        $data = [];
        foreach ($cfg['fields'] as $f) {
            $data[$f] = $request->input($f) ?: null;
        }

        /** @var class-string $linkClass */
        $linkClass = $cfg['link'];

        $linkClass::updateOrCreate(
            ['polluter_id' => $polluterId],
            $data,
        );

        return response()->json([
            'success' => true,
            'message' => ucfirst($type) . ' model updated successfully.',
            'data'    => $data,
        ]);
    }

    // ═════════════════════════════════════════════════════════════════════════
    //  PRICING  (CUMAC tariff per class — t_domoprime_polluter_class)
    //  Symfony actions: ListPartialPricingForPolluter, NewPricingForPolluter,
    //                   ViewPricingForPolluter, SavePricingForPolluter,
    //                   DeletePolluterPricing
    // ═════════════════════════════════════════════════════════════════════════

    public function pricingIndex(Request $request, int $polluterId): JsonResponse
    {
        if (!PartnerPolluterCompany::where('id', $polluterId)->exists()) {
            return $this->notFound('Polluter');
        }

        $lang = $request->query('lang', 'fr');

        $items = DomoprimePolluterClassPricing::with([
                'class.translations' => fn ($q) => $q->where('lang', $lang),
            ])
            ->where('polluter_id', $polluterId)
            ->orderBy('id')
            ->get()
            ->map(fn ($p) => $this->formatPricing($p));

        $classes = DomoprimeClass::with(['translations' => fn ($q) => $q->where('lang', $lang)])
            ->orderBy('id')
            ->get()
            ->map(fn ($c) => [
                'id'   => $c->id,
                'name' => $c->translations->first()?->value ?? $c->name,
            ])
            ->values();

        return response()->json([
            'success' => true,
            'data'    => [
                'items'   => $items,
                'classes' => $classes,
            ],
        ]);
    }

    public function pricingStore(Request $request, int $polluterId): JsonResponse
    {
        if (!PartnerPolluterCompany::where('id', $polluterId)->exists()) {
            return $this->notFound('Polluter');
        }

        $validator = Validator::make($request->all(), $this->pricingRules(/* requireClass */ true));
        if ($validator->fails()) {
            return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
        }

        $data = $validator->validated();

        // Symfony: prevent duplicate (polluter_id, class_id)
        if (DomoprimePolluterClassPricing::where('polluter_id', $polluterId)
            ->where('class_id', $data['class_id'])
            ->exists()) {
            return response()->json([
                'success' => false,
                'errors'  => ['class_id' => ['Pricing already exists for this class.']],
            ], 422);
        }

        $data['polluter_id'] = $polluterId;
        $pricing = DomoprimePolluterClassPricing::create($data);
        $pricing->load(['class.translations' => fn ($q) => $q->where('lang', 'fr')]);

        return response()->json([
            'success' => true,
            'message' => 'Pricing created successfully.',
            'data'    => $this->formatPricing($pricing),
        ], 201);
    }

    public function pricingUpdate(Request $request, int $polluterId, int $id): JsonResponse
    {
        $pricing = DomoprimePolluterClassPricing::where('polluter_id', $polluterId)->find($id);
        if (!$pricing) {
            return $this->notFound('Pricing');
        }

        $rules = array_map(
            fn ($r) => is_string($r) ? str_replace('required|', 'sometimes|', $r) : $r,
            $this->pricingRules(/* requireClass */ false),
        );

        $validator = Validator::make($request->all(), $rules);
        if ($validator->fails()) {
            return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
        }

        $data = $validator->validated();

        // If class_id is changed, ensure no duplicate
        if (isset($data['class_id']) && $data['class_id'] !== $pricing->class_id) {
            if (DomoprimePolluterClassPricing::where('polluter_id', $polluterId)
                ->where('class_id', $data['class_id'])
                ->where('id', '!=', $id)
                ->exists()) {
                return response()->json([
                    'success' => false,
                    'errors'  => ['class_id' => ['Pricing already exists for this class.']],
                ], 422);
            }
        }

        $pricing->update($data);
        $pricing->load(['class.translations' => fn ($q) => $q->where('lang', 'fr')]);

        return response()->json([
            'success' => true,
            'message' => 'Pricing updated successfully.',
            'data'    => $this->formatPricing($pricing->fresh(['class.translations' => fn ($q) => $q->where('lang', 'fr')])),
        ]);
    }

    public function pricingDestroy(int $polluterId, int $id): JsonResponse
    {
        $pricing = DomoprimePolluterClassPricing::where('polluter_id', $polluterId)->find($id);
        if (!$pricing) {
            return $this->notFound('Pricing');
        }

        $pricing->delete();

        return response()->json([
            'success' => true,
            'message' => 'Pricing deleted successfully.',
            'data'    => ['id' => $id],
        ]);
    }

    protected function formatPricing(DomoprimePolluterClassPricing $p): array
    {
        $className = $p->class?->translations->first()?->value ?? $p->class?->name;

        return [
            'id'                     => $p->id,
            'polluter_id'            => $p->polluter_id,
            'class_id'               => $p->class_id,
            'class_name'             => $className,
            'coef'                   => $p->coef,
            'multiple'               => $p->multiple,
            'multiple_floor'         => $p->multiple_floor,
            'multiple_top'           => $p->multiple_top,
            'multiple_wall'          => $p->multiple_wall,
            'prime'                  => $p->prime,
            'pack_prime'             => $p->pack_prime,
            'pack_coef'              => $p->pack_coef,
            'boiler_coef'            => $p->boiler_coef,
            'ana_prime'              => $p->ana_prime,
            'ana_limit'              => $p->ana_limit,
            'ite_prime'              => $p->ite_prime,
            'ite_coef'               => $p->ite_coef,
            'max_limit'              => $p->max_limit,
            'bbc_prime'              => $p->bbc_prime,
            'strainer_prime'         => $p->strainer_prime,
            'bbc_article_prime'      => $p->bbc_article_prime,
            'strainer_article_prime' => $p->strainer_article_prime,
        ];
    }

    protected function pricingRules(bool $requireClass): array
    {
        return [
            'class_id'        => $requireClass ? 'required|integer' : 'nullable|integer',
            'coef'            => 'required|numeric',
            'multiple'        => 'nullable|numeric',
            'multiple_floor'  => 'nullable|numeric',
            'multiple_top'    => 'nullable|numeric',
            'multiple_wall'   => 'nullable|numeric',
            'prime'           => 'nullable|numeric',
            'pack_prime'      => 'nullable|numeric',
            'pack_coef'       => 'nullable|numeric',
            'boiler_coef'     => 'nullable|numeric',
            'ana_prime'       => 'nullable|numeric',
            'ana_limit'       => 'nullable|numeric',
            'ite_prime'       => 'nullable|numeric',
            'ite_coef'        => 'nullable|numeric',
            'max_limit'       => 'nullable|numeric',
            'bbc_prime'       => 'nullable|numeric',
            'strainer_prime'  => 'nullable|numeric',
            'bbc_article_prime' => 'nullable|numeric',
            'strainer_article_prime' => 'nullable|numeric',
        ];
    }

    // ═════════════════════════════════════════════════════════════════════════
    //  PROPERTIES  (Primes ISO/ISO3 — singleton t_domoprime_polluter_property)
    //  Symfony actions: ViewPropertiesForPolluter, SavePropertiesForPolluter
    //  Fields: prime, pack_prime (base ISO) + home_prime (ISO3) + ite_prime/ana_prime (legacy)
    // ═════════════════════════════════════════════════════════════════════════

    public function propertyShow(int $polluterId): JsonResponse
    {
        if (!PartnerPolluterCompany::where('id', $polluterId)->exists()) {
            return $this->notFound('Polluter');
        }

        $prop = DomoprimePolluterProperty::where('polluter_id', $polluterId)->first();

        return response()->json([
            'success' => true,
            'data'    => [
                'id'         => $prop?->id,
                'prime'      => $prop?->prime,
                'pack_prime' => $prop?->pack_prime,
                'ite_prime'  => $prop?->ite_prime,
                'ana_prime'  => $prop?->ana_prime,
                'home_prime' => $prop?->home_prime,
            ],
        ]);
    }

    public function propertySave(Request $request, int $polluterId): JsonResponse
    {
        if (!PartnerPolluterCompany::where('id', $polluterId)->exists()) {
            return $this->notFound('Polluter');
        }

        $validator = Validator::make($request->all(), [
            'prime'      => 'nullable|numeric',
            'pack_prime' => 'nullable|numeric',
            'ite_prime'  => 'nullable|numeric',
            'ana_prime'  => 'nullable|numeric',
            'home_prime' => 'nullable|numeric',
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
        }

        $data = $validator->validated();
        // Symfony stores 0 (NOT NULL) if not provided for prime/pack_prime
        $data['prime']      = $data['prime'] ?? 0;
        $data['pack_prime'] = $data['pack_prime'] ?? 0;

        $prop = DomoprimePolluterProperty::updateOrCreate(
            ['polluter_id' => $polluterId],
            $data,
        );

        return response()->json([
            'success' => true,
            'message' => 'Properties updated successfully.',
            'data'    => [
                'id'         => $prop->id,
                'prime'      => $prop->prime,
                'pack_prime' => $prop->pack_prime,
                'ite_prime'  => $prop->ite_prime,
                'ana_prime'  => $prop->ana_prime,
                'home_prime' => $prop->home_prime,
            ],
        ]);
    }

    // ═════════════════════════════════════════════════════════════════════════
    //  MODELS I18N  (template models — t_partner_polluter_model + _i18n)
    //  Symfony actions: ListPartialModelI18nForPolluter, NewModelI18n,
    //                   ViewModelI18n, SaveNewModelI18n, SaveModelI18n,
    //                   NewPDFModelI18n, ViewPDFModelI18n, NewDocModelI18n,
    //                   ViewDocModelI18n, DeleteModel
    //
    //  This implementation handles the "text" model (no file).
    //  PDF/DocX uploads are handled separately via dedicated upload routes.
    // ═════════════════════════════════════════════════════════════════════════

    public function modelsIndex(Request $request, int $polluterId): JsonResponse
    {
        if (!PartnerPolluterCompany::where('id', $polluterId)->exists()) {
            return $this->notFound('Polluter');
        }

        $lang = $request->query('lang', 'fr');
        $document = $request->query('document'); // 'used' | 'not_used' | null

        $query = PartnerPolluterModel::with([
            'translations' => fn ($q) => $q->where('lang', $lang),
        ])
            ->where('polluter_id', $polluterId)
            ->orderBy('id');

        $items = $query->get()->map(fn ($m) => $this->formatModel($m));

        if ($document === 'used') {
            // TODO when document linkage table is wired (t_partner_polluter_document)
        }

        return response()->json([
            'success' => true,
            'data'    => [
                'items' => $items,
                'lang'  => $lang,
            ],
        ]);
    }

    public function modelStore(Request $request, int $polluterId): JsonResponse
    {
        if (!PartnerPolluterCompany::where('id', $polluterId)->exists()) {
            return $this->notFound('Polluter');
        }

        $validator = Validator::make($request->all(), [
            'name'      => 'required|string|max:255',
            'extension' => 'nullable|string|max:4',
            'lang'      => 'required|string|max:5',
            'value'     => 'required|string|max:255',
            'content'   => 'nullable|string',
            'comments'  => 'nullable|string',
            'variables' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
        }

        $data = $validator->validated();

        if (PartnerPolluterModel::where('polluter_id', $polluterId)->where('name', $data['name'])->exists()) {
            return response()->json([
                'success' => false,
                'errors'  => ['name' => ['A model with this name already exists for this polluter.']],
            ], 422);
        }

        $model = PartnerPolluterModel::create([
            'polluter_id' => $polluterId,
            'name'        => $data['name'],
            'extension'   => $data['extension'] ?? '',
        ]);

        PartnerPolluterModelI18n::create([
            'model_id'  => $model->id,
            'lang'      => $data['lang'],
            'value'     => $data['value'],
            'content'   => $data['content']   ?? '',
            'comments'  => $data['comments']  ?? '',
            'variables' => $data['variables'] ?? '',
            'file'      => '',
            'signature' => '',
            'initiator_signature' => '',
            'mapping'   => '',
        ]);

        $model->load(['translations' => fn ($q) => $q->where('lang', $data['lang'])]);

        return response()->json([
            'success' => true,
            'message' => 'Model created successfully.',
            'data'    => $this->formatModel($model),
        ], 201);
    }

    public function modelUpdate(Request $request, int $polluterId, int $id): JsonResponse
    {
        $model = PartnerPolluterModel::where('polluter_id', $polluterId)->find($id);
        if (!$model) {
            return $this->notFound('Model');
        }

        $validator = Validator::make($request->all(), [
            'name'      => 'sometimes|string|max:255',
            'extension' => 'sometimes|nullable|string|max:4',
            'lang'      => 'required|string|max:5',
            'value'     => 'sometimes|string|max:255',
            'content'   => 'nullable|string',
            'comments'  => 'nullable|string',
            'variables' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
        }

        $data = $validator->validated();
        $lang = $data['lang'];

        if (isset($data['name']) || isset($data['extension'])) {
            $model->update(array_intersect_key($data, array_flip(['name', 'extension'])));
        }

        $i18nData = array_intersect_key($data, array_flip(['value', 'content', 'comments', 'variables']));
        if (!empty($i18nData)) {
            PartnerPolluterModelI18n::updateOrCreate(
                ['model_id' => $id, 'lang' => $lang],
                $i18nData,
            );
        }

        $model->load(['translations' => fn ($q) => $q->where('lang', $lang)]);

        return response()->json([
            'success' => true,
            'message' => 'Model updated successfully.',
            'data'    => $this->formatModel($model->fresh(['translations' => fn ($q) => $q->where('lang', $lang)])),
        ]);
    }

    public function modelDestroy(int $polluterId, int $id): JsonResponse
    {
        $model = PartnerPolluterModel::where('polluter_id', $polluterId)->find($id);
        if (!$model) {
            return $this->notFound('Model');
        }

        $model->translations()->delete();
        $model->delete();

        return response()->json([
            'success' => true,
            'message' => 'Model deleted successfully.',
            'data'    => ['id' => $id],
        ]);
    }

    protected function formatModel(PartnerPolluterModel $m): array
    {
        $i18n = $m->translations->first();

        return [
            'id'          => $m->id,
            'polluter_id' => $m->polluter_id,
            'name'        => $m->name,
            'extension'   => $m->extension,
            'has_i18n'    => $i18n !== null,
            'value'       => $i18n?->value,
            'file'        => $i18n?->file,
            'content'     => $i18n?->content,
            'comments'    => $i18n?->comments,
            'variables'   => $i18n?->variables,
            'is_pdf'      => $i18n && strtolower((string) $m->extension) === 'pdf',
            'is_docx'     => $i18n && in_array(strtolower((string) $m->extension), ['doc', 'docx'], true),
        ];
    }

    // ═════════════════════════════════════════════════════════════════════════
    //  DOCUMENTS  (links between polluter, document form and model template)
    //  Table: t_partner_polluter_document
    //  Symfony actions: ListPartialDocumentForPolluter, ViewDocumentForPolluter,
    //                   SaveDocumentForPolluter
    // ═════════════════════════════════════════════════════════════════════════

    public function polluterDocsIndex(Request $request, int $polluterId): JsonResponse
    {
        if (!PartnerPolluterCompany::where('id', $polluterId)->exists()) {
            return $this->notFound('Polluter');
        }

        $lang = $request->query('lang', 'fr');

        $items = PartnerPolluterDocument::with([
                'document',
                'model.translations' => fn ($q) => $q->where('lang', $lang),
            ])
            ->where('polluter_id', $polluterId)
            ->orderBy('id')
            ->get()
            ->map(fn ($d) => $this->formatPolluterDocument($d));

        return response()->json([
            'success' => true,
            'data'    => ['items' => $items],
        ]);
    }

    public function polluterDocsOptions(Request $request, int $polluterId): JsonResponse
    {
        if (!PartnerPolluterCompany::where('id', $polluterId)->exists()) {
            return $this->notFound('Polluter');
        }

        $lang = $request->query('lang', 'fr');

        $documents = CustomerMeetingFormDocument::orderBy('name')
            ->get(['id', 'name', 'type', 'model_id'])
            ->map(fn ($d) => ['id' => $d->id, 'name' => $d->name])
            ->values();

        $models = PartnerPolluterModel::with(['translations' => fn ($q) => $q->where('lang', $lang)])
            ->where('polluter_id', $polluterId)
            ->orderBy('id')
            ->get()
            ->map(fn ($m) => [
                'id'   => $m->id,
                'name' => $m->translations->first()?->value ?? $m->name,
            ])
            ->values();

        return response()->json([
            'success' => true,
            'data'    => [
                'documents' => $documents,
                'models'    => $models,
            ],
        ]);
    }

    public function polluterDocStore(Request $request, int $polluterId): JsonResponse
    {
        if (!PartnerPolluterCompany::where('id', $polluterId)->exists()) {
            return $this->notFound('Polluter');
        }

        $validator = Validator::make($request->all(), [
            'document_id' => 'required|integer',
            'model_id'    => 'nullable|integer',
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
        }

        $data = $validator->validated();

        if (PartnerPolluterDocument::where('polluter_id', $polluterId)
            ->where('document_id', $data['document_id'])
            ->exists()) {
            return response()->json([
                'success' => false,
                'errors'  => ['document_id' => ['This document is already bound to this polluter.']],
            ], 422);
        }

        $doc = PartnerPolluterDocument::create([
            'polluter_id' => $polluterId,
            'document_id' => $data['document_id'],
            'model_id'    => $data['model_id'] ?? null,
        ]);
        $doc->load(['document', 'model.translations' => fn ($q) => $q->where('lang', 'fr')]);

        return response()->json([
            'success' => true,
            'message' => 'Document binding created.',
            'data'    => $this->formatPolluterDocument($doc),
        ], 201);
    }

    public function polluterDocUpdate(Request $request, int $polluterId, int $id): JsonResponse
    {
        $doc = PartnerPolluterDocument::where('polluter_id', $polluterId)->find($id);
        if (!$doc) {
            return $this->notFound('Document binding');
        }

        $validator = Validator::make($request->all(), [
            'document_id' => 'sometimes|integer',
            'model_id'    => 'nullable|integer',
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
        }

        $doc->update($validator->validated());
        $doc->load(['document', 'model.translations' => fn ($q) => $q->where('lang', 'fr')]);

        return response()->json([
            'success' => true,
            'message' => 'Document binding updated.',
            'data'    => $this->formatPolluterDocument($doc->fresh(['document', 'model.translations' => fn ($q) => $q->where('lang', 'fr')])),
        ]);
    }

    public function polluterDocDestroy(int $polluterId, int $id): JsonResponse
    {
        $doc = PartnerPolluterDocument::where('polluter_id', $polluterId)->find($id);
        if (!$doc) {
            return $this->notFound('Document binding');
        }

        $doc->delete();

        return response()->json([
            'success' => true,
            'message' => 'Document binding deleted.',
            'data'    => ['id' => $id],
        ]);
    }

    protected function formatPolluterDocument(PartnerPolluterDocument $d): array
    {
        $modelI18n = $d->model?->translations->first();

        return [
            'id'            => $d->id,
            'polluter_id'   => $d->polluter_id,
            'document_id'   => $d->document_id,
            'document_name' => $d->document?->name,
            'model_id'      => $d->model_id,
            'model_name'    => $modelI18n?->value ?? $d->model?->name,
        ];
    }

    // ═════════════════════════════════════════════════════════════════════════
    //  PRODUCT  (singleton — t_partner_polluter_product, ISO5 module)
    //  Symfony actions: ListProductForPolluter, SaveProductForPolluter
    //  Form: radio buttons listing products with engine info
    // ═════════════════════════════════════════════════════════════════════════

    public function productShow(int $polluterId): JsonResponse
    {
        if (!PartnerPolluterCompany::where('id', $polluterId)->exists()) {
            return $this->notFound('Polluter');
        }

        $current = PartnerPolluterProduct::with('product')
            ->where('polluter_id', $polluterId)
            ->first();

        $products = Product::query()
            ->where('status', '!=', 'DELETE')
            ->where('is_active', 'YES')
            ->orderBy('engine')
            ->orderBy('reference')
            ->get(['id', 'engine', 'reference', 'meta_title'])
            ->map(fn ($p) => [
                'id'        => $p->id,
                'engine'    => $p->engine,
                'reference' => $p->reference,
                'name'      => $p->meta_title ?: $p->reference,
            ])
            ->values();

        return response()->json([
            'success' => true,
            'data'    => [
                'product_id'   => $current?->product_id,
                'product_name' => $current?->product?->meta_title ?: $current?->product?->reference,
                'options'      => $products,
            ],
        ]);
    }

    public function productSave(Request $request, int $polluterId): JsonResponse
    {
        if (!PartnerPolluterCompany::where('id', $polluterId)->exists()) {
            return $this->notFound('Polluter');
        }

        $validator = Validator::make($request->all(), [
            'product_id' => 'nullable|integer|exists:tenant.t_products,id',
        ]);
        if ($validator->fails()) {
            return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
        }

        $productId = $request->input('product_id');

        if ($productId) {
            PartnerPolluterProduct::updateOrCreate(
                ['polluter_id' => $polluterId],
                ['product_id' => $productId],
            );
            $message = 'Product assigned to polluter.';
        } else {
            PartnerPolluterProduct::where('polluter_id', $polluterId)->delete();
            $message = 'Product cleared from polluter.';
        }

        $current = PartnerPolluterProduct::with('product')
            ->where('polluter_id', $polluterId)
            ->first();

        return response()->json([
            'success' => true,
            'message' => $message,
            'data'    => [
                'product_id'   => $current?->product_id,
                'product_name' => $current?->product?->meta_title ?: $current?->product?->reference,
            ],
        ]);
    }

    // ═════════════════════════════════════════════════════════════════════════
    //  HELPERS
    // ═════════════════════════════════════════════════════════════════════════

    protected function notFound(string $what): JsonResponse
    {
        return response()->json([
            'success' => false,
            'message' => "{$what} not found.",
        ], 404);
    }
}
