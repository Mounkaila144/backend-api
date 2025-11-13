<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Middleware pour vérifier les credentials (Symfony 1 style)
 *
 * Usage dans les routes:
 * - Single credential: ->middleware('credential:admin')
 * - Multiple OR: ->middleware('credential:admin,superadmin,users.edit')
 * - Multiple AND: ->middleware('credential:admin+users.edit+users.view')
 */
class CheckCredential
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next, string ...$credentials): Response
    {
        $user = $request->user();

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthenticated',
            ], 401);
        }

        // Si aucun credential n'est spécifié, on laisse passer
        if (empty($credentials)) {
            return $next($request);
        }

        // Joindre tous les credentials en un seul string
        $credentialString = implode(',', $credentials);

        // Détecter le type de logique:
        // - Contient '+' = AND logic (tous les credentials requis)
        // - Contient ',' = OR logic (au moins un credential requis)

        if (strpos($credentialString, '+') !== false) {
            // AND logic: l'utilisateur doit avoir TOUS les credentials
            $credentialList = explode('+', $credentialString);

            if ($user->hasCredential($credentialList, true)) {
                return $next($request);
            }
        } else {
            // OR logic (défaut): l'utilisateur doit avoir AU MOINS UN credential
            $credentialList = explode(',', $credentialString);

            // Style Symfony 1: [['cred1', 'cred2', 'cred3']] = OR logic
            if ($user->hasCredential([$credentialList])) {
                return $next($request);
            }
        }

        // Accès refusé
        return response()->json([
            'success' => false,
            'message' => 'Access denied. Required credentials: ' . $credentialString,
        ], 403);
    }
}
