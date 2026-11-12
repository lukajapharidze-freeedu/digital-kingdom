# digital.kingdom — მოსწავლის კომპიუტერზე ერთჯერადი დაყენება.
#
# ეს სკრიპტი Windows-ის hosts ფაილში წერს: "<მასპინძლის IP>  digital.kingdom",
# რომ ბრაუზერში digital.kingdom/ მასპინძლის კომპიუტერზე გაშვებულ თამაშს ხსნიდეს.
#
# გაშვება (PowerShell "Run as administrator"):
#   powershell -ExecutionPolicy Bypass -File .\digital-kingdom-hosts.ps1 -Ip 10.100.104.54
# წაშლა:
#   powershell -ExecutionPolicy Bypass -File .\digital-kingdom-hosts.ps1 -Remove
#
# თუ მასპინძლის IP შეიცვლება, სკრიპტი ახალი IP-ით თავიდან გაუშვი — ძველ ჩანაწერს ჩაანაცვლებს.

param(
  [string]$Ip,
  [switch]$Remove
)

$ErrorActionPreference = 'Stop'
$name = 'digital.kingdom'
$hosts = Join-Path $env:SystemRoot 'System32\drivers\etc\hosts'

$isAdmin = ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole(
  [Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
  Write-Host 'ეს სკრიპტი ადმინისტრატორის უფლებით უნდა გაეშვას (Run as administrator).' -ForegroundColor Red
  exit 1
}

if (-not $Remove) {
  $parsed = $null
  if (-not $Ip -or -not [System.Net.IPAddress]::TryParse($Ip, [ref]$parsed) -or $parsed.AddressFamily -ne 'InterNetwork') {
    Write-Host 'მიუთითე მასპინძლის IPv4 მისამართი, მაგ.: -Ip 10.100.104.54' -ForegroundColor Red
    exit 1
  }
}

# ძველი digital.kingdom ჩანაწერები ვშლით, დანარჩენს არ ვეხებით
$lines = @(Get-Content -LiteralPath $hosts -Encoding ASCII | Where-Object { $_ -notmatch "^\s*[0-9a-fA-F:.]+\s+$([regex]::Escape($name))\s*(#.*)?$" })
if (-not $Remove) { $lines += "$Ip`t$name`t# Digital Kingdom (LAN)" }
Set-Content -LiteralPath $hosts -Value $lines -Encoding ASCII
ipconfig /flushdns | Out-Null

if ($Remove) {
  Write-Host "$name წაიშალა hosts ფაილიდან." -ForegroundColor Green
} else {
  Write-Host "მზადაა: $name -> $Ip" -ForegroundColor Green
  Write-Host 'ბრაუზერში პირველად ჩაწერე: digital.kingdom/  (ბოლოში დახრილი ხაზით)'
}
