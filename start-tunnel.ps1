$sshUser = "root"
$sshHost = "184.107.88.123"

$localPort = 5433
$remoteHost = "127.0.0.1"
$remotePort = 5432

Write-Host "Iniciando tunel SSH para o PostgreSQL..."
Write-Host "Local: 127.0.0.1:$localPort"
Write-Host "Remoto: ${remoteHost}:${remotePort}"
Write-Host ""

while ($true) {
    Write-Host "Conectando em $sshHost..."

    ssh `
        -N `
        -L "${localPort}:${remoteHost}:${remotePort}" `
        -o ServerAliveInterval=30 `
        -o ServerAliveCountMax=3 `
        -o ExitOnForwardFailure=yes `
        "${sshUser}@${sshHost}"

    Write-Host ""
    Write-Host "Tunel desconectado."
    Write-Host "Tentando novamente em 5 segundos..."

    Start-Sleep -Seconds 5
}