param(
  [string]$Remote = "origin",
  [string]$Base = "main"
)

$ErrorActionPreference = "Stop"

function Require-Command([string]$name) {
  if (-not (Get-Command $name -ErrorAction SilentlyContinue)) {
    throw "Required command not found: $name"
  }
}

Require-Command git

Write-Host "Fetching $Remote/$Base..."
git fetch --no-tags --prune $Remote $Base | Out-Host

$headSha = (git rev-parse HEAD).Trim()
if (-not $headSha) { throw "Could not resolve HEAD SHA" }

$tmpBranch = "codex/pr-review-base-$([Guid]::NewGuid().ToString('N').Substring(0,8))"

try {
  Write-Host "Creating temp branch '$tmpBranch' at $Remote/$Base..."
  git checkout -B $tmpBranch "$Remote/$Base" | Out-Host

  Write-Host "Merging HEAD ($headSha) into $Base (no commit) to detect conflicts..."
  git merge --no-commit --no-ff $headSha | Out-Host

  Write-Host "Checking for conflict markers in tracked files..."
  $markers = (git grep -n -E '^(<<<<<<<|=======|>>>>>>>)' -- .) 2>$null
  if ($LASTEXITCODE -eq 0 -and $markers) {
    Write-Error "Found conflict markers:`n$markers"
    exit 1
  }

  Write-Host "Running git whitespace checks (git diff --check)..."
  git diff --check | Out-Host
  if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

  $php = Get-Command php -ErrorAction SilentlyContinue
  if ($php) {
    Write-Host "PHP found. Running php -l on *.php..."
    $phpFiles = Get-ChildItem -Recurse -File -Filter *.php | ForEach-Object { $_.FullName }
    if ($phpFiles.Count -eq 0) {
      Write-Host "No PHP files found."
    } else {
      foreach ($f in $phpFiles) {
        php -l $f | Out-Host
        if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
      }
    }
  } else {
    Write-Host "PHP not found; skipping php -l."
  }

  Write-Host "OK: mergeable + basic checks passed."
} finally {
  Write-Host "Cleaning up merge state and returning to previous branch..."
  git merge --abort 2>$null | Out-Null
  git checkout - 2>$null | Out-Null
  git branch -D $tmpBranch 2>$null | Out-Null
}

