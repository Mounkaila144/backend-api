<?php

namespace Modules\User\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * User Resource
 * Transforms User model for API responses
 */
class UserResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'username' => $this->username,
            'firstname' => $this->firstname,
            'lastname' => $this->lastname,
            'full_name' => $this->full_name,
            'email' => $this->email,
            'sex' => $this->sex,
            'phone' => $this->phone,
            'mobile' => $this->mobile,
            'birthday' => $this->birthday?->format('Y-m-d'),
            'picture' => $this->picture,
            'application' => $this->application,
            'is_active' => $this->is_active,
            'is_guess' => $this->is_guess,
            'is_locked' => $this->is_locked,
            'is_secure_by_code' => $this->is_secure_by_code,
            'status' => $this->status,
            'number_of_try' => $this->number_of_try,
            'last_password_gen' => $this->last_password_gen?->toIso8601String(),
            'lastlogin' => $this->lastlogin?->toIso8601String(),
            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),

            // Aggregated data
            'groups_list' => $this->groups_list ?? null,

            // Related data (when loaded)
            'groups' => $this->whenLoaded('groups', function () {
                return $this->groups->map(function ($group) {
                    return [
                        'id' => $group->id,
                        'name' => $group->name,
                    ];
                });
            }),

            'creator' => $this->when($this->relationLoaded('creator') && $this->creator, function () {
                return [
                    'id' => $this->creator->id,
                    'username' => $this->creator->username,
                    'full_name' => $this->creator->full_name,
                ];
            }),

            'unlocker' => $this->when($this->relationLoaded('unlocker') && $this->unlocker, function () {
                return [
                    'id' => $this->unlocker->id,
                    'username' => $this->unlocker->username,
                    'full_name' => $this->unlocker->full_name,
                ];
            }),

            // Company and callcenter IDs (for compatibility)
            'company_id' => $this->company_id,
            'callcenter_id' => $this->callcenter_id,
            'creator_id' => $this->creator_id,
            'unlocked_by' => $this->unlocked_by,
        ];
    }
}
