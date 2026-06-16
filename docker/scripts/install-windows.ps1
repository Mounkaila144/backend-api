#Requires -Version 5.1
<#
.SYNOPSIS
    Installeur 1-clic backend-api pour Windows (développement local).

.DESCRIPTION
    - Vérifie Docker Desktop (installation + exécution)
    - Édite C:\Windows\System32\drivers\etc\hosts (auto-élévation UAC)
    - Génère .env avec APP_KEY et frontend/.env avec NEXTAUTH_SECRET aléatoires
    - Build les images Docker
    - Démarre la stack (docker compose up -d)
    - Ouvre http://superadmin.local:8080 dans le navigateur

.NOTES
    Usage normal : double-clic sur install-windows.bat
#>
[CmdletBinding()]
param(
    [switch]$SkipBuild,
    [switch]$SkipHostsEdit,
    [switch]$Elevated
)

$ErrorActionPreference = 'Stop'
$ProgressPreference    = 'Continue'

# ============================================================================
# Encodage UTF-8 — affiche correctement les accents et les caractères Unicode
# ============================================================================
try {
    [Console]::OutputEncoding = [System.Text.UTF8Encoding]::new($false)
    [Console]::InputEncoding  = [System.Text.UTF8Encoding]::new($false)
    $OutputEncoding           = [System.Text.UTF8Encoding]::new($false)
    $null = chcp 65001
} catch { }

# ============================================================================
# Constantes
# ============================================================================
$script:HOSTS_FILE     = "$env:windir\System32\drivers\etc\hosts"
$script:HOSTS_ENTRIES  = @('superadmin.local', 'tenant1.local', 'tenant2.local', 'tenant3.local')
$script:HOSTS_MARKER   = '# === backend-api docker stack ==='
$script:PROJECT_ROOT   = Resolve-Path (Join-Path $PSScriptRoot '..\..')
$script:BOX_WIDTH      = 72

# ============================================================================
# Helpers d'affichage — design soigné
# ============================================================================
function Write-Box {
    param(
        [string]$Title,
        [ConsoleColor]$Color = 'Cyan'
    )
    $w = $script:BOX_WIDTH
    $top    = '╔' + ('═' * ($w - 2)) + '╗'
    $bot    = '╚' + ('═' * ($w - 2)) + '╝'
    $empty  = '║' + (' ' * ($w - 2)) + '║'
    $padded = '  ' + $Title
    $line   = '║' + $padded.PadRight($w - 2) + '║'

    Write-Host ''
    Write-Host $top   -ForegroundColor $Color
    Write-Host $empty -ForegroundColor $Color
    Write-Host $line  -ForegroundColor $Color
    Write-Host $empty -ForegroundColor $Color
    Write-Host $bot   -ForegroundColor $Color
    Write-Host ''
}

function Write-Step {
    param(
        [int]$Number,
        [int]$Total,
        [string]$Label
    )
    $separator = '  ' + ('─' * ($script:BOX_WIDTH - 4))
    Write-Host ''
    Write-Host "  ▶ ÉTAPE $Number/$Total  " -ForegroundColor Cyan -NoNewline
    Write-Host $Label -ForegroundColor White
    Write-Host $separator -ForegroundColor DarkGray
}

function Write-Ok      { param($t) Write-Host '    ✓ '   -NoNewline -ForegroundColor Green;     Write-Host $t -ForegroundColor Gray }
function Write-Add     { param($t) Write-Host '    + '   -NoNewline -ForegroundColor Green;     Write-Host $t -ForegroundColor Gray }
function Write-Skip    { param($t) Write-Host '    · '   -NoNewline -ForegroundColor DarkGray;  Write-Host $t -ForegroundColor DarkGray }
function Write-Warn    { param($t) Write-Host '    ⚠ '   -NoNewline -ForegroundColor Yellow;    Write-Host $t -ForegroundColor Yellow }
function Write-Err     { param($t) Write-Host '    ✗ '   -NoNewline -ForegroundColor Red;       Write-Host $t -ForegroundColor Red }
function Write-Action  { param($t) Write-Host '    → '   -NoNewline -ForegroundColor Magenta;   Write-Host $t -ForegroundColor White }
function Write-Wait    { param($t) Write-Host '    ⏳ '  -NoNewline -ForegroundColor Yellow;    Write-Host $t -ForegroundColor Gray }

function Write-Banner {
    $w = $script:BOX_WIDTH
    $title = 'BACKEND-API  ·  INSTALLATEUR WINDOWS  ·  DÉVELOPPEMENT LOCAL'
    $pad   = [Math]::Floor(($w - 2 - $title.Length) / 2)
    $line  = '║' + (' ' * $pad) + $title + (' ' * ($w - 2 - $pad - $title.Length)) + '║'
    $top   = '╔' + ('═' * ($w - 2)) + '╗'
    $bot   = '╚' + ('═' * ($w - 2)) + '╝'
    $empty = '║' + (' ' * ($w - 2)) + '║'

    Clear-Host
    Write-Host ''
    Write-Host $top   -ForegroundColor Cyan
    Write-Host $empty -ForegroundColor Cyan
    Write-Host $line  -ForegroundColor Cyan
    Write-Host $empty -ForegroundColor Cyan
    Write-Host $bot   -ForegroundColor Cyan
    Write-Host ''
}

# ============================================================================
# Auto-élévation (pour le hosts file)
# ============================================================================
function Test-IsAdmin {
    $id = [Security.Principal.WindowsIdentity]::GetCurrent()
    return (New-Object Security.Principal.WindowsPrincipal($id)).IsInRole(
        [Security.Principal.WindowsBuiltInRole]::Administrator)
}

if (-not $Elevated -and -not $SkipHostsEdit -and -not (Test-IsAdmin)) {
    Write-Banner
    Write-Host '  Élévation administrateur requise pour modifier le fichier hosts.' -ForegroundColor Yellow
    Write-Host '  Une fenêtre UAC va apparaître — clique sur Oui.'                  -ForegroundColor Yellow
    Write-Host ''
    Start-Sleep -Seconds 2

    $argList = @(
        '-NoProfile'
        '-ExecutionPolicy', 'Bypass'
        '-File', "`"$PSCommandPath`""
        '-Elevated'
    )
    if ($SkipBuild)     { $argList += '-SkipBuild' }
    if ($SkipHostsEdit) { $argList += '-SkipHostsEdit' }

    Start-Process powershell.exe -Verb RunAs -ArgumentList $argList -Wait
    exit 0
}

# ============================================================================
# Génération de secrets
# ============================================================================
function New-LaravelAppKey {
    $bytes = New-Object byte[] 32
    [Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($bytes)
    return "base64:$([Convert]::ToBase64String($bytes))"
}

function New-RandomHex {
    param([int]$Length = 32)
    $bytes = New-Object byte[] $Length
    [Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($bytes)
    return -join ($bytes | ForEach-Object { $_.ToString('x2') })
}

# ============================================================================
# Manipulation du fichier hosts
# ============================================================================
function Sync-HostsFile {
    param([string[]]$Hostnames, [string]$Ip = '127.0.0.1')

    if (-not (Test-Path $script:HOSTS_FILE)) {
        Write-Err "Fichier hosts introuvable : $script:HOSTS_FILE"
        return
    }

    $content = Get-Content $script:HOSTS_FILE -Raw
    $modified = $false

    foreach ($hostname in $Hostnames) {
        $pattern = "(?m)^\s*\d+\.\d+\.\d+\.\d+\s+.*\b$([regex]::Escape($hostname))\b"
        if ($content -notmatch $pattern) {
            $line = "$Ip`t$hostname`t$script:HOSTS_MARKER"
            if ($content -and -not $content.EndsWith("`n")) { $content += "`r`n" }
            $content += "$line`r`n"
            $modified = $true
            Write-Add ("{0,-22} → {1}" -f $hostname, $Ip)
        } else {
            Write-Skip ("{0,-22}   déjà présent" -f $hostname)
        }
    }

    if ($modified) {
        Set-Content -Path $script:HOSTS_FILE -Value $content -Encoding ASCII -Force
        Write-Ok 'Fichier hosts mis à jour'
    }
}

# ============================================================================
# Manipulation des .env
# ============================================================================
function Set-EnvValue {
    param([string]$Path, [string]$Key, [string]$Value)
    if (-not (Test-Path $Path)) { Write-Err "Fichier introuvable : $Path"; return }

    $lines = Get-Content $Path
    $pattern = "^$([regex]::Escape($Key))="
    $found = $false
    $newLines = foreach ($line in $lines) {
        if ($line -match $pattern) { "$Key=$Value"; $found = $true } else { $line }
    }
    if (-not $found) { $newLines += "$Key=$Value" }

    Set-Content -Path $Path -Value $newLines -Encoding UTF8
}

# ============================================================================
# Helpers prérequis
# ============================================================================
function Test-Command {
    param([string]$Name)
    $null = Get-Command $Name -ErrorAction SilentlyContinue
    return $?
}

function Test-DockerRunning {
    try { $null = & docker info 2>&1; return $LASTEXITCODE -eq 0 } catch { return $false }
}

# ============================================================================
# Étapes principales
# ============================================================================
function Step-CheckPrerequisites {
    Write-Step 1 6 'Prérequis système'

    if (-not (Test-Command 'docker')) {
        Write-Err 'Docker Desktop introuvable'
        Write-Action 'Téléchargement : https://www.docker.com/products/docker-desktop/'
        Start-Process 'https://www.docker.com/products/docker-desktop/'
        Write-Host ''
        Write-Host '  Installe-le, lance-le, attends "Engine running",' -ForegroundColor Yellow
        Write-Host '  puis relance ce script.'                          -ForegroundColor Yellow
        Read-Host '  Appuie sur Entrée pour quitter'
        exit 1
    }
    Write-Ok ("{0,-18}{1}" -f 'docker.exe', 'installé')

    if (-not (Test-DockerRunning)) {
        Write-Err 'Docker Engine non démarré'
        Write-Action 'Lance Docker Desktop depuis le menu Démarrer'
        Write-Host ''
        Write-Host '  Attends que la barre de statut affiche "Engine running",' -ForegroundColor Yellow
        Write-Host '  puis relance ce script.'                                  -ForegroundColor Yellow
        Read-Host '  Appuie sur Entrée pour quitter'
        exit 1
    }
    Write-Ok ("{0,-18}{1}" -f 'Docker Engine', 'actif')

    if (Test-Command 'git') { Write-Ok ("{0,-18}{1}" -f 'Git', 'disponible') }
    else                    { Write-Warn ("{0,-18}{1}" -f 'Git', 'absent (non bloquant)') }
}

function Step-EditHosts {
    Write-Step 2 6 'Configuration du fichier hosts'
    if ($SkipHostsEdit) { Write-Skip '-SkipHostsEdit passé, étape ignorée'; return }
    Sync-HostsFile -Hostnames $script:HOSTS_ENTRIES
}

function Step-CreateBackendEnv {
    Write-Step 3 6 'Configuration .env (Laravel)'

    $envPath     = Join-Path $script:PROJECT_ROOT '.env'
    $examplePath = Join-Path $script:PROJECT_ROOT '.env.docker.example'

    if (Test-Path $envPath) {
        Write-Skip '.env existe déjà — non modifié'
        return
    }

    if (-not (Test-Path $examplePath)) {
        Write-Err ".env.docker.example introuvable"
        return
    }

    Copy-Item $examplePath $envPath
    Write-Ok '.env créé depuis .env.docker.example'

    Set-EnvValue -Path $envPath -Key 'APP_KEY'   -Value (New-LaravelAppKey)
    Write-Ok 'APP_KEY générée (256 bits)'

    Set-EnvValue -Path $envPath -Key 'APP_ENV'   -Value 'local'
    Set-EnvValue -Path $envPath -Key 'APP_DEBUG' -Value 'true'
    Set-EnvValue -Path $envPath -Key 'APP_URL'   -Value 'http://superadmin.local:8080'
    Set-EnvValue -Path $envPath -Key 'LOG_LEVEL' -Value 'debug'
    Write-Ok 'Mode développement local activé'

    # Hôte / domaines locaux. Sans ces 3 lignes, le middleware EnforceSuperadminHost
    # renvoie 404 sur /api/superadmin/* et Sanctum SPA refuse de démarrer la session.
    Set-EnvValue -Path $envPath -Key 'SUPERADMIN_DOMAIN'        -Value 'superadmin.local'
    Set-EnvValue -Path $envPath -Key 'FRONTEND_URL'             -Value 'http://superadmin.local:8080'
    # Sanctum stateful : on couvre les 2 ports (80 si nginx host, 8080 si on passe
    # par le mapping Docker dev) et les wildcards `*.local` pour tous les tenants.
    Set-EnvValue -Path $envPath -Key 'SANCTUM_STATEFUL_DOMAINS' -Value 'superadmin.local,tenant1.local,tenant2.local,tenant3.local,*.local,superadmin.local:8080,tenant1.local:8080,tenant2.local:8080,tenant3.local:8080,*.local:8080,localhost,localhost:8080,127.0.0.1,127.0.0.1:8080'
    Write-Ok 'Hôtes locaux configurés (superadmin.local + tenants)'

    Write-Host ''
    Write-Action 'Édite la section DATABASE dans Notepad (DB_HOST, DB_DATABASE, etc.)'
    Read-Host  '    Appuie sur Entrée pour ouvrir le .env'
    Start-Process notepad.exe $envPath -Wait
    Write-Ok '.env enregistré'
}

function Step-CreateFrontendEnv {
    Write-Step 4 6 'Configuration frontend/.env (Next.js)'

    $envPath     = Join-Path $script:PROJECT_ROOT 'frontend\.env'
    $examplePath = Join-Path $script:PROJECT_ROOT 'frontend\.env.example'

    if (Test-Path $envPath) {
        Write-Skip 'frontend/.env existe déjà — non modifié'
        return
    }

    if (Test-Path $examplePath) {
        Copy-Item $examplePath $envPath
        Write-Ok 'frontend/.env créé depuis .env.example'
    } else {
        New-Item -Path $envPath -ItemType File -Force | Out-Null
        Write-Ok 'frontend/.env créé (vide)'
    }

    Set-EnvValue -Path $envPath -Key 'NEXTAUTH_SECRET'    -Value (New-RandomHex -Length 32)
    Set-EnvValue -Path $envPath -Key 'NEXTAUTH_URL'       -Value 'http://superadmin.local:8080/api/auth'
    Set-EnvValue -Path $envPath -Key 'NEXT_PUBLIC_APP_URL' -Value 'http://superadmin.local:8080'
    Write-Ok 'NEXTAUTH_SECRET générée (256 bits)'
    Write-Ok 'NEXTAUTH_URL + NEXT_PUBLIC_APP_URL configurées'

    # Force les URLs API en relatif (vide → fallback `/api` dans api-client.ts).
    # Sans ça, le frontend tape http://localhost:3000/api/* qui ne résout pas
    # côté navigateur (Next.js est dans Docker, accessible via nginx:8080).
    Set-EnvValue -Path $envPath -Key 'API_URL'             -Value ''
    Set-EnvValue -Path $envPath -Key 'NEXT_PUBLIC_API_URL' -Value ''
    Write-Ok 'API_URL en mode relatif (/api → nginx → Laravel)'
}

function Step-Build {
    Write-Step 5 6 'Build des images Docker'
    if ($SkipBuild) { Write-Skip '-SkipBuild passé, étape ignorée'; return }

    Push-Location $script:PROJECT_ROOT
    try {
        Write-Wait 'Build en cours… (3-10 min selon ta connexion)'
        Write-Host ''
        & docker compose build --parallel
        if ($LASTEXITCODE -ne 0) { throw 'docker compose build a échoué' }
        Write-Host ''
        Write-Ok 'Images Docker construites'
    } finally {
        Pop-Location
    }
}

function Step-Up {
    Write-Step 6 6 'Démarrage des containers'

    Push-Location $script:PROJECT_ROOT
    try {
        & docker compose up -d
        if ($LASTEXITCODE -ne 0) { throw 'docker compose up a échoué' }
        Write-Ok 'Stack démarrée'

        Start-Sleep -Seconds 3

        Write-Host ''
        Write-Wait 'Migration de la DB centrale (best-effort)'
        & docker compose exec -T app php artisan migrate --force 2>&1 | Out-Host
        if ($LASTEXITCODE -ne 0) {
            Write-Warn 'Migration échouée — vérifie les credentials DB dans .env'
            Write-Action 'Relance plus tard : docker compose exec app php artisan migrate --force'
        } else {
            Write-Ok 'Migration appliquée'
        }
    } finally {
        Pop-Location
    }
}

function Step-Finish {
    $w = $script:BOX_WIDTH
    $title = '✓  INSTALLATION TERMINÉE'
    $pad   = [Math]::Floor(($w - 2 - $title.Length) / 2)
    $line  = '║' + (' ' * $pad) + $title + (' ' * ($w - 2 - $pad - $title.Length)) + '║'
    $top   = '╔' + ('═' * ($w - 2)) + '╗'
    $bot   = '╚' + ('═' * ($w - 2)) + '╝'
    $empty = '║' + (' ' * ($w - 2)) + '║'

    Write-Host ''
    Write-Host $top   -ForegroundColor Green
    Write-Host $empty -ForegroundColor Green
    Write-Host $line  -ForegroundColor Green
    Write-Host $empty -ForegroundColor Green
    Write-Host $bot   -ForegroundColor Green
    Write-Host ''

    Write-Host '  ▶ ' -NoNewline -ForegroundColor Cyan; Write-Host 'Accès à l''application' -ForegroundColor White
    Write-Host '      http://superadmin.local:8080' -ForegroundColor Cyan
    Write-Host '      http://tenant1.local:8080'    -ForegroundColor Cyan
    Write-Host ''

    Write-Host '  ▶ ' -NoNewline -ForegroundColor Cyan; Write-Host 'Commandes utiles' -ForegroundColor White
    Write-Host '      docker compose logs -f       ' -NoNewline -ForegroundColor Gray; Write-Host '# logs en direct'    -ForegroundColor DarkGray
    Write-Host '      docker compose ps            ' -NoNewline -ForegroundColor Gray; Write-Host '# état des containers' -ForegroundColor DarkGray
    Write-Host '      docker compose down          ' -NoNewline -ForegroundColor Gray; Write-Host '# tout arrêter'      -ForegroundColor DarkGray
    Write-Host '      docker compose up -d         ' -NoNewline -ForegroundColor Gray; Write-Host '# redémarrer'        -ForegroundColor DarkGray
    Write-Host ''

    Write-Host '  ▶ ' -NoNewline -ForegroundColor Cyan; Write-Host 'Pour relancer cet installeur' -ForegroundColor White
    Write-Host '      double-clic sur install-windows.bat' -ForegroundColor Gray
    Write-Host ''

    Start-Sleep -Seconds 1
    Start-Process 'http://superadmin.local:8080'
}

# ============================================================================
# Pipeline principal
# ============================================================================
try {
    Write-Banner

    Step-CheckPrerequisites
    Step-EditHosts
    Step-CreateBackendEnv
    Step-CreateFrontendEnv
    Step-Build
    Step-Up
    Step-Finish

    Write-Host ''
    Read-Host '  Appuie sur Entrée pour fermer cette fenêtre'
}
catch {
    Write-Host ''
    $w = $script:BOX_WIDTH
    $top   = '╔' + ('═' * ($w - 2)) + '╗'
    $bot   = '╚' + ('═' * ($w - 2)) + '╝'
    $title = '✗  ÉCHEC DE L''INSTALLATION'
    $pad   = [Math]::Floor(($w - 2 - $title.Length) / 2)
    $line  = '║' + (' ' * $pad) + $title + (' ' * ($w - 2 - $pad - $title.Length)) + '║'

    Write-Host $top  -ForegroundColor Red
    Write-Host $line -ForegroundColor Red
    Write-Host $bot  -ForegroundColor Red
    Write-Host ''
    Write-Err $_.Exception.Message
    Write-Host ''
    Write-Host '  ▶ ' -NoNewline -ForegroundColor Yellow; Write-Host 'Pour debug' -ForegroundColor White
    Write-Host '      docker compose logs' -ForegroundColor Gray
    Write-Host '      docker compose ps'   -ForegroundColor Gray
    Write-Host ''
    Read-Host '  Appuie sur Entrée pour quitter'
    exit 1
}
