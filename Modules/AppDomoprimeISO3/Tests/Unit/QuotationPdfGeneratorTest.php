<?php

namespace Modules\AppDomoprimeISO3\Tests\Unit;

use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\Config;
use Mockery;
use Modules\AppDomoprime\Entities\DomoprimeQuotation;
use Modules\AppDomoprime\Services\Pdf\SmartyTemplateRenderer;
use Modules\AppDomoprimeISO3\Services\Documents\QuotationDataBuilder;
use Modules\AppDomoprimeISO3\Services\Documents\QuotationPdfGenerator;
use Modules\AppDomoprimeISO3\Services\Documents\QuotationPdfModelResolver;
use RuntimeException;
use Tests\TestCase;

class QuotationPdfGeneratorTest extends TestCase
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
    }

    protected function tearDown(): void
    {
        Mockery::close();
        parent::tearDown();
    }

    public function test_generate_throws_when_wkhtmltopdf_binary_is_not_configured(): void
    {
        Config::set('snappy.pdf.binary', '');

        $generator = new QuotationPdfGenerator(
            Mockery::mock(QuotationPdfModelResolver::class),
            Mockery::mock(QuotationDataBuilder::class),
            new SmartyTemplateRenderer(),
        );

        $this->expectException(RuntimeException::class);
        $this->expectExceptionMessage('wkhtmltopdf binary is not configured');
        $generator->generateToTempFile($this->makeQuotation());
    }

    public function test_generate_throws_when_wkhtmltopdf_binary_does_not_exist(): void
    {
        Config::set('snappy.pdf.binary', '/nonexistent/path/to/wkhtmltopdf');

        $generator = new QuotationPdfGenerator(
            Mockery::mock(QuotationPdfModelResolver::class),
            Mockery::mock(QuotationDataBuilder::class),
            new SmartyTemplateRenderer(),
        );

        $this->expectException(RuntimeException::class);
        $this->expectExceptionMessage('wkhtmltopdf binary not found');
        $generator->generateToTempFile($this->makeQuotation());
    }

    public function test_generate_throws_when_smarty_renders_empty_html(): void
    {
        $fakeBinary = $this->createFakeBinary();

        try {
            Config::set('snappy.pdf.binary', $fakeBinary);

            $resolver = Mockery::mock(QuotationPdfModelResolver::class);
            $resolver->shouldReceive('resolve')->once()->andReturn([
                'model_id' => 1, 'lang' => 'fr', 'subject' => '', 'body' => '   ',
            ]);
            $builder = Mockery::mock(QuotationDataBuilder::class);
            $builder->shouldReceive('build')->andReturn([]);

            $generator = new QuotationPdfGenerator($resolver, $builder, new SmartyTemplateRenderer());

            $this->expectException(RuntimeException::class);
            $this->expectExceptionMessageMatches('/empty Smarty body|empty HTML/');
            $generator->generateToTempFile($this->makeQuotation());
        } finally {
            @unlink($fakeBinary);
        }
    }

    public function test_generate_passes_resolver_lang_to_data_builder(): void
    {
        $fakeBinary = $this->createFakeBinary();

        try {
            Config::set('snappy.pdf.binary', $fakeBinary);

            $resolver = Mockery::mock(QuotationPdfModelResolver::class);
            $resolver->shouldReceive('resolve')->once()->with(Mockery::any(), 'fr')->andReturn([
                'model_id' => 142, 'lang' => 'en', 'subject' => '', 'body' => 'Hello',
            ]);

            $builder = Mockery::mock(QuotationDataBuilder::class);
            $builder->shouldReceive('build')->once()->with(Mockery::any(), 'en')->andReturn([]);

            // Stub the snappy wrapper so we don't actually shell out.
            $snappy = Mockery::mock();
            $snappy->shouldReceive('loadHTML')->once()->andReturnSelf();
            $snappy->shouldReceive('save')->once()->andReturnUsing(function ($path) {
                file_put_contents($path, '%PDF-1.4 fake');
            });
            $this->app->instance('snappy.pdf.wrapper', $snappy);

            $generator = new QuotationPdfGenerator($resolver, $builder, new SmartyTemplateRenderer());

            $tempPath = $generator->generateToTempFile($this->makeQuotation());

            $this->assertFileExists($tempPath);
            @unlink($tempPath);
        } finally {
            @unlink($fakeBinary);
        }
    }

    public function test_generate_throws_when_snappy_returns_empty_file(): void
    {
        $fakeBinary = $this->createFakeBinary();

        try {
            Config::set('snappy.pdf.binary', $fakeBinary);

            $resolver = Mockery::mock(QuotationPdfModelResolver::class);
            $resolver->shouldReceive('resolve')->andReturn([
                'model_id' => 1, 'lang' => 'fr', 'subject' => '', 'body' => 'Hi',
            ]);
            $builder = Mockery::mock(QuotationDataBuilder::class);
            $builder->shouldReceive('build')->andReturn([]);

            $snappy = Mockery::mock();
            $snappy->shouldReceive('loadHTML')->andReturnSelf();
            $snappy->shouldReceive('save')->andReturnUsing(function ($path) {
                file_put_contents($path, '');
            });
            $this->app->instance('snappy.pdf.wrapper', $snappy);

            $generator = new QuotationPdfGenerator($resolver, $builder, new SmartyTemplateRenderer());

            $this->expectException(RuntimeException::class);
            $this->expectExceptionMessage('PDF generation failed: empty or missing file');
            $generator->generateToTempFile($this->makeQuotation());
        } finally {
            @unlink($fakeBinary);
        }
    }

    private function makeQuotation(): DomoprimeQuotation
    {
        $q = new DomoprimeQuotation();
        $q->id = 1789;
        $q->reference = 'DEV-1789';
        $q->setRelation('products', new Collection([]));
        $q->setRelation('contract', null);
        $q->setRelation('subventionType', null);
        $q->setRelation('calculation', null);

        return $q;
    }

    private function createFakeBinary(): string
    {
        $path = tempnam(sys_get_temp_dir(), 'fake_wkhtml_').'.exe';
        file_put_contents($path, '#!/bin/sh');

        return $path;
    }
}
