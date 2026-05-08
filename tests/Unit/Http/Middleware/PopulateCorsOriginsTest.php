<?php

namespace Tests\Unit\Http\Middleware;

use App\Http\Middleware\PopulateCorsOrigins;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Tests\TestCase;

class PopulateCorsOriginsTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        Cache::forget(PopulateCorsOrigins::CACHE_KEY);
    }

    public function test_handle_preserves_existing_static_origins(): void
    {
        config(['cors.allowed_origins' => ['http://localhost:3000']]);
        // Pre-seed the cache so the middleware doesn't try to hit a DB that doesn't exist
        // in unit tests. Empty array means "no extra tenant origins".
        Cache::put(PopulateCorsOrigins::CACHE_KEY, [], 60);

        $middleware = new PopulateCorsOrigins();
        $request    = Request::create('/api/health', 'GET');

        $middleware->handle($request, fn () => new JsonResponse(['ok' => true]));

        $this->assertSame(
            ['http://localhost:3000'],
            config('cors.allowed_origins'),
            'Static config must be preserved when there are no tenant origins to merge.'
        );
    }

    public function test_handle_merges_cached_tenant_origins_with_static(): void
    {
        config(['cors.allowed_origins' => ['http://localhost:3000']]);
        Cache::put(PopulateCorsOrigins::CACHE_KEY, [
            'https://tenant1.example.com',
            'http://tenant1.example.com',
        ], 60);

        $middleware = new PopulateCorsOrigins();
        $middleware->handle(Request::create('/api/x', 'GET'), fn () => new JsonResponse([]));

        $this->assertEqualsCanonicalizing(
            ['http://localhost:3000', 'https://tenant1.example.com', 'http://tenant1.example.com'],
            config('cors.allowed_origins')
        );
    }

    public function test_handle_dedupes_origins_when_static_overlaps_tenant(): void
    {
        config(['cors.allowed_origins' => ['http://tenant1.local']]);
        Cache::put(PopulateCorsOrigins::CACHE_KEY, [
            'https://tenant1.local',
            'http://tenant1.local',
        ], 60);

        $middleware = new PopulateCorsOrigins();
        $middleware->handle(Request::create('/api/x', 'GET'), fn () => new JsonResponse([]));

        $merged = config('cors.allowed_origins');
        $this->assertCount(2, $merged, 'Duplicate http://tenant1.local must be deduped.');
        $this->assertContains('http://tenant1.local', $merged);
        $this->assertContains('https://tenant1.local', $merged);
    }

    public function test_request_proceeds_to_next_handler(): void
    {
        Cache::put(PopulateCorsOrigins::CACHE_KEY, [], 60);
        $middleware = new PopulateCorsOrigins();
        $expected   = new JsonResponse(['next' => 'reached']);

        $actual = $middleware->handle(Request::create('/api/x', 'GET'), fn () => $expected);

        $this->assertSame($expected, $actual);
    }
}
