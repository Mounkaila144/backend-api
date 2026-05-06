<?php

namespace Modules\AppDomoprimeISO3\Tests\Unit;

use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Modules\AppDomoprime\Entities\DomoprimeQuotation;
use Modules\AppDomoprimeISO3\Services\Documents\QuotationPdfModelResolver;
use Modules\CustomersContracts\Entities\CustomerContract;
use Modules\PartnerPolluter\Entities\PartnerPolluterCompany;
use RuntimeException;
use Tests\TestCase;

class QuotationPdfModelResolverTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        Config::set('database.connections.tenant', [
            'driver' => 'sqlite',
            'database' => ':memory:',
            'prefix' => '',
            'foreign_key_constraints' => false,
        ]);

        $this->createSchema();
    }

    private function createSchema(): void
    {
        $schema = Schema::connection('tenant');

        $schema->create('t_domoprime_quotation_model', function ($t) {
            $t->increments('id');
            $t->string('name');
        });
        $schema->create('t_domoprime_quotation_model_i18n', function ($t) {
            $t->increments('id');
            $t->unsignedInteger('model_id');
            $t->string('lang', 2);
            $t->string('value');
            $t->text('body');
        });
        $schema->create('t_partner_polluter_quotation', function ($t) {
            $t->increments('id');
            $t->unsignedInteger('polluter_id');
            $t->unsignedInteger('model_id')->nullable();
            $t->unsignedInteger('pre_model_id')->nullable();
        });
    }

    public function test_resolves_polluter_specific_model_when_configured(): void
    {
        $tenant = DB::connection('tenant');
        $tenant->table('t_domoprime_quotation_model')->insert([
            ['id' => 142, 'name' => 'devis ges'],
            ['id' => 137, 'name' => 'MODEL DEVIS 5.2 PAC'],
        ]);
        $tenant->table('t_domoprime_quotation_model_i18n')->insert([
            'id' => 1, 'model_id' => 137, 'lang' => 'fr', 'value' => 'PAC', 'body' => 'PAC body for {$customer.firstname}',
        ]);
        $tenant->table('t_partner_polluter_quotation')->insert([
            'id' => 1, 'polluter_id' => 9, 'model_id' => 137,
        ]);

        $quotation = $this->makeQuotationWithPolluter(9);

        $result = (new QuotationPdfModelResolver())->resolve($quotation);

        $this->assertSame(137, $result['model_id']);
        $this->assertSame('fr', $result['lang']);
        $this->assertStringContainsString('PAC body', $result['body']);
    }

    public function test_falls_back_to_first_model_when_polluter_has_no_mapping(): void
    {
        $tenant = DB::connection('tenant');
        $tenant->table('t_domoprime_quotation_model')->insert([
            ['id' => 142, 'name' => 'devis ges'],
        ]);
        $tenant->table('t_domoprime_quotation_model_i18n')->insert([
            'id' => 1, 'model_id' => 142, 'lang' => 'fr', 'value' => 'Devis GES', 'body' => 'GES default body',
        ]);

        $quotation = $this->makeQuotationWithPolluter(99);

        $result = (new QuotationPdfModelResolver())->resolve($quotation);

        $this->assertSame(142, $result['model_id']);
        $this->assertStringContainsString('GES default', $result['body']);
    }

    public function test_falls_back_to_first_lang_when_requested_lang_missing(): void
    {
        $tenant = DB::connection('tenant');
        $tenant->table('t_domoprime_quotation_model')->insert([
            ['id' => 142, 'name' => 'devis ges'],
        ]);
        $tenant->table('t_domoprime_quotation_model_i18n')->insert([
            'id' => 1, 'model_id' => 142, 'lang' => 'fr', 'value' => 'fr', 'body' => 'body fr',
        ]);

        $quotation = $this->makeQuotationWithPolluter(0);

        $result = (new QuotationPdfModelResolver())->resolve($quotation, 'es');

        $this->assertSame('fr', $result['lang']);
        $this->assertSame('body fr', $result['body']);
    }

    public function test_throws_when_no_model_at_all(): void
    {
        $quotation = $this->makeQuotationWithPolluter(0);

        $this->expectException(RuntimeException::class);
        $this->expectExceptionMessage('No quotation model configured');
        (new QuotationPdfModelResolver())->resolve($quotation);
    }

    public function test_throws_when_model_has_empty_body(): void
    {
        $tenant = DB::connection('tenant');
        $tenant->table('t_domoprime_quotation_model')->insert([
            ['id' => 142, 'name' => 'devis'],
        ]);
        $tenant->table('t_domoprime_quotation_model_i18n')->insert([
            'id' => 1, 'model_id' => 142, 'lang' => 'fr', 'value' => '', 'body' => '   ',
        ]);

        $quotation = $this->makeQuotationWithPolluter(0);

        $this->expectException(RuntimeException::class);
        $this->expectExceptionMessage('has no body');
        (new QuotationPdfModelResolver())->resolve($quotation);
    }

    private function makeQuotationWithPolluter(int $polluterId): DomoprimeQuotation
    {
        $q = new DomoprimeQuotation();
        $q->id = 1789;

        if ($polluterId > 0) {
            $polluter = new PartnerPolluterCompany();
            $polluter->id = $polluterId;
            $polluter->name = 'Polluter '.$polluterId;
            $contract = new CustomerContract();
            $contract->id = 246;
            $contract->polluter_id = $polluterId;
            $contract->setRelation('polluter', $polluter);
            $q->setRelation('contract', $contract);
        } else {
            $q->setRelation('contract', null);
        }

        return $q;
    }
}
