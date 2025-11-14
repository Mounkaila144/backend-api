<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Middleware pour définir automatiquement la langue de l'application
 * en fonction du header HTTP Accept-Language
 */
class SetLocale
{
    /**
     * Langues supportées par l'application
     *
     * @var array<string>
     */
    protected array $supportedLocales = [
        'en', // Anglais (par défaut)
        'fr', // Français
        // 'es', // Espagnol (décommenter si vous ajoutez es.json)
        // 'de', // Allemand (décommenter si vous ajoutez de.json)
        // 'it', // Italien (décommenter si vous ajoutez it.json)
    ];

    /**
     * Langue par défaut si non spécifiée ou non supportée
     *
     * @var string
     */
    protected string $defaultLocale = 'en';

    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $locale = $this->detectLocale($request);

        app()->setLocale($locale);

        return $next($request);
    }

    /**
     * Détecter la langue à utiliser en fonction de la requête
     *
     * Ordre de priorité :
     * 1. Paramètre de requête 'lang' (?lang=fr)
     * 2. Header 'Accept-Language'
     * 3. Préférence de l'utilisateur authentifié (si disponible)
     * 4. Langue par défaut de l'application
     *
     * @param  \Illuminate\Http\Request  $request
     * @return string
     */
    protected function detectLocale(Request $request): string
    {
        // Option 1 : Paramètre de requête (?lang=fr)
        if ($request->has('lang')) {
            $locale = $request->query('lang');
            if ($this->isSupported($locale)) {
                return $locale;
            }
        }

        // Option 2 : Header Accept-Language
        $headerLocale = $request->header('Accept-Language');
        if ($headerLocale && $this->isSupported($headerLocale)) {
            return $headerLocale;
        }

        // Option 3 : Préférence de l'utilisateur authentifié
        // if (auth()->check() && auth()->user()->preferred_locale) {
        //     $userLocale = auth()->user()->preferred_locale;
        //     if ($this->isSupported($userLocale)) {
        //         return $userLocale;
        //     }
        // }

        // Option 4 : Langue par défaut de l'application (depuis .env)
        $appLocale = config('app.locale', $this->defaultLocale);
        if ($this->isSupported($appLocale)) {
            return $appLocale;
        }

        // Fallback final
        return $this->defaultLocale;
    }

    /**
     * Vérifier si une langue est supportée
     *
     * @param  string|null  $locale
     * @return bool
     */
    protected function isSupported(?string $locale): bool
    {
        if (empty($locale)) {
            return false;
        }

        // Normaliser (en-US → en, fr-FR → fr)
        $locale = strtolower(substr($locale, 0, 2));

        return in_array($locale, $this->supportedLocales);
    }
}
