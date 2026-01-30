<?php

namespace Modules\Superadmin\Exceptions;

use Exception;

class ModuleDependencyException extends Exception
{
    /**
     * Exception quand un module n'est pas trouvé
     */
    public static function moduleNotFound(string $module): self
    {
        return new self("Module '{$module}' not found");
    }

    /**
     * Exception quand une dépendance n'est pas trouvée
     */
    public static function dependencyNotFound(string $module, string $dependency): self
    {
        return new self("Module '{$module}' requires '{$dependency}' which was not found");
    }

    /**
     * Exception pour détecter les dépendances circulaires
     */
    public static function circularDependency(string $module, string $dependency): self
    {
        return new self("Circular dependency detected: '{$module}' <-> '{$dependency}'");
    }

    /**
     * Exception pour les dépendances manquantes multiples
     */
    public static function missingDependencies(string $module, array $missing): self
    {
        return new self("Module '{$module}' requires: " . implode(', ', $missing));
    }
}
