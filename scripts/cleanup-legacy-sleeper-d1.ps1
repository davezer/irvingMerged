$targets = @(
  'src/lib/server/league/backfill.js',
  'src/lib/server/league/sleeper.js',
  'src/routes/api/admin/league/rosters',
  'src/routes/api/admin/league/transactions',
  'src/routes/api/admin/league/sync-sleeper'
)

foreach ($target in $targets) {
  if (Test-Path $target) {
    Remove-Item $target -Recurse -Force
    Write-Host "Removed $target"
  } else {
    Write-Host "Skipped $target (not found)"
  }
}
