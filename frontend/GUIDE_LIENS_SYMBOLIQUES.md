# Guide : Créer des Liens Symboliques BMAD

Ce guide explique comment créer des liens symboliques entre votre projet frontend et backend pour utiliser les agents BMAD.

---

## 🎯 Objectif

Créer des liens symboliques pour :
- `_bmad` → Dossier de configuration et workflows BMAD
- `_bmad-output` → Dossier de sortie des documents générés
- `.claude` → Configuration Claude et agents *(déjà présent)*

---

## ✅ Méthode 1 : Junction Points (RECOMMANDÉ - Pas besoin d'admin)

### Étapes :

1. **Ouvrir l'Explorateur Windows** :
   - Naviguez vers : `C:\Users\Mounkaila\WebstormProjects\icall26-front`

2. **Ouvrir un Terminal ici** :
   - Shift + Click droit dans le dossier
   - Choisir "Ouvrir dans le Terminal" ou "Ouvrir une fenêtre PowerShell ici"

3. **Exécuter ces commandes** :

```batch
mklink /J _bmad C:\laragon\www\backend-api\_bmad
mklink /J _bmad-output C:\laragon\www\backend-api\_bmad-output
```

4. **Vérifier** :
   - Les dossiers `_bmad` et `_bmad-output` doivent apparaître avec une icône de lien

---

## 🔧 Méthode 2 : Script Automatique

### Option A : Double-click sur le script

1. **Localiser le fichier** :
   - `C:\Users\Mounkaila\WebstormProjects\icall26-front\create-junctions.bat`

2. **Double-cliquer** dessus

3. **Vérifier les messages** dans la console

### Option B : Exécuter depuis PowerShell

```powershell
cd "C:\Users\Mounkaila\WebstormProjects\icall26-front"
.\create-junctions.bat
```

---

## 🔒 Méthode 3 : Liens Symboliques (Nécessite Admin)

Si vous voulez de **vrais liens symboliques** au lieu de junction points :

### Étapes :

1. **Ouvrir PowerShell en Administrateur** :
   - Menu Démarrer → Chercher "PowerShell"
   - Click droit → "Exécuter en tant qu'administrateur"

2. **Exécuter le script** :

```powershell
cd "C:\Users\Mounkaila\WebstormProjects\icall26-front"
.\create-symlinks.ps1
```

---

## ❓ Dépannage

### Erreur "Le fichier existe déjà"

Si un dossier existe déjà, supprimez-le d'abord :

```batch
rmdir _bmad /S /Q
rmdir _bmad-output /S /Q
```

Puis relancez les commandes mklink.

### Erreur "Privilèges insuffisants"

- **Pour Junction Points** : Pas de privilèges admin nécessaires. Si erreur, vérifiez que vous êtes dans le bon dossier.
- **Pour Symlinks** : Vous devez exécuter en tant qu'administrateur.

### Alternative : Mode Développeur Windows

Activez le **Mode Développeur** dans Windows 10/11 pour créer des symlinks sans admin :

1. Paramètres Windows
2. Mise à jour et sécurité → Pour les développeurs
3. Activer "Mode développeur"
4. Réessayer la méthode 3

---

## ✅ Vérification

Une fois les liens créés, vérifiez qu'ils fonctionnent :

### Dans l'Explorateur :
- Les dossiers `_bmad` et `_bmad-output` doivent avoir une icône de raccourci
- En ouvrant ces dossiers, vous devez voir le contenu du backend

### En ligne de commande :
```powershell
cd "C:\Users\Mounkaila\WebstormProjects\icall26-front"
dir _bmad
dir _bmad-output
```

### Dans VS Code / WebStorm :
- Ouvrez le dossier `_bmad` dans l'éditeur
- Vous devez voir les sous-dossiers : `_config`, `bmm`, `core`

---

## 📝 Configuration .gitignore

**IMPORTANT** : Ajoutez ces lignes à `.gitignore` pour ne pas commiter les liens :

```gitignore
# BMAD Links
_bmad
_bmad-output
.claude
```

---

## 🎉 Utilisation des Agents BMAD

Une fois les liens créés, vous pourrez utiliser les agents BMAD dans votre projet frontend :

### Commandes disponibles :

- `/create-story` - Créer une nouvelle user story
- `/dev-story` - Implémenter une story
- `/code-review` - Review de code
- `/prd` - Créer un PRD
- `/architecture` - Créer une architecture
- Et tous les autres workflows BMAD !

### Dans Claude Code :

Les agents détecteront automatiquement les fichiers via les liens symboliques et fonctionneront comme dans le backend.

---

## 🆘 Besoin d'Aide ?

Si les méthodes ci-dessus ne fonctionnent pas, vous pouvez :

1. **Créer les dossiers manuellement** et copier les fichiers (pas idéal, pas de synchronisation)
2. **Utiliser un outil tiers** comme Link Shell Extension
3. **Me demander de l'aide** pour déboguer le problème spécifique

---

**Fait avec ❤️ pour faciliter le développement avec BMAD**
