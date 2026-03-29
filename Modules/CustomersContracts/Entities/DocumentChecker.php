<?php

namespace Modules\CustomersContracts\Entities;

use Illuminate\Database\Eloquent\Model;

/**
 * Document Checker categories
 * Table: t_customers_contracts_documents_checker
 */
class DocumentChecker extends Model
{
    protected $connection = 'tenant';
    protected $table = 't_customers_contracts_documents_checker';

    protected $casts = [
        'is_active' => 'boolean',
    ];

    public function scopeActive($query)
    {
        return $query->where('is_active', 1)->where('status', 'ACTIVE');
    }
}
