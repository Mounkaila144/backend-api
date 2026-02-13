<?php

namespace Modules\CustomersContracts\Services;

use Illuminate\Support\Facades\DB;

/**
 * Reads contract transition settings from t_service_config.
 *
 * The config JSON is expected to contain keys like:
 *   cancel_status_id, uncancel_status_id, blowing_status_id,
 *   unblowing_status_id, placement_status_id, unplacement_status_id,
 *   confirm_status_id, unconfirm_status_id
 */
class ContractSettingsService
{
    protected ?array $config = null;

    protected function loadConfig(): array
    {
        if ($this->config !== null) {
            return $this->config;
        }

        try {
            // t_service_config lives on the main (mysql) connection, not the tenant DB
            $row = DB::connection('mysql')
                ->table('t_service_config')
                ->where('service_name', 'customers_contracts')
                ->first();

            if ($row && ! empty($row->config)) {
                $this->config = json_decode($row->config, true) ?: [];
            } else {
                $this->config = [];
            }
        } catch (\Throwable $e) {
            // Table may not exist yet or config row missing — graceful fallback
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

    public function getStatusForBlowing(): ?int
    {
        return $this->getIntSetting('blowing_status_id');
    }

    public function getStatusForUnblowing(): ?int
    {
        return $this->getIntSetting('unblowing_status_id');
    }

    public function getStatusForPlacement(): ?int
    {
        return $this->getIntSetting('placement_status_id');
    }

    public function getStatusForUnplacement(): ?int
    {
        return $this->getIntSetting('unplacement_status_id');
    }

    public function getStatusForConfirm(): ?int
    {
        return $this->getIntSetting('confirm_status_id');
    }

    public function getStatusForUnconfirm(): ?int
    {
        return $this->getIntSetting('unconfirm_status_id');
    }

    protected function getIntSetting(string $key): ?int
    {
        $config = $this->loadConfig();

        return isset($config[$key]) ? (int) $config[$key] : null;
    }
}
