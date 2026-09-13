# generate_report.ps1
$jsonPath = "e2e/test-results.json"
$screenshotDir = "e2e/screenshots"
$reportPath = "E2E_Test_Report.md"

if (-not (Test-Path $jsonPath)) { Write-Error "test-results.json not found"; exit 1 }

$raw = Get-Content $jsonPath -Raw | ConvertFrom-Json
$passed = 0; $failed = 0; $warned = 0
$lines = @()
$lines += "# E2E Test Report – Order System`n"
$lines += "> Generated: $(Get-Date -Format 'yyyy-MM-dd HH:mm') | App: http://localhost:3000`n"
$detail = @()

foreach ($suite in $raw.suites) {
    foreach ($spec in $suite.specs) {
        foreach ($test in $spec.tests) {
            $r = $test.results[0]
            $icon = if ($r.status -eq "passed") { "PASS"; $passed++ } elseif ($r.status -eq "failed") { "FAIL"; $failed++ } else { "WARN"; $warned++ }
            $status = if ($r.status -eq "passed") { "PASS" } elseif ($r.status -eq "failed") { "FAIL" } else { "WARN" }
            $detail += "### [$status] $($test.title)"
            $detail += "**Duration:** $($r.duration)ms`n"
            if ($r.status -eq "failed" -and $r.error) { $detail += "> Error: $($r.error.message -replace '`n',' ')" }
            if ($r.stdout) { $detail += "``````"; $r.stdout | ForEach-Object { $detail += $_.text }; $detail += "``````" }
            $detail += "---`n"
        }
    }
}

$total = $passed + $failed + $warned
$lines += "## Summary`n| | Count |`n|---|---|`n| Total | $total |`n| PASS | $passed |`n| FAIL | $failed |`n| WARN | $warned |`n---`n"
$lines += $detail
$lines | Set-Content -Encoding UTF8 $reportPath
Write-Output "Done: $reportPath"
