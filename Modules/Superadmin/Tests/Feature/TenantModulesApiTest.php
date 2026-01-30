<?php

namespace Modules\Superadmin\Tests\Feature;

use Tests\TestCase;
use Laravel\Sanctum\Sanctum;
use App\Models\User;
use Mockery;

class TenantModulesApiTest extends TestCase
{
    /**
     * AC #3: Endpoint retourne 404 pour tenant inexistant
     */
    public function test_returns_404_for_nonexistent_tenant(): void
    {
        $user = Mockery::mock(User::class)->makePartial();
        $user->shouldReceive('getAuthIdentifier')->andReturn(1);

        Sanctum::actingAs($user);

        $response = $this->getJson('/api/superadmin/sites/99999/modules');

        $response->assertStatus(404);
    }

    /**
     * AC #1: Endpoint retourne 200 avec auth pour tenant existant
     */
    public function test_authenticated_user_can_list_tenant_modules(): void
    {
        $user = Mockery::mock(User::class)->makePartial();
        $user->shouldReceive('getAuthIdentifier')->andReturn(1);

        Sanctum::actingAs($user);

        // Supposons que le tenant 1 existe
        $response = $this->getJson('/api/superadmin/sites/1/modules');

        $response->assertStatus(200);
        $response->assertJsonStructure([
            'data' => [
                '*' => [
                    'name',
                    'alias',
                    'description',
                    'version',
                    'dependencies',
                    'isSystem',
                    'status',
                    'installedAt',
                    'uninstalledAt',
                    'config',
                ]
            ]
        ]);
    }

    /**
     * AC #2: Format de réponse avec statuts
     */
    public function test_response_includes_module_status(): void
    {
        $user = Mockery::mock(User::class)->makePartial();
        $user->shouldReceive('getAuthIdentifier')->andReturn(1);

        Sanctum::actingAs($user);

        $response = $this->getJson('/api/superadmin/sites/1/modules');

        $response->assertStatus(200);

        $data = $response->json('data');

        if (!empty($data)) {
            $firstModule = $data[0];

            $this->assertArrayHasKey('status', $firstModule);
            $this->assertContains($firstModule['status'], ['active', 'inactive', 'not_installed']);
        }
    }

    /**
     * Test que l'endpoint nécessite authentication
     */
    public function test_unauthenticated_user_cannot_access_endpoint(): void
    {
        $response = $this->getJson('/api/superadmin/sites/1/modules');

        $response->assertStatus(401);
    }
}
