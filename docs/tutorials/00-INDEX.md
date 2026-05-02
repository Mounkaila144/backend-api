# Tutoriels - Comprendre le Projet de A a Z

Ce guide est concu pour un developpeur senior qui a vibe-code ce projet avec l'IA
et souhaite maintenant comprendre chaque piece du puzzle.

## Ordre de lecture recommande

| # | Fichier | Ce que vous apprendrez |
|---|---------|----------------------|
| 1 | [01-VUE-ENSEMBLE.md](01-VUE-ENSEMBLE.md) | Architecture globale, pourquoi ces choix, comment les pieces s'emboitent |
| 2 | [02-MULTI-TENANCY.md](02-MULTI-TENANCY.md) | Comment un seul backend sert N clients avec N bases de donnees |
| 3 | [03-MODULES-LARAVEL.md](03-MODULES-LARAVEL.md) | Le systeme modulaire : comment creer, organiser et comprendre un module |
| 4 | [04-AUTHENTIFICATION.md](04-AUTHENTIFICATION.md) | Login, tokens Sanctum, refresh, logout - backend ET frontend |
| 5 | [05-PERMISSIONS.md](05-PERMISSIONS.md) | Le systeme de permissions compatible Symfony 1, cote backend et frontend |
| 6 | [06-CYCLE-DE-VIE-REQUETE.md](06-CYCLE-DE-VIE-REQUETE.md) | Une requete de bout en bout : du clic frontend jusqu'a la reponse JSON |
| 7 | [07-FRONTEND-NEXTJS.md](07-FRONTEND-NEXTJS.md) | Architecture Next.js, routing, providers, modules frontend |
| 8 | [08-PATTERNS-ET-CONVENTIONS.md](08-PATTERNS-ET-CONVENTIONS.md) | Repository, Resource, Controller mince, conventions de nommage |
| 9 | [09-BASE-DE-DONNEES.md](09-BASE-DE-DONNEES.md) | Schema legacy Symfony 1, connexions, migrations tenant |
| 10 | [10-GUIDE-PRATIQUE.md](10-GUIDE-PRATIQUE.md) | Comment ajouter un module, un CRUD, debugger, tester |

## Prerequis

- PHP 8.2+, Composer, Laravel CLI
- Node.js 18+, npm/yarn
- MySQL/MariaDB
- Redis
- Laragon (environnement local)
