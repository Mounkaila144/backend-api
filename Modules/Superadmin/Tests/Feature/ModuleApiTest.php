<?php

namespace Modules\Superadmin\Tests\Feature;

use Tests\TestCase;
use Laravel\Sanctum\Sanctum;
use App\Models\User;
use Mockery;

class ModuleApiTest extends TestCase
{
    protected string $endpoint = '/api/superadmin/modules';

    /**
     * AC #3: Endpoint retourne 401 sans authentification
     */
    public function test_unauthenticated_user_cannot_list_modules(): void
    {
        $response = $this->getJson($this->endpoint);

        $response->assertStatus(401);
    }

    /**
     * AC #1: Endpoint retourne 200 avec authentification
     */
    public function test_authenticated_user_can_list_modules(): void
    {
        // Mock un utilisateur authentifié
        $user = Mockery::mock(User::class)->makePartial();
        $user->shouldReceive('getAuthIdentifier')->andReturn(1);

        Sanctum::actingAs($user);

        $response = $this->getJson($this->endpoint);

        $response->assertStatus(200);
        $response->assertJsonStructure([
            'data' => [
                '*' => [
                    'name',
                    'alias',
                    'description',
                    'version',
                    'dependencies',
                    'priority',
                    'isSystem',
                    'isEnabled',
                ]
            ]
        ]);
    }

    /**
     * AC #2: Format de réponse en camelCase
     */
    public function test_response_format_is_camel_case(): void
    {
        $user = Mockery::mock(User::class)->makePartial();
        $user->shouldReceive('getAuthIdentifier')->andReturn(1);

        Sanctum::actingAs($user);

        $response = $this->getJson($this->endpoint);

        $response->assertStatus(200);

        $data = $response->json('data');

        if (!empty($data)) {
            $firstModule = $data[0];

            $this->assertArrayHasKey('isSystem', $firstModule);
            $this->assertArrayHasKey('isEnabled', $firstModule);
            $this->assertArrayNotHasKey('is_system', $firstModule);
            $this->assertArrayNotHasKey('enabled', $firstModule);
        }
    }

    /**
     * Test que les modules système sont identifiés
     */
    public function test_system_modules_are_flagged(): void
    {
        $user = Mockery::mock(User::class)->makePartial();
        $user->shouldReceive('getAuthIdentifier')->andReturn(1);

        Sanctum::actingAs($user);

        $response = $this->getJson($this->endpoint);

        $response->assertStatus(200);

        $data = $response->json('data');
        $systemModules = array_filter($data, fn($module) => $module['isSystem'] === true);

        $systemModuleNames = array_column($systemModules, 'name');

        $this->assertContains('Superadmin', $systemModuleNames);
    }
}
