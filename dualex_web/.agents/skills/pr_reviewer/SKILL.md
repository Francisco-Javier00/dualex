# pr_reviewer

Revisa un PR localmente antes de subirlo (o antes de pedir review) para detectar:

- Conflictos al mergear contra `main`
- Marcadores de conflicto `<<<<<<<`, `=======`, `>>>>>>>`
- Problemas de whitespace detectables por `git diff --check`
- Errores de sintaxis en PHP (`php -l`) si existen archivos `.php`

## Uso

Desde la raíz del repo:

```powershell
pwsh -File dualex_web/.agents/skills/pr_reviewer/pr-review.ps1
```

Opcionalmente especifica el remoto y la rama base:

```powershell
pwsh -File dualex_web/.agents/skills/pr_reviewer/pr-review.ps1 -Remote origin -Base main
```

## Nota importante

Esto es un “skill” local para Codex/tu máquina. Para que corra automáticamente **en GitHub al abrir un PR hacia `main`**, el workflow debe vivir en `.github/workflows/` (por eso existe `.github/workflows/pr-main-check.yml`).

