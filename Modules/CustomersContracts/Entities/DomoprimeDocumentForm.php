<?php

namespace Modules\CustomersContracts\Entities;

use Illuminate\Database\Eloquent\Model;

class DomoprimeDocumentForm extends Model
{
    protected $connection = 'tenant';

    protected $table = 't_domoprime_yousign_meeting_document_form';

    public $timestamps = false;
}
