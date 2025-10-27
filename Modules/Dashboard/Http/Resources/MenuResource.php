<?php

namespace Modules\Dashboard\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class MenuResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        // Get the requested language from request
        $lang = $request->get('lang', 'en');

        // Get the translation value for the requested language
        $translation = $this->translations->first();
        $translationValue = $translation ? $translation->value : ($this->menu ?: $this->name);

        return [
            'id' => $this->id,
            'name' => $this->name,
            'menu' => $this->menu,
            'module' => $this->module,
            'lb' => $this->lb,
            'rb' => $this->rb,
            'level' => $this->level,
            'status' => $this->status,
            'type' => $this->type,
            'translation' => $translationValue,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}