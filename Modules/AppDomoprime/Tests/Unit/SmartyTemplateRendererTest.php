<?php

namespace Modules\AppDomoprime\Tests\Unit;

use Modules\AppDomoprime\Services\Pdf\SmartyTemplateRenderer;
use RuntimeException;
use Tests\TestCase;

class SmartyTemplateRendererTest extends TestCase
{
    public function test_renders_a_simple_variable(): void
    {
        $renderer = new SmartyTemplateRenderer();

        $output = $renderer->render('Hello {$name}', ['name' => 'World']);

        $this->assertSame('Hello World', $output);
    }

    public function test_renders_nested_array_paths_with_upper_modifier(): void
    {
        $renderer = new SmartyTemplateRenderer();

        $output = $renderer->render(
            '{$customer.address.address1|upper} - {$customer.firstname|upper}',
            ['customer' => [
                'firstname' => 'jean',
                'address' => ['address1' => '5 rue foo'],
            ]]
        );

        $this->assertSame('5 RUE FOO - JEAN', $output);
    }

    public function test_renders_foreach_and_if_blocks(): void
    {
        $renderer = new SmartyTemplateRenderer();

        $body = '{foreach $items as $i}{if $i.qty>0}{$i.name}={$i.qty} {/if}{/foreach}';
        $output = $renderer->render($body, ['items' => [
            ['name' => 'A', 'qty' => 2],
            ['name' => 'B', 'qty' => 0],
            ['name' => 'C', 'qty' => 5],
        ]]);

        $this->assertSame('A=2 C=5 ', $output);
    }

    public function test_supports_eval_block(): void
    {
        $renderer = new SmartyTemplateRenderer();

        $output = $renderer->render(
            'Desc: {eval var=$tpl}',
            ['tpl' => 'Bonjour {$who}', 'who' => 'monde']
        );

        $this->assertSame('Desc: Bonjour monde', $output);
    }

    public function test_throws_when_body_is_empty(): void
    {
        $this->expectException(RuntimeException::class);

        (new SmartyTemplateRenderer())->render('', []);
    }

    public function test_disables_php_tags_via_security_policy(): void
    {
        $renderer = new SmartyTemplateRenderer();

        $this->expectException(RuntimeException::class);

        $renderer->render('{php}echo "boom";{/php}', []);
    }

    public function test_substitutes_smarty_server_http_host_with_configured_value(): void
    {
        config()->set('app.symfony_pdf_host', 'icall.local');
        $renderer = new SmartyTemplateRenderer();

        $body = '<img src="http://{$smarty.server.HTTP_HOST}/admin/web/pictures/cee.png" />';
        $output = $renderer->render($body, []);

        $this->assertSame('<img src="http://icall.local/admin/web/pictures/cee.png" />', $output);
    }

    public function test_normalises_legacy_eval_syntax_without_dollar_sign(): void
    {
        $renderer = new SmartyTemplateRenderer();

        $output = $renderer->render('{eval polluter.comments}', [
            'polluter' => ['comments' => 'Hello {$who}', 'who' => 'world'],
            'who' => 'world',
        ]);

        $this->assertSame('Hello world', $output);
    }

    public function test_normalises_legacy_eval_syntax_with_dollar_sign(): void
    {
        $renderer = new SmartyTemplateRenderer();

        $output = $renderer->render('{eval $polluter.comments}', [
            'polluter' => ['comments' => 'Bonjour {$nom|upper}'],
            'nom' => 'jean',
        ]);

        $this->assertSame('Bonjour JEAN', $output);
    }

    public function test_custom_modifier_can_be_registered(): void
    {
        $renderer = new SmartyTemplateRenderer();
        $renderer->registerModifier('currency_eur', function ($value) {
            return number_format((float) $value, 2, ',', ' ').' EUR';
        });

        $output = $renderer->render('Total: {$amount|currency_eur}', ['amount' => 1234.5]);

        $this->assertSame('Total: 1 234,50 EUR', $output);
    }
}
