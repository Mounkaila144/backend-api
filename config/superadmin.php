<?php

return [
    /**
     * Hostname (without scheme) on which the superadmin interface is accessible.
     * Routes /api/superadmin/* respond ONLY when the request host matches this value
     * (see App\Http\Middleware\EnforceSuperadminHost). Tenant hosts get a 404, which
     * prevents the superadmin login form from being discoverable on a tenant domain.
     */
    'domain' => env('SUPERADMIN_DOMAIN', 'superadmin.local'),

    /**
     * Public URL exposed to the frontend so it can render a "Super Admin" link from
     * inside a tenant interface. Falls back to the domain above if not explicitly set.
     */
    'url' => env('SUPERADMIN_URL', 'http://' . env('SUPERADMIN_DOMAIN', 'superadmin.local')),
];
