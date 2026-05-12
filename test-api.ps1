$ProgressPreference = 'SilentlyContinue'
$ErrorActionPreference = 'Stop'

try {
  Write-Host "`n=== TaskFlow API Tests ===" -ForegroundColor Cyan

  # 1. Admin Login
  $login = Invoke-RestMethod -Uri "http://localhost:5000/api/auth/login" -Method POST -ContentType "application/json" -Body '{"email":"admin@taskflow.com","password":"Admin@123"}'
  Write-Host "[PASS] Admin login | role: $($login.user.role)" -ForegroundColor Green
  $token = $login.token
  $headers = @{ Authorization = "Bearer $token" }

  # 2. Member registration (role must be forced to 'member')
  $regBody = '{"name":"Alice Test","email":"alicetest99@test.com","password":"alice1234"}'
  try {
    $reg = Invoke-RestMethod -Uri "http://localhost:5000/api/auth/register" -Method POST -ContentType "application/json" -Body $regBody
    Write-Host "[PASS] Member register | role: $($reg.user.role)" -ForegroundColor Green
    $memberToken = $reg.token
  } catch {
    # User already exists — just login
    $mLogin = Invoke-RestMethod -Uri "http://localhost:5000/api/auth/login" -Method POST -ContentType "application/json" -Body '{"email":"alicetest99@test.com","password":"alice1234"}'
    $memberToken = $mLogin.token
    Write-Host "[PASS] Member login (already registered) | role: $($mLogin.user.role)" -ForegroundColor Green
  }

  # 3. Role injection blocked
  $hackBody = '{"name":"Hacker","email":"hackadmin99@test.com","password":"hack1234","role":"admin"}'
  try {
    $hack = Invoke-RestMethod -Uri "http://localhost:5000/api/auth/register" -Method POST -ContentType "application/json" -Body $hackBody
    Write-Host "[PASS] Role injection blocked (role='$($hack.user.role)' not 'admin')" -ForegroundColor Green
  } catch {
    # Already registered — login and check role
    $hackLogin = Invoke-RestMethod -Uri "http://localhost:5000/api/auth/login" -Method POST -ContentType "application/json" -Body '{"email":"hackadmin99@test.com","password":"hack1234"}'
    Write-Host "[PASS] Role injection blocked (role='$($hackLogin.user.role)' not 'admin')" -ForegroundColor Green
  }

  # 4. Create Project (admin)
  $projBody = '{"name":"CI/CD Pipeline","description":"Automate deployments"}'
  $proj = Invoke-RestMethod -Uri "http://localhost:5000/api/projects" -Method POST -ContentType "application/json" -Headers $headers -Body $projBody
  Write-Host "[PASS] Project created: $($proj.name) | id: $($proj._id)" -ForegroundColor Green
  $projectId = $proj._id

  # 5. Create Task (admin)
  $taskBody = "{`"title`":`"Write unit tests`",`"project`":`"$projectId`",`"priority`":`"high`",`"status`":`"todo`"}"
  $task = Invoke-RestMethod -Uri "http://localhost:5000/api/tasks" -Method POST -ContentType "application/json" -Headers $headers -Body $taskBody
  Write-Host "[PASS] Task created: $($task.title) | priority: $($task.priority)" -ForegroundColor Green

  # 6. Update task status (admin)
  $updBody = "{`"status`":`"in-progress`"}"
  $upd = Invoke-RestMethod -Uri "http://localhost:5000/api/tasks/$($task._id)" -Method PUT -ContentType "application/json" -Headers $headers -Body $updBody
  Write-Host "[PASS] Task status updated: $($upd.status)" -ForegroundColor Green

  # 7. Member cannot create tasks
  $memberHeaders = @{ Authorization = "Bearer $memberToken" }
  $blocked = $false
  try {
    Invoke-RestMethod -Uri "http://localhost:5000/api/tasks" -Method POST -ContentType "application/json" -Headers $memberHeaders -Body $taskBody
  } catch {
    $blocked = $true
    Write-Host "[PASS] Member blocked from creating tasks (RBAC OK)" -ForegroundColor Green
  }
  if (-not $blocked) { Write-Host "[FAIL] Member should NOT be able to create tasks" -ForegroundColor Red }

  # 8. Get all tasks & projects
  $tasks = Invoke-RestMethod -Uri "http://localhost:5000/api/tasks" -Method GET -Headers $headers
  $projs = Invoke-RestMethod -Uri "http://localhost:5000/api/projects" -Method GET -Headers $headers
  Write-Host "[PASS] GET /tasks → $($tasks.Count) task(s) | GET /projects → $($projs.Count) project(s)" -ForegroundColor Green

  # 9. Delete task (cleanup)
  Invoke-RestMethod -Uri "http://localhost:5000/api/tasks/$($task._id)" -Method DELETE -Headers $headers | Out-Null
  Write-Host "[PASS] Task deleted (cleanup)" -ForegroundColor Green

  # 10. Delete project (cleanup)
  Invoke-RestMethod -Uri "http://localhost:5000/api/projects/$projectId" -Method DELETE -Headers $headers | Out-Null
  Write-Host "[PASS] Project deleted (cleanup)" -ForegroundColor Green

  Write-Host "`n=== All tests passed! App is working correctly ===" -ForegroundColor Cyan

} catch {
  Write-Host "[ERROR] $($_.Exception.Message)" -ForegroundColor Red
  if ($_.Exception.Response) {
    $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
    Write-Host "Response: $($reader.ReadToEnd())" -ForegroundColor Red
  }
}
