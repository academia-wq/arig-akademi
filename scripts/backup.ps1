# Ариг Академи — Supabase-ийн бүрэн backup (database + Storage файлууд)
#
# Ажиллуулах: төслийн үндсэн хавтас дахь backup.cmd дээр давхар товшино.
# Тохиргоо: төслийн үндсэн хавтас дахь .env.backup (git-д орохгүй).
#   Анх ажиллуулахад файл байхгүй бол загварыг нь үүсгээд зогсоно.
#
# Гаралт: BACKUP_DIR\YYYY-MM-DD_HHmm\
#   database.dump      — pg_dump (custom формат): бүх хүснэгт, өгөгдөл, auth.users
#   storage\<bucket>\  — Storage bucket бүрийн файлууд
#   manifest.txt       — юу хадгалагдсаны товч тайлан

$ErrorActionPreference = "Stop"
$ProgressPreference = "SilentlyContinue"
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

$RepoRoot = Split-Path -Parent $PSScriptRoot
$ConfigPath = Join-Path $RepoRoot ".env.backup"

function Write-Step($text) { Write-Host "`n==> $text" -ForegroundColor Cyan }
function Write-Ok($text) { Write-Host "    $text" -ForegroundColor Green }
function Write-Warn($text) { Write-Host "    $text" -ForegroundColor Yellow }

# ─────────────────────────────────────────────
# 1. Тохиргоо унших
# ─────────────────────────────────────────────

if (-not (Test-Path $ConfigPath)) {
  $template = @"
# Ариг Академи backup тохиргоо. Энэ файлыг git-д бүү оруул (.gitignore-д орсон).

# Supabase Dashboard -> Connect -> Session pooler URI.
# [YOUR-PASSWORD]-г database-ийн нууц үгээр соль. Нууц үгэнд @ : / # ? % тэмдэгт
# байвал URL-encode хий (жишээ нь @ -> %40).
SUPABASE_DB_URL=

# Storage файлуудыг татахад хэрэгтэй (Project Settings -> API Keys -> service_role / secret).
SUPABASE_URL=https://pzvvqjnnfzlvneqeinzl.supabase.co
SUPABASE_SERVICE_ROLE_KEY=

# Backup хадгалах хавтас (git repo-ийн гадна байх ёстой).
BACKUP_DIR=$([Environment]::GetFolderPath('MyDocuments'))\arig-backups

# Хамгийн сүүлийн хэдэн backup-ийг үлдээх вэ (хуучнууд нь автоматаар устна).
KEEP_LAST=8
"@
  Set-Content -Path $ConfigPath -Value $template -Encoding UTF8
  Write-Host "Тохиргооны файл үүсгэлээ: $ConfigPath" -ForegroundColor Yellow
  Write-Host "SUPABASE_DB_URL болон SUPABASE_SERVICE_ROLE_KEY-г бөглөөд дахин ажиллуулна уу."
  exit 1
}

$config = @{}
foreach ($line in Get-Content $ConfigPath -Encoding UTF8) {
  if ($line -match '^\s*#' -or $line -notmatch '=') { continue }
  $key, $value = $line -split '=', 2
  $config[$key.Trim()] = $value.Trim().Trim('"')
}

$DbUrl = $config["SUPABASE_DB_URL"]
$SupabaseUrl = ($config["SUPABASE_URL"]).TrimEnd('/')
$ServiceKey = $config["SUPABASE_SERVICE_ROLE_KEY"]
$BackupRoot = $config["BACKUP_DIR"]
$KeepLast = 8
if ($config["KEEP_LAST"]) { $KeepLast = [int]$config["KEEP_LAST"] }

if (-not $DbUrl -or $DbUrl -match 'YOUR-PASSWORD') {
  throw "SUPABASE_DB_URL бөглөгдөөгүй байна ($ConfigPath)."
}
if (-not $BackupRoot) { throw "BACKUP_DIR бөглөгдөөгүй байна ($ConfigPath)." }
if (([IO.Path]::GetFullPath($BackupRoot) + '\').StartsWith([IO.Path]::GetFullPath($RepoRoot) + '\', 'OrdinalIgnoreCase')) {
  throw "BACKUP_DIR нь git repo дотор байж болохгүй (хувийн мэдээлэл агуулна)."
}

# ─────────────────────────────────────────────
# 2. pg_dump олох
# ─────────────────────────────────────────────

$pgDump = (Get-Command pg_dump -ErrorAction SilentlyContinue).Source
if (-not $pgDump) {
  $pgDump = Get-ChildItem "C:\Program Files\PostgreSQL\*\bin\pg_dump.exe" -ErrorAction SilentlyContinue |
    Sort-Object { [int]($_.Directory.Parent.Name -replace '\D', '') } -Descending |
    Select-Object -First 1 -ExpandProperty FullName
}
if (-not $pgDump) {
  throw "pg_dump олдсонгүй. https://www.postgresql.org/download/windows/ -оос 'Command Line Tools'-ийг суулгана уу."
}

$stamp = Get-Date -Format "yyyy-MM-dd_HHmm"
$target = Join-Path $BackupRoot $stamp
New-Item -ItemType Directory -Force -Path $target | Out-Null
$manifest = New-Object System.Collections.Generic.List[string]
$manifest.Add("Ариг Академи backup — $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')")

# ─────────────────────────────────────────────
# 3. Database
# ─────────────────────────────────────────────

Write-Step "Database-ийг татаж байна ($(& $pgDump --version))"
$dumpFile = Join-Path $target "database.dump"
& $pgDump $DbUrl --format=custom --no-owner --no-privileges --file=$dumpFile
if ($LASTEXITCODE -ne 0) {
  throw "pg_dump амжилтгүй боллоо (код $LASTEXITCODE). Холболтын хаяг, нууц үг, pg_dump-ийн хувилбарыг шалгана уу."
}
$dumpSize = [math]::Round((Get-Item $dumpFile).Length / 1KB, 1)
Write-Ok "database.dump — $dumpSize KB"
$manifest.Add("database.dump: $dumpSize KB")

# ─────────────────────────────────────────────
# 4. Storage файлууд
# ─────────────────────────────────────────────

function Get-StorageObjects($bucket, $prefix, $headers) {
  $results = @()
  $offset = 0
  do {
    $body = @{ prefix = $prefix; limit = 1000; offset = $offset; sortBy = @{ column = "name"; order = "asc" } } | ConvertTo-Json
    $page = Invoke-RestMethod -Method Post -Uri "$SupabaseUrl/storage/v1/object/list/$bucket" `
      -Headers $headers -ContentType "application/json; charset=utf-8" -Body ([Text.Encoding]::UTF8.GetBytes($body))
    foreach ($item in $page) {
      $path = if ($prefix) { "$prefix/$($item.name)" } else { $item.name }
      if ($null -eq $item.id) {
        $results += Get-StorageObjects $bucket $path $headers   # хавтас
      } else {
        $results += $path
      }
    }
    $offset += 1000
  } while (@($page).Count -eq 1000)
  return $results
}

if (-not $ServiceKey) {
  Write-Warn "SUPABASE_SERVICE_ROLE_KEY бөглөгдөөгүй тул Storage файлуудыг алгаслаа."
  $manifest.Add("storage: алгассан (service role key байхгүй)")
} elseif ($ServiceKey -notmatch '^(sb_secret_|eyJ)' -or $ServiceKey.Length -lt 30) {
  Write-Warn "SUPABASE_SERVICE_ROLE_KEY буруу эсвэл дутуу хуулагдсан байна ($($ServiceKey.Length) тэмдэгт)."
  Write-Warn "'sb_secret_' эсвэл 'eyJ'-ээр эхэлсэн, бүтэн түлхүүрийг хуулах товчоор хуулна уу."
  Write-Warn "Project Settings -> API Keys -> Secret keys (эсвэл Legacy API keys -> service_role)-оос хуулна уу."
  Write-Warn "Storage файлуудыг алгаслаа. Database-ийн backup хадгалагдсан."
  $manifest.Add("storage: алгассан (service role key буруу)")
} else {
  Write-Step "Storage файлуудыг татаж байна"
  # Storage хоёр header-ийг хоёуланг нь шаарддаг. Шинэ "sb_secret_" түлхүүрийг
  # Supabase-ийн gateway apikey-тэй таарч байвал service_role JWT болгон сольдог.
  $headers = @{ apikey = $ServiceKey; Authorization = "Bearer $ServiceKey" }
  $buckets = Invoke-RestMethod -Uri "$SupabaseUrl/storage/v1/bucket" -Headers $headers
  foreach ($bucket in $buckets) {
    $files = @(Get-StorageObjects $bucket.id "" $headers)
    $bucketDir = Join-Path $target "storage\$($bucket.id)"
    New-Item -ItemType Directory -Force -Path $bucketDir | Out-Null
    $bytes = 0
    foreach ($file in $files) {
      $localPath = Join-Path $bucketDir ($file -replace '/', '\')
      New-Item -ItemType Directory -Force -Path (Split-Path -Parent $localPath) | Out-Null
      $encoded = ($file -split '/' | ForEach-Object { [Uri]::EscapeDataString($_) }) -join '/'
      Invoke-WebRequest -Uri "$SupabaseUrl/storage/v1/object/$($bucket.id)/$encoded" `
        -Headers $headers -OutFile $localPath -UseBasicParsing
      $bytes += (Get-Item -LiteralPath $localPath).Length
    }
    $sizeMb = [math]::Round($bytes / 1MB, 2)
    Write-Ok "$($bucket.id): $($files.Count) файл, $sizeMb MB"
    $manifest.Add("storage/$($bucket.id): $($files.Count) файл, $sizeMb MB")
  }
}

Set-Content -Path (Join-Path $target "manifest.txt") -Value $manifest -Encoding UTF8

# ─────────────────────────────────────────────
# 5. Хуучин backup-уудыг цэвэрлэх
# ─────────────────────────────────────────────

$old = Get-ChildItem -Directory $BackupRoot |
  Where-Object { $_.Name -match '^\d{4}-\d{2}-\d{2}_\d{4}$' } |
  Sort-Object Name -Descending | Select-Object -Skip $KeepLast
foreach ($dir in $old) {
  Remove-Item -Recurse -Force -LiteralPath $dir.FullName
  Write-Warn "Хуучин backup устгав: $($dir.Name)"
}

Write-Host "`nBackup амжилттай: $target" -ForegroundColor Green
