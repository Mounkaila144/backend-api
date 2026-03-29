<?php

namespace Modules\CustomersMeetings\Http\Controllers\Admin;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Modules\CustomersMeetings\Http\Requests\UpdateMeetingSettingsRequest;
use Modules\CustomersMeetings\Services\MeetingSettingsService;

class MeetingSettingsController extends Controller
{
    public function __construct(protected MeetingSettingsService $settings)
    {
    }

    /**
     * GET /api/admin/customersmeetings/settings
     */
    public function show(): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data' => $this->settings->all(),
        ]);
    }

    /**
     * PUT /api/admin/customersmeetings/settings
     */
    public function update(UpdateMeetingSettingsRequest $request): JsonResponse
    {
        $this->settings->save($request->validated());
        $this->settings->refresh();

        return response()->json([
            'success' => true,
            'message' => 'Settings saved successfully.',
            'data' => $this->settings->all(),
        ]);
    }

    /**
     * GET /api/admin/customersmeetings/settings/options
     * Returns select options for dropdowns (statuses, campaigns, companies, etc.).
     */
    public function options(Request $request): JsonResponse
    {
        $lang = $request->query('lang', 'fr');

        $withTranslations = fn ($q) => $q->where('lang', $lang);

        $formatWithI18n = fn ($collection) => $collection->map(fn ($item) => [
            'id' => $item->id,
            'name' => $item->translations->first()?->value ?? ('# ' . $item->id),
        ]);

        // Meeting statuses
        $meetingStatuses = $formatWithI18n(
            \Modules\CustomersMeetings\Entities\CustomerMeetingStatus::with(['translations' => $withTranslations])->get()
        );

        // Status calls
        $statusCalls = $formatWithI18n(
            \Modules\CustomersMeetings\Entities\CustomerMeetingStatusCall::with(['translations' => $withTranslations])->get()
        );

        // Status leads
        $statusLeads = $formatWithI18n(
            \Modules\CustomersMeetings\Entities\CustomerMeetingStatusLead::with(['translations' => $withTranslations])->get()
        );

        // Companies
        $companies = \Modules\CustomersContracts\Entities\CustomerContractCompany::select('id', 'name')
            ->where('is_active', 'YES')
            ->orderBy('name')
            ->get()
            ->map(fn ($c) => ['id' => $c->id, 'name' => $c->name]);

        // Campaigns
        $campaigns = \Modules\CustomersMeetings\Entities\CustomerMeetingCampaign::select('id', 'name')
            ->orderBy('name')
            ->get()
            ->map(fn ($c) => ['id' => $c->id, 'name' => $c->name]);

        return response()->json([
            'success' => true,
            'data' => [
                'meeting_statuses' => $meetingStatuses,
                'status_calls' => $statusCalls,
                'status_leads' => $statusLeads,
                'companies' => $companies,
                'campaigns' => $campaigns,
            ],
        ]);
    }
}
