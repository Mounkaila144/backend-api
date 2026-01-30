<?php

namespace Modules\Superadmin\Services;

interface ModuleDependencyResolverInterface
{
    /**
     * Résout les dépendances et retourne l'ordre d'installation
     *
     * @param string $moduleName
     * @return array Liste ordonnée des modules à installer
     * @throws \Modules\Superadmin\Exceptions\ModuleDependencyException
     */
    public function resolve(string $moduleName): array;

    /**
     * Récupère tous les modules qui dépendent d'un module donné
     *
     * @param string $moduleName
     * @return array Liste des modules dépendants
     */
    public function getDependents(string $moduleName): array;

    /**
     * Vérifie si un module peut être activé (dépendances satisfaites)
     *
     * @param string $moduleName
     * @param int $siteId
     * @return array ['can_activate' => bool, 'missing' => array, 'message' => string]
     */
    public function canActivate(string $moduleName, int $siteId): array;

    /**
     * Vérifie si un module peut être désactivé (pas de dépendants actifs)
     *
     * @param string $moduleName
     * @param int $siteId
     * @return array ['can_deactivate' => bool, 'blocking_modules' => array, 'message' => string]
     */
    public function canDeactivate(string $moduleName, int $siteId): array;

    /**
     * Récupère les dépendances directes d'un module
     *
     * @param string $moduleName
     * @return array Liste des dépendances directes
     */
    public function getModuleDependencies(string $moduleName): array;
}
