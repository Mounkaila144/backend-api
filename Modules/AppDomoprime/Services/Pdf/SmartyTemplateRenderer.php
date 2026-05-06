<?php

namespace Modules\AppDomoprime\Services\Pdf;

use RuntimeException;
use Smarty;
use Smarty_Security;
use Throwable;

class SmartyTemplateRenderer
{
    private Smarty $engine;

    public function __construct()
    {
        $this->engine = new Smarty();

        $cacheRoot = storage_path('app/smarty');
        $this->ensureCacheDirs($cacheRoot);

        $this->engine->setCompileDir($cacheRoot.'/compile');
        $this->engine->setCacheDir($cacheRoot.'/cache');
        $this->engine->setTemplateDir($cacheRoot.'/templates');

        $this->engine->caching = Smarty::CACHING_OFF;
        $this->engine->compile_check = true;
        $this->engine->error_reporting = E_ALL & ~E_NOTICE & ~E_WARNING;
        $this->engine->left_delimiter = '{';
        $this->engine->right_delimiter = '}';

        $this->applySecurityPolicy();
    }

    public function render(string $body, array $variables): string
    {
        if (trim($body) === '') {
            throw new RuntimeException('Cannot render empty Smarty body');
        }

        $body = $this->preProcessSuperGlobals($body);

        try {
            $template = $this->engine->createTemplate('eval:'.$body, null, null, $this->engine);
            $template->assign($variables);

            return $this->engine->fetch($template);
        } catch (Throwable $e) {
            throw new RuntimeException(
                sprintf(
                    'Smarty rendering failed: %s (in %s:%d)',
                    $e->getMessage(),
                    basename($e->getFile()),
                    $e->getLine()
                ),
                0,
                $e
            );
        }
    }

    /**
     * Normalises legacy Smarty 2 patterns that the BDD bodies still use
     * (Symfony shipped Smarty 2/3, the bodies were edited under that engine):
     *
     *   - {$smarty.server.HTTP_HOST}        → concrete host string
     *   - {eval $expr}     (Smarty 2)       → {eval var=$expr}     (Smarty 3+)
     *   - {eval expr.path} (missing $ sigil)→ {eval var=$expr.path}
     *
     * Symfony's secure mode also blocked these but its older Smarty was
     * more permissive on parsing. We don't relax the security policy —
     * we rewrite the patterns before compilation.
     */
    private function preProcessSuperGlobals(string $body): string
    {
        $host = (string) (config('app.symfony_pdf_host') ?: env('SYMFONY_PDF_HOST', ''));
        if ($host === '') {
            $host = $this->detectHttpHost();
        }

        $body = strtr($body, [
            '{$smarty.server.HTTP_HOST}' => $host,
            '{$smarty.server.SERVER_NAME}' => $host,
            '{$smarty.const.SITE_URL}' => $host !== '' ? 'http://'.$host : '',
        ]);

        // {eval $foo.bar}  → {eval var=$foo.bar}
        // {eval foo.bar}   → {eval var=$foo.bar}
        $body = preg_replace_callback(
            '/\{eval\s+(?!var=)([^\s}]+)\s*\}/u',
            function (array $match): string {
                $expr = $match[1];
                if ($expr[0] !== '$') {
                    $expr = '$'.$expr;
                }

                return '{eval var='.$expr.'}';
            },
            $body
        );

        return $body;
    }

    private function detectHttpHost(): string
    {
        if (! empty($_SERVER['HTTP_HOST'])) {
            return (string) $_SERVER['HTTP_HOST'];
        }
        try {
            $request = app('request');
            $host = method_exists($request, 'getHttpHost') ? (string) $request->getHttpHost() : '';
            if ($host !== '') {
                return $host;
            }
        } catch (Throwable) {
            // fall through
        }
        $appUrl = (string) config('app.url', '');

        return $appUrl !== '' ? (string) parse_url($appUrl, PHP_URL_HOST) : '';
    }

    public function registerModifier(string $name, callable $callback): void
    {
        $this->engine->registerPlugin('modifier', $name, $callback);
    }

    public function getEngine(): Smarty
    {
        return $this->engine;
    }

    private function applySecurityPolicy(): void
    {
        $policy = new Smarty_Security($this->engine);
        $policy->php_modifiers = [];
        $policy->php_functions = [
            // collection helpers used by foreach/{if} expressions
            'count', 'isset', 'empty', 'sizeof', 'in_array', 'is_array',
            // i18n + formatting helpers used inside the BDD Smarty bodies
            // (Symfony exposes __() globally; Laravel ships the same helper —
            // when no translation matches, it returns the source string,
            // which is the behaviour we want for verbatim PDF rendering).
            '__', 'trans', 'number_format', 'date', 'strtoupper', 'strtolower',
            'sprintf', 'nl2br', 'htmlspecialchars', 'strip_tags',
        ];
        $policy->disabled_tags = ['php', 'include_php', 'fetch'];
        $policy->allow_super_globals = false;
        $policy->allow_constants = false;

        $this->engine->enableSecurity($policy);
    }

    private function ensureCacheDirs(string $root): void
    {
        foreach (['compile', 'cache', 'templates'] as $sub) {
            $dir = $root.'/'.$sub;
            if (! is_dir($dir)) {
                @mkdir($dir, 0775, true);
            }
        }
    }
}
