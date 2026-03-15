<?php

namespace Modules\CustomersMeetings\Services;

use Illuminate\Support\Facades\DB;

/**
 * Reads meeting transition settings from t_service_config.
 *
 * The config JSON is expected to contain keys like:
 *   cancel_status_id, uncancel_status_id,
 *   confirm_status_id, unconfirm_status_id,
 *   status_transfer_to_contract_id, status_by_default_id
 */
class MeetingSettingsService
{
    protected ?array $config = null;

    protected function loadConfig(): array
    {
        if ($this->config !== null) {
            return $this->config;
        }

        try {
            $row = DB::connection('mysql')
                ->table('t_service_config')
                ->where('service_name', 'customers_meetings')
                ->first();

            if ($row && ! empty($row->config)) {
                $this->config = json_decode($row->config, true) ?: [];
            } else {
                $this->config = [];
            }
        } catch (\Throwable $e) {
            $this->config = [];
        }

        return $this->config;
    }

    public function getStatusForCancel(): ?int
    {
        return $this->getIntSetting('cancel_status_id');
    }

    public function getStatusForUncancel(): ?int
    {
        return $this->getIntSetting('uncancel_status_id');
    }

    public function getStatusForConfirm(): ?int
    {
        return $this->getIntSetting('confirm_status_id');
    }

    public function getStatusForUnconfirm(): ?int
    {
        return $this->getIntSetting('unconfirm_status_id');
    }

    public function getStatusTransferToContract(): ?int
    {
        return $this->getIntSetting('status_transfer_to_contract_id');
    }

    public function getStatusByDefault(): ?int
    {
        return $this->getIntSetting('status_by_default_id');
    }

    protected function getIntSetting(string $key): ?int
    {
        $config = $this->loadConfig();

        return isset($config[$key]) ? (int) $config[$key] : null;
    }
}
