$skills = @(
  'mgsd-plan-phase', 'mgsd-execute-phase', 'mgsd-discuss-phase',
  'mgsd-verify-work', 'mgsd-research-phase', 'mgsd-linear-sync',
  'mgsd-progress', 'mgsd-session-report'
)

$comments = @"

<!-- OVERRIDABLE: .mgsd-local/MIR/Core_Strategy/ overrides .agent/marketing-get-shit-done/templates/MIR/Core_Strategy/ -->
<!-- OVERRIDABLE: .mgsd-local/MIR/Market_Audiences/ overrides .agent/marketing-get-shit-done/templates/MIR/Market_Audiences/ -->
<!-- OVERRIDABLE: .mgsd-local/MIR/Products/ overrides .agent/marketing-get-shit-done/templates/MIR/Products/ -->
<!-- OVERRIDABLE: .mgsd-local/MIR/Campaigns_Assets/ overrides .agent/marketing-get-shit-done/templates/MIR/Campaigns_Assets/ -->
<!-- OVERRIDABLE: .mgsd-local/MIR/Operations/ overrides .agent/marketing-get-shit-done/templates/MIR/Operations/ -->
<!-- OVERRIDABLE: .mgsd-local/MSP/ overrides .agent/marketing-get-shit-done/templates/MSP/ -->
<!-- OVERRIDABLE: .mgsd-local/config/config.json overrides .agent/marketing-get-shit-done/templates/config.json -->
"@

foreach ($skill in $skills) {
    $p = "c:\Users\User PC\Documents\GitHub\mgsd\.agent\skills\$skill\SKILL.md"
    if (Test-Path $p) {
        $content = Get-Content -Raw $p
        if (-not $content.Contains("OVERRIDABLE: .mgsd-local/MIR/Core_Strategy/")) {
            $content += $comments
            Set-Content -Path $p -Value $content -NoNewline
            Write-Host "Updated $p"
        }
    }
}
