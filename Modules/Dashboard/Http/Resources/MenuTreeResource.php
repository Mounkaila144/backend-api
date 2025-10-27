<?php

namespace Modules\Dashboard\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class MenuTreeResource extends JsonResource
{
    /**
     * Transform the resource into an array for tree structure.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        // Get the translation value for the requested language
        $translation = $this->translations->first();
        $translationValue = $translation ? $translation->value : ($this->menu ?: $this->name);

        return [
            'id' => $this->id,
            'name' => $this->name,
            'translation' => $translationValue,
            'module' => $this->module,
            'level' => $this->level,
            'status' => $this->status,
            'type' => $this->type,
            'lb' => $this->lb,
            'rb' => $this->rb,
        ];
    }
}