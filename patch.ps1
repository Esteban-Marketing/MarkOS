$skills = @(
  'markos-plan-phase', 'markos-execute-phase', 'markos-discuss-phase',
  'markos-verify-work', 'markos-research-phase', 'markos-linear-sync',
  'markos-progress', 'markos-session-report'
)

$comments = @"

<!-- OVERRIDABLE: .markos-local/MIR/Core_Strategy/ overrides .agent/markos/templates/MIR/Core_Strategy/ -->
<!-- OVERRIDABLE: .markos-local/MIR/Market_Audiences/ overrides .agent/markos/templates/MIR/Market_Audiences/ -->
<!-- OVERRIDABLE: .markos-local/MIR/Products/ overrides .agent/markos/templates/MIR/Products/ -->
<!-- OVERRIDABLE: .markos-local/MIR/Campaigns_Assets/ overrides .agent/markos/templates/MIR/Campaigns_Assets/ -->
<!-- OVERRIDABLE: .markos-local/MIR/Operations/ overrides .agent/markos/templates/MIR/Operations/ -->
<!-- OVERRIDABLE: .markos-local/MSP/ overrides .agent/markos/templates/MSP/ -->
<!-- OVERRIDABLE: .markos-local/config/config.json overrides .agent/markos/templates/config.json -->
"@

foreach ($skill in $skills) {
    $p = "c:\Users\User PC\Documents\GitHub\markos\.agent\skills\$skill\SKILL.md"
    if (Test-Path $p) {
        $content = Get-Content -Raw $p
        if (-not $content.Contains("OVERRIDABLE: .markos-local/MIR/Core_Strategy/")) {
            $content += $comments
            Set-Content -Path $p -Value $content -NoNewline
            Write-Host "Updated $p"
        }
    }
}
