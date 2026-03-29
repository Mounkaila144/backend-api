<?php

namespace Modules\CustomersMeetingsForms\Http\Controllers\Admin;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Modules\CustomersContracts\Entities\CustomerContract;

/**
 * Serves dynamic meeting form data for the "Informations" tab.
 *
 * Reproduces Symfony's CustomerMeetingViewFormsForContractForm:
 * - Loads form schema (fields) from t_customers_meeting_formfield
 * - Loads i18n labels from t_customers_meeting_formfield_i18n
 * - Loads saved form data from t_customers_meeting_forms
 * - Parses PHP-serialized parameters for choices (select/checkbox options)
 */
class MeetingFormsController extends Controller
{
    public function forContract(Request $request, int $contractId): JsonResponse
    {
        $contract = CustomerContract::on('tenant')->findOrFail($contractId);
        $lang = $request->query('lang', 'fr');

        // Get active form definition
        $formDef = \DB::connection('tenant')
            ->table('t_customers_meeting_form')
            ->where('is_active', 'Y')
            ->first();

        if (!$formDef) {
            return response()->json([
                'success' => true,
                'data' => ['form' => null, 'fields' => [], 'values' => (object) []],
            ]);
        }

        // Get ALL fields with i18n labels via JOIN (Symfony shows all fields)
        $fields = \DB::connection('tenant')
            ->table('t_customers_meeting_formfield as f')
            ->leftJoin('t_customers_meeting_formfield_i18n as i', function ($j) use ($lang) {
                $j->on('i.formfield_id', '=', 'f.id')->where('i.lang', '=', $lang);
            })
            ->where('f.form_id', $formDef->id)
            ->orderBy('f.position')
            ->select('f.id', 'f.name', 'f.type', 'f.widget', 'f.default', 'f.position', 'i.request as label', 'i.parameters')
            ->get()
            ->map(function ($f) {
                // Parse PHP-serialized parameters for choices
                $choices = [];
                if ($f->parameters) {
                    $params = @unserialize($f->parameters);
                    if (is_array($params) && isset($params['choices']) && is_array($params['choices'])) {
                        $choices = array_values($params['choices']);
                    }
                }

                return [
                    'id' => $f->id,
                    'name' => $f->name,
                    'label' => $f->label ?: $f->name,
                    'type' => $f->type,
                    'widget' => $f->widget,
                    'default' => $f->default,
                    'position' => $f->position,
                    'choices' => $choices,
                ];
            });

        // Get saved form data for this contract
        // Symfony stores data as PHP serialized with structure: {form_name: {field_name: value}}
        // Values for checkbox/select fields are stored as indices into the choices array
        $formData = \DB::connection('tenant')
            ->table('t_customers_meeting_forms')
            ->where('contract_id', $contractId)
            ->first();

        // Build default values from field definitions (like Symfony's getDefaultValues())
        $defaults = [];
        foreach ($fields as $field) {
            $defaults[$field['name']] = $field['default'] ?? null;
        }

        // Load saved values
        $savedValues = [];
        if ($formData && $formData->data) {
            // Try PHP unserialize first (Symfony format), then JSON fallback
            $allData = @unserialize($formData->data);
            if (!is_array($allData)) {
                $allData = json_decode($formData->data, true);
            }

            if (is_array($allData) && isset($allData[$formDef->name])) {
                $savedValues = $allData[$formDef->name];
            } elseif (is_array($allData) && !isset($allData[0])) {
                $savedValues = $allData;
            }
        }

        // Merge: saved values override defaults (like Symfony's setDefaultValues())
        $mergedValues = $defaults;
        if (is_array($savedValues)) {
            foreach ($savedValues as $key => $val) {
                if ($val !== null && $val !== '') {
                    $mergedValues[$key] = $val;
                }
            }
        }

        $values = (object) $mergedValues;

        return response()->json([
            'success' => true,
            'data' => [
                'form' => ['id' => $formDef->id, 'name' => $formDef->name],
                'fields' => $fields,
                'values' => $values,
                'is_hold' => $formData ? ($formData->is_hold ?? 'NO') : 'NO',
            ],
        ]);
    }

    /**
     * Get form data for a meeting (Informations tab).
     */
    public function forMeeting(Request $request, int $meetingId): JsonResponse
    {
        $lang = $request->query('lang', 'fr');

        $formDef = \DB::connection('tenant')
            ->table('t_customers_meeting_form')
            ->where('is_active', 'Y')
            ->first();

        if (!$formDef) {
            return response()->json([
                'success' => true,
                'data' => ['form' => null, 'fields' => [], 'values' => (object) []],
            ]);
        }

        $fields = \DB::connection('tenant')
            ->table('t_customers_meeting_formfield as f')
            ->leftJoin('t_customers_meeting_formfield_i18n as i', function ($j) use ($lang) {
                $j->on('i.formfield_id', '=', 'f.id')->where('i.lang', '=', $lang);
            })
            ->where('f.form_id', $formDef->id)
            ->orderBy('f.position')
            ->select('f.id', 'f.name', 'f.type', 'f.widget', 'f.default', 'f.position', 'i.request as label', 'i.parameters')
            ->get()
            ->map(function ($f) {
                $choices = [];
                if ($f->parameters) {
                    $params = @unserialize($f->parameters);
                    if (is_array($params) && isset($params['choices']) && is_array($params['choices'])) {
                        $choices = array_values($params['choices']);
                    }
                }

                return [
                    'id' => $f->id,
                    'name' => $f->name,
                    'label' => $f->label ?: $f->name,
                    'type' => $f->type,
                    'widget' => $f->widget,
                    'default' => $f->default,
                    'position' => $f->position,
                    'choices' => $choices,
                ];
            });

        $formData = \DB::connection('tenant')
            ->table('t_customers_meeting_forms')
            ->where('meeting_id', $meetingId)
            ->first();

        $defaults = [];
        foreach ($fields as $field) {
            $defaults[$field['name']] = $field['default'] ?? null;
        }

        $savedValues = [];
        if ($formData && $formData->data) {
            $allData = @unserialize($formData->data);
            if (!is_array($allData)) {
                $allData = json_decode($formData->data, true);
            }
            if (is_array($allData) && isset($allData[$formDef->name])) {
                $savedValues = $allData[$formDef->name];
            } elseif (is_array($allData) && !isset($allData[0])) {
                $savedValues = $allData;
            }
        }

        $mergedValues = $defaults;
        if (is_array($savedValues)) {
            foreach ($savedValues as $key => $val) {
                if ($val !== null && $val !== '') {
                    $mergedValues[$key] = $val;
                }
            }
        }

        return response()->json([
            'success' => true,
            'data' => [
                'form' => ['id' => $formDef->id, 'name' => $formDef->name],
                'fields' => $fields,
                'values' => (object) $mergedValues,
            ],
        ]);
    }

    public function saveForMeeting(Request $request, int $meetingId): JsonResponse
    {
        $formValues = $request->input('values', []);

        $existing = \DB::connection('tenant')
            ->table('t_customers_meeting_forms')
            ->where('meeting_id', $meetingId)
            ->first();

        $allData = [];
        if ($existing && $existing->data) {
            $allData = @unserialize($existing->data);
            if (!is_array($allData)) {
                $allData = [];
            }
        }

        // Merge new values into existing data (preserving other form namespaces)
        if (is_array($formValues)) {
            foreach ($formValues as $formName => $fields) {
                if (is_array($fields)) {
                    $allData[$formName] = $fields;
                }
            }
        }

        $data = serialize($allData);

        if ($existing) {
            \DB::connection('tenant')
                ->table('t_customers_meeting_forms')
                ->where('id', $existing->id)
                ->update(['data' => $data, 'updated_at' => now()]);
        } else {
            \DB::connection('tenant')
                ->table('t_customers_meeting_forms')
                ->insert([
                    'meeting_id' => $meetingId,
                    'contract_id' => null,
                    'data' => $data,
                    'is_hold' => 'NO',
                    'is_exported' => 'NO',
                    'is_processed' => 'NO',
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
        }

        return response()->json(['success' => true]);
    }

    public function saveForContract(Request $request, int $contractId): JsonResponse
    {
        $contract = CustomerContract::on('tenant')->findOrFail($contractId);
        $formValues = $request->input('values', []);

        // Get active form name to store in the correct namespace
        $formDef = \DB::connection('tenant')
            ->table('t_customers_meeting_form')
            ->where('is_active', 'Y')
            ->first();

        // Read existing data to preserve other form namespaces
        $existing = \DB::connection('tenant')
            ->table('t_customers_meeting_forms')
            ->where('contract_id', $contractId)
            ->first();

        $allData = [];
        if ($existing && $existing->data) {
            $allData = @unserialize($existing->data);
            if (!is_array($allData)) {
                $allData = [];
            }
        }

        // Update the active form namespace
        if ($formDef) {
            $allData[$formDef->name] = $formValues;
        }

        // Store as PHP serialized (Symfony compatible)
        $data = serialize($allData);

        $existing = \DB::connection('tenant')
            ->table('t_customers_meeting_forms')
            ->where('contract_id', $contractId)
            ->first();

        if ($existing) {
            \DB::connection('tenant')
                ->table('t_customers_meeting_forms')
                ->where('id', $existing->id)
                ->update(['data' => $data, 'updated_at' => now()]);
        } else {
            \DB::connection('tenant')
                ->table('t_customers_meeting_forms')
                ->insert([
                    'contract_id' => $contractId,
                    'meeting_id' => $contract->meeting_id,
                    'data' => $data,
                    'is_hold' => 'NO',
                    'is_exported' => 'NO',
                    'is_processed' => 'NO',
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
        }

        return response()->json(['success' => true]);
    }

    // ─── Form Template CRUD (admin config) ─────────────────────────

    public function listFormTemplates(Request $request): JsonResponse
    {
        $lang = $request->query('lang', 'fr');

        $forms = \DB::connection('tenant')
            ->table('t_customers_meeting_form as f')
            ->leftJoin('t_customers_meeting_form_i18n as i', function ($j) use ($lang) {
                $j->on('i.form_id', '=', 'f.id')->where('i.lang', '=', $lang);
            })
            ->select('f.id', 'f.name', 'f.position', 'f.is_active', 'i.id as i18n_id', 'i.value as i18n_value')
            ->orderBy('f.position')
            ->get()
            ->map(fn ($f) => [
                'id' => $f->id,
                'name' => $f->name,
                'value' => $f->i18n_value ?? '',
                'position' => $f->position,
                'is_active' => $f->is_active ?? 'N',
            ]);

        return response()->json(['success' => true, 'data' => $forms]);
    }

    public function createFormTemplate(Request $request): JsonResponse
    {
        $name = $request->input('name', '');
        $value = $request->input('value', '');
        $lang = $request->input('lang', 'fr');

        if (!$name) {
            return response()->json(['success' => false, 'message' => 'Name is required'], 422);
        }

        $formId = \DB::connection('tenant')->table('t_customers_meeting_form')->insertGetId([
            'name' => $name,
            'position' => 0,
            'is_active' => 'Y',
        ]);

        \DB::connection('tenant')->table('t_customers_meeting_form_i18n')->insert([
            'form_id' => $formId,
            'lang' => $lang,
            'value' => $value ?: $name,
            'position' => 0,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        return response()->json(['success' => true, 'data' => ['id' => $formId]]);
    }

    public function updateFormTemplate(Request $request, int $id): JsonResponse
    {
        $name = $request->input('name');
        $value = $request->input('value');
        $lang = $request->input('lang', 'fr');
        $isActive = $request->input('is_active');

        $updates = [];
        if ($name !== null) $updates['name'] = $name;
        if ($isActive !== null) $updates['is_active'] = $isActive;

        if (!empty($updates)) {
            \DB::connection('tenant')->table('t_customers_meeting_form')->where('id', $id)->update($updates);
        }

        if ($value !== null) {
            $existing = \DB::connection('tenant')->table('t_customers_meeting_form_i18n')
                ->where('form_id', $id)->where('lang', $lang)->first();

            if ($existing) {
                \DB::connection('tenant')->table('t_customers_meeting_form_i18n')
                    ->where('id', $existing->id)->update(['value' => $value, 'updated_at' => now()]);
            } else {
                \DB::connection('tenant')->table('t_customers_meeting_form_i18n')->insert([
                    'form_id' => $id, 'lang' => $lang, 'value' => $value,
                    'position' => 0, 'created_at' => now(), 'updated_at' => now(),
                ]);
            }
        }

        return response()->json(['success' => true]);
    }

    public function deleteFormTemplate(int $id): JsonResponse
    {
        \DB::connection('tenant')->table('t_customers_meeting_formfield_i18n')
            ->whereIn('formfield_id', function ($q) use ($id) {
                $q->select('id')->from('t_customers_meeting_formfield')->where('form_id', $id);
            })->delete();
        \DB::connection('tenant')->table('t_customers_meeting_formfield')->where('form_id', $id)->delete();
        \DB::connection('tenant')->table('t_customers_meeting_form_i18n')->where('form_id', $id)->delete();
        \DB::connection('tenant')->table('t_customers_meeting_form')->where('id', $id)->delete();

        return response()->json(['success' => true]);
    }

    public function listFormFields(Request $request, int $id): JsonResponse
    {
        $lang = $request->query('lang', 'fr');

        $fields = \DB::connection('tenant')
            ->table('t_customers_meeting_formfield as f')
            ->leftJoin('t_customers_meeting_formfield_i18n as i', function ($j) use ($lang) {
                $j->on('i.formfield_id', '=', 'f.id')->whereIn('i.lang', [$lang, '']);
            })
            ->where('f.form_id', $id)
            ->orderBy('f.position')
            ->select('f.id', 'f.name', 'f.type', 'f.widget', 'f.default', 'f.position',
                'f.is_visible', 'f.is_exportable', 'i.request as label', 'i.parameters')
            ->get()
            ->map(function ($f) {
                $choices = [];
                if ($f->parameters) {
                    $params = @unserialize($f->parameters);
                    if (is_array($params) && isset($params['choices'])) {
                        $choices = array_values($params['choices']);
                    }
                }

                return [
                    'id' => $f->id,
                    'name' => $f->name,
                    'label' => $f->label ?: $f->name,
                    'type' => $f->type,
                    'widget' => $f->widget,
                    'default' => $f->default,
                    'position' => $f->position,
                    'is_visible' => $f->is_visible ?? 'YES',
                    'is_exportable' => $f->is_exportable ?? 'NO',
                    'choices' => $choices,
                ];
            });

        return response()->json(['success' => true, 'data' => $fields]);
    }

    public function saveFormFields(Request $request, int $id): JsonResponse
    {
        $fields = $request->input('fields', []);
        $lang = $request->input('lang', 'fr');

        foreach ($fields as $index => $fieldData) {
            $fieldId = $fieldData['id'] ?? null;
            $fieldValues = [
                'form_id' => $id,
                'name' => $fieldData['name'] ?? 'field_' . $index,
                'type' => $fieldData['type'] ?? 'string',
                'widget' => $fieldData['widget'] ?? null,
                'default' => $fieldData['default'] ?? null,
                'position' => $index,
                'is_visible' => $fieldData['is_visible'] ?? 'YES',
                'is_exportable' => $fieldData['is_exportable'] ?? 'NO',
            ];

            if ($fieldId) {
                \DB::connection('tenant')->table('t_customers_meeting_formfield')
                    ->where('id', $fieldId)->update($fieldValues);
            } else {
                $fieldId = \DB::connection('tenant')->table('t_customers_meeting_formfield')
                    ->insertGetId($fieldValues);
            }

            // Upsert i18n
            $params = null;
            if (!empty($fieldData['choices'])) {
                $params = serialize(['choices' => $fieldData['choices']]);
            }

            $existingI18n = \DB::connection('tenant')->table('t_customers_meeting_formfield_i18n')
                ->where('formfield_id', $fieldId)->whereIn('lang', [$lang, ''])->first();

            if ($existingI18n) {
                \DB::connection('tenant')->table('t_customers_meeting_formfield_i18n')
                    ->where('id', $existingI18n->id)
                    ->update([
                        'request' => $fieldData['label'] ?? $fieldData['name'],
                        'parameters' => $params,
                        'updated_at' => now(),
                    ]);
            } else {
                \DB::connection('tenant')->table('t_customers_meeting_formfield_i18n')->insert([
                    'formfield_id' => $fieldId,
                    'lang' => $lang,
                    'request' => $fieldData['label'] ?? $fieldData['name'],
                    'parameters' => $params,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }
        }

        return response()->json(['success' => true]);
    }
}
