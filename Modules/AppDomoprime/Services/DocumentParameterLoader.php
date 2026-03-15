<?php

namespace Modules\AppDomoprime\Services;

use Carbon\Carbon;
use Modules\CustomersContracts\Entities\CustomerContract;

class DocumentParameterLoader
{
    /**
     * Load all parameters for a contract, matching the old Symfony system's
     * CustomerMeetingFormDocumentParameters::loadParametersForDocumentPdf().
     *
     * @return array Nested associative array with keys: company, customer, contract, meeting, polluter, today
     */
    public function loadForPdf(CustomerContract $contract): array
    {
        $contract->load([
            'customer.addresses',
            'team',
            'telepro',
            'sale1',
            'sale2',
            'assistant',
            'manager',
            'financialPartner',
            'partnerLayer',
            'polluter',
            'company',
            'contractStatus.translations',
            'tax',
        ]);

        $data = [];

        // Company data
        $data['company'] = $this->loadCompanyData($contract);

        // Customer data
        $data['customer'] = $this->loadCustomerData($contract);

        // Contract data
        $data['contract'] = $this->loadContractData($contract);

        // Meeting data (may not exist in Laravel yet)
        $data['meeting'] = $this->loadMeetingData($contract);

        // Polluter data
        if ($contract->polluter_id && $contract->polluter) {
            $data['polluter'] = $this->modelToArrayForDocument($contract->polluter);
        }

        // Today's date
        $data['today'] = $this->formatDate(Carbon::now()->format('Y-m-d'));

        return $data;
    }

    /**
     * Flatten nested data according to template variable names.
     *
     * Variable names are pipe-separated, e.g.:
     * "company[name]|customer[lastname]|contract[opened_at][ddmmyyyy]"
     *
     * Each variable name like "contract[opened_at][ddmmyyyy]" is resolved by
     * traversing $data['contract']['opened_at']['ddmmyyyy'].
     *
     * @param array $data The nested data array from loadForPdf()
     * @param string $variableNames Pipe-separated variable names from the template
     * @return array Flat key=>value pairs for XFDF form filling
     */
    public function flatten(array $data, string $variableNames): array
    {
        if (empty($variableNames)) {
            return [];
        }

        $names = explode('|', $variableNames);
        $result = [];

        foreach ($names as $name) {
            $name = trim($name);
            if (empty($name)) {
                continue;
            }

            $value = $this->resolveVariable($data, $name);
            $result[$name] = (string) $value;
        }

        return $result;
    }

    /**
     * Resolve a variable name like "contract[opened_at][ddmmyyyy]" from nested data.
     */
    protected function resolveVariable(array $data, string $variableName): string
    {
        // Parse "contract[opened_at][ddmmyyyy]" into ['contract', 'opened_at', 'ddmmyyyy']
        $keys = $this->parseVariableName($variableName);

        $current = $data;
        foreach ($keys as $key) {
            if (is_array($current) && array_key_exists($key, $current)) {
                $current = $current[$key];
            } else {
                return '';
            }
        }

        if (is_array($current)) {
            return '';
        }

        return (string) $current;
    }

    /**
     * Parse "contract[opened_at][ddmmyyyy]" into ['contract', 'opened_at', 'ddmmyyyy'].
     */
    protected function parseVariableName(string $name): array
    {
        // Replace ][  with a separator, strip leading/trailing brackets
        $name = str_replace('][', '.', $name);
        $name = str_replace('[', '.', $name);
        $name = str_replace(']', '', $name);

        return explode('.', $name);
    }

    /**
     * Load company data from the contract's company relation.
     * Reproduces SiteCompanyUtils::getSiteCompany()->toArrayForPdf()
     */
    protected function loadCompanyData(CustomerContract $contract): array
    {
        $company = $contract->company;
        if (!$company) {
            return [];
        }

        $values = $company->toArray();

        // Add computed fields matching old system
        $values['email'] = $values['email'] ?? '';
        $values['phone'] = $values['phone'] ?? '';
        $values['mobile'] = $values['mobile'] ?? '';
        $values['siret'] = $values['siret'] ?? '';
        $values['postcode'] = $values['postcode'] ?? '';
        $values['address1_postcode_city'] = trim(
            ($values['address1'] ?? '') . ' ' . ($values['postcode'] ?? '') . ' ' . ($values['city'] ?? '')
        );
        $values['phone_email'] = 'TEL : ' . ($values['phone'] ?? '') . ' EMAIL : ' . ($values['email'] ?? '');
        $values['postcode_city'] = trim(($values['postcode'] ?? '') . ' ' . ($values['city'] ?? ''));
        $values['name_address1_postcode_city'] = trim(
            ($values['name'] ?? '') . ' ' . ($values['address1_postcode_city'] ?? '')
        );

        return $values;
    }

    /**
     * Load customer data from the contract's customer relation.
     * Reproduces Customer::toArrayForPdf()
     */
    protected function loadCustomerData(CustomerContract $contract): array
    {
        $customer = $contract->customer;
        if (!$customer) {
            return [];
        }

        $values = [];
        foreach ($customer->toArray() as $key => $value) {
            if (is_array($value)) {
                continue; // Skip nested relations (addresses, contacts, etc.)
            }
            $values[$key] = is_string($value) ? mb_strtoupper($value) : (string) ($value ?? '');
        }

        $values['name'] = ucwords(trim(($customer->firstname ?? '') . ' ' . ($customer->lastname ?? '')));
        $values['email'] = $customer->email ?: '';
        $values['phone'] = $customer->phone ?? '';
        $values['mobile'] = $customer->mobile ?? '';
        $values['firstname'] = $customer->firstname ?? '';
        $values['lastname'] = $customer->lastname ?? '';
        $values['gender'] = $customer->gender ?? '';
        $values['madam'] = ($customer->gender ?? '') !== 'Mr' ? '1' : '0';
        $values['mister'] = ($customer->gender ?? '') === 'Mr' ? '1' : '0';

        // Address
        $address = $customer->addresses->first();
        if ($address) {
            $addrValues = [];
            foreach ($address->toArray() as $key => $value) {
                if (is_array($value)) {
                    continue;
                }
                $addrValues[$key] = is_string($value) ? mb_strtoupper($value) : (string) ($value ?? '');
            }
            $addrValues['full'] = mb_strtoupper($address->full_address);
            $addrValues['postcode'] = $address->postcode ?? '';
            $values['address'] = $addrValues;
        } else {
            $values['address'] = [];
        }

        return $values;
    }

    /**
     * Load contract data with all related entities.
     * Reproduces the contract section of loadParametersForDocumentPdf()
     */
    protected function loadContractData(CustomerContract $contract): array
    {
        // Use attributesToArray() to get only scalar columns, not loaded relations
        $values = $contract->attributesToArray();

        // Status
        $status = $contract->contractStatus;
        if ($status) {
            $translation = $status->translations->first();
            $values['state'] = $translation ? ($translation->value ?? $status->name) : ($status->name ?? '');
        } else {
            $values['state'] = '';
        }

        // Financial data
        $values['total_price_without_tax'] = $contract->total_price_without_taxe ?? '0.00';
        $values['total_price_with_tax'] = $contract->total_price_with_taxe ?? '0.00';

        $totalHt = (float) ($contract->total_price_without_taxe ?? 0);
        $totalTtc = (float) ($contract->total_price_with_taxe ?? 0);
        $values['tax_amount'] = number_format($totalTtc - $totalHt, 2, '.', '');

        $tax = $contract->tax;
        $values['tax'] = $tax ? ($tax->value ?? '0') : '0';

        // Team
        $values['team'] = $contract->team ? $contract->team->toArray() : [];

        // Users
        $values['telepro'] = $contract->telepro ? $contract->telepro->toArray() : [];
        $values['sale1'] = $contract->sale1 ? $contract->sale1->toArray() : [];
        $values['sale2'] = $contract->sale2 ? $contract->sale2->toArray() : [];
        $values['assistant'] = $contract->assistant ? $contract->assistant->toArray() : [];
        $values['manager'] = $contract->manager ? $contract->manager->toArray() : [];

        // Partner
        $values['partner'] = $contract->financialPartner ? $contract->financialPartner->toArray() : [];

        // Layer
        if ($contract->partner_layer_id && $contract->partnerLayer) {
            $values['layer'] = $this->modelToArrayForDocument($contract->partnerLayer);
            $values['layer']['exists'] = '1';
        } else {
            $values['layer'] = ['exists' => '0'];
        }

        // Dates in multiple formats
        $dateFields = [
            'created_at', 'updated_at', 'opened_at', 'opc_at', 'sav_at',
            'doc_at', 'pre_meeting_at', 'quoted_at', 'billing_at', 'apf_at',
        ];
        foreach ($dateFields as $field) {
            $rawValue = $contract->getOriginal($field) ?? $contract->{$field};
            $values[$field] = $this->formatDate($rawValue);
        }

        return $values;
    }

    /**
     * Load meeting data (stub - CustomerMeeting model does not exist in Laravel yet).
     */
    protected function loadMeetingData(CustomerContract $contract): array
    {
        // The CustomerMeeting model doesn't exist in the Laravel backend yet.
        // Return empty array; when the model is created, populate from contract->meeting_id.
        return [];
    }

    /**
     * Convert a model to array for document (reproduces toArrayForDocument).
     */
    protected function modelToArrayForDocument($model): array
    {
        if (!$model) {
            return [];
        }

        $values = $model->attributesToArray();

        // Ensure standard fields are present as strings
        foreach (['name', 'siret', 'tva', 'email', 'phone', 'mobile', 'address1', 'address2', 'postcode', 'city', 'country', 'logo'] as $field) {
            $values[$field] = $values[$field] ?? '';
        }

        return $values;
    }

    /**
     * Format a date in 4 formats matching the old system.
     * Returns: ['ddmmyyyy' => '13/03/2026', 'ddmmyy' => '13/03/26', 'ddmmmmyyyy' => '13 mars 2026', 'yyyymmdd' => '20260313']
     * For datetime fields with time, also includes 'time' => 'HH:MM'
     */
    protected function formatDate($dateValue): array
    {
        if (empty($dateValue)) {
            return [
                'ddmmyyyy' => '',
                'ddmmyy' => '',
                'ddmmmmyyyy' => '',
                'yyyymmdd' => '',
            ];
        }

        try {
            $carbon = $dateValue instanceof Carbon
                ? $dateValue
                : Carbon::parse($dateValue);
        } catch (\Exception $e) {
            return [
                'ddmmyyyy' => '',
                'ddmmyy' => '',
                'ddmmmmyyyy' => '',
                'yyyymmdd' => '',
            ];
        }

        $months = [
            1 => 'janvier', 2 => 'février', 3 => 'mars', 4 => 'avril',
            5 => 'mai', 6 => 'juin', 7 => 'juillet', 8 => 'août',
            9 => 'septembre', 10 => 'octobre', 11 => 'novembre', 12 => 'décembre',
        ];

        $result = [
            'ddmmyyyy' => $carbon->format('d/m/Y'),
            'ddmmyy' => $carbon->format('d/m/y'),
            'ddmmmmyyyy' => $carbon->format('d') . ' ' . $months[(int) $carbon->format('m')] . ' ' . $carbon->format('Y'),
            'yyyymmdd' => $carbon->format('Ymd'),
        ];

        // Add time for datetime fields
        if ($carbon->format('H:i') !== '00:00') {
            $result['time'] = $carbon->format('H:i');
        }

        return $result;
    }
}
