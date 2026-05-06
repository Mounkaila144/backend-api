<?php

namespace Modules\AppDomoprimeISO3\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class CreateQuotationRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'dated_at' => 'nullable|date',
            'discount_amount' => 'nullable|numeric|min:0',
            'subvention_type_id' => 'nullable|integer',
            'items' => 'required|array|min:1',
            'items.*.product_id' => 'required|integer',
            'items.*.quantity' => 'required|numeric|min:0',
            'items.*.sale_price_without_tax' => 'nullable|numeric|min:0',
        ];
    }
}
