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
            // Basic user information
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

            // Status fields
            'is_active' => $this->is_active,
            'is_guess' => $this->is_guess,
            'is_locked' => $this->is_locked,
            'locked_at' => $this->locked_at?->toIso8601String(),
            'is_secure_by_code' => $this->is_secure_by_code,
            'status' => $this->status,
            'number_of_try' => $this->number_of_try,

            // Date fields
            'last_password_gen' => $this->last_password_gen?->toIso8601String(),
            'lastlogin' => $this->lastlogin?->toIso8601String(),
            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),

            // Aggregated lists (from SQL queries for performance)
            'groups_list' => $this->groups_list ?? null,
            'teams_list' => $this->teams_list ?? null,
            'functions_list' => $this->functions_list ?? null,
            'profiles' => $this->profiles ?? null,

            // Groups with permissions
            'groups' => $this->whenLoaded('groups', function () {
                return $this->groups->map(function ($group) {
                    return [
                        'id' => $group->id,
                        'name' => $group->name,
                        // Add permissions if available
                        'permissions' => $group->relationLoaded('permissions')
                            ? $group->permissions->pluck('name')->toArray()
                            : null,
                    ];
                });
            }),

            // Teams
            'teams' => $this->whenLoaded('teams', function () {
                return $this->teams->map(function ($team) {
                    return [
                        'id' => $team->id,
                        'name' => $team->name,
                    ];
                });
            }),

            // Functions/Roles
            'functions' => $this->whenLoaded('functions', function () {
                return $this->functions->map(function ($function) {
                    return [
                        'id' => $function->id,
                        'name' => $function->name,
                    ];
                });
            }),

            // Attributions
            'attributions' => $this->whenLoaded('attributions', function () {
                return $this->attributions->map(function ($attribution) {
                    return [
                        'id' => $attribution->id,
                        'name' => $attribution->name,
                    ];
                });
            }),

            // Direct team (via team_id)
            'team' => $this->when($this->relationLoaded('team') && $this->team, function () {
                return [
                    'id' => $this->team->id,
                    'name' => $this->team->name,
                    'manager_id' => $this->team->manager_id,
                ];
            }),

            // Managers (users who manage this user)
            'managers' => $this->whenLoaded('managers', function () {
                return $this->managers->map(function ($manager) {
                    return [
                        'id' => $manager->id,
                        'username' => $manager->username,
                        'full_name' => $manager->full_name,
                    ];
                });
            }),

            // Teams managed by this user
            'managed_teams' => $this->whenLoaded('managedTeams', function () {
                return $this->managedTeams->map(function ($team) {
                    return [
                        'id' => $team->id,
                        'name' => $team->name,
                    ];
                });
            }),

            // Creator
            'creator' => $this->when($this->relationLoaded('creator') && $this->creator, function () {
                return [
                    'id' => $this->creator->id,
                    'username' => $this->creator->username,
                    'full_name' => $this->creator->full_name,
                ];
            }),

            // Unlocker
            'unlocker' => $this->when($this->relationLoaded('unlocker') && $this->unlocker, function () {
                return [
                    'id' => $this->unlocker->id,
                    'username' => $this->unlocker->username,
                    'full_name' => $this->unlocker->full_name,
                ];
            }),

            // Callcenter
            'callcenter' => $this->when($this->relationLoaded('callcenter') && $this->callcenter, function () {
                return [
                    'id' => $this->callcenter->id,
                    'name' => $this->callcenter->name,
                ];
            }),

            // IDs (for compatibility and foreign keys)
            'company_id' => $this->company_id,
            'callcenter_id' => $this->callcenter_id,
            'team_id' => $this->team_id,
            'creator_id' => $this->creator_id,
            'unlocked_by' => $this->unlocked_by,

            // Permissions and roles (for frontend authorization)
            // PERFORMANCE: Only load full permissions in detail view (when 'permissions' relation is pre-loaded)
            // In list view, return null to avoid N+1 queries - le frontend n'a pas besoin des permissions en liste
            'permissions' => $this->when(
                $this->relationLoaded('permissions'),
                function () {
                    // Detail view only: load full permissions
                    if (method_exists($this->resource, 'getAllPermissions')) {
                        $allPermissions = $this->getAllPermissions();

                        return $allPermissions->map(function ($permission) {
                            return [
                                'id' => $permission->id,
                                'name' => $permission->name,
                                'group_id' => $permission->group_id ?? null,
                            ];
                        })->values()->toArray();
                    }
                    return [];
                }
            ),
            'roles' => $this->whenLoaded('groups', function () {
                return $this->groups->pluck('name')->toArray();
            }),
            // PERFORMANCE: Check superadmin only from loaded groups to avoid extra query
            'is_superadmin' => $this->when(
                $this->relationLoaded('groups'),
                fn() => $this->groups->contains('name', 'superadmin')
            ),
        ];
    }
}
