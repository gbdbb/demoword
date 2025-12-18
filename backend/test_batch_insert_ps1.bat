@echo off
REM 批量插入API测试脚本 (Windows PowerShell版本)

set API_BASE_URL=http://localhost:8080/api/reports

echo 测试1: 正常插入数据
powershell -Command "try { $response = Invoke-WebRequest -Uri '%API_BASE_URL%/batch-insert' -Method POST -ContentType 'application/json' -Body '{\"report\": {\"id\": \"R001\", \"generated_at\": \"2024-12-18 11:00:00\", \"status\": \"PENDING\", \"ai_judgment\": \"建议降低 BTC 持仓比例，增加 ETH 配置\", \"risk_level\": \"MEDIUM\"}, \"report_changes\": [{\"coin\": \"BTC\", \"current_amount\": 2.5, \"proposed_amount\": 2.2, \"reason\": \"短期鹰派信号可能对 BTC 造成压力，适度降低仓位\"}, {\"coin\": \"ETH\", \"current_amount\": 15.0, \"proposed_amount\": 18.0, \"reason\": \"Layer2 活跃度提升，ETH 基本面向好，建议增持\"}], \"report_news\": [1, 2, 3]}' -ErrorAction Stop; Write-Host $response.Content } catch { $_.Exception.Response.GetResponseStream().Seek(0, [System.IO.SeekOrigin]::Begin); $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream()); Write-Host $reader.ReadToEnd(); $reader.Close(); }"

echo.

echo 测试2: 重复插入相同report_id (应返回400错误)
powershell -Command "try { $response = Invoke-WebRequest -Uri '%API_BASE_URL%/batch-insert' -Method POST -ContentType 'application/json' -Body '{\"report\": {\"id\": \"R001\", \"generated_at\": \"2024-12-18 12:00:00\", \"status\": \"PENDING\", \"ai_judgment\": \"重复测试\", \"risk_level\": \"HIGH\"}, \"report_changes\": [{\"coin\": \"BTC\", \"current_amount\": 2.5, \"proposed_amount\": 2.2, \"reason\": \"重复测试\"}], \"report_news\": [1]}' -ErrorAction Stop; Write-Host $response.Content } catch { $_.Exception.Response.GetResponseStream().Seek(0, [System.IO.SeekOrigin]::Begin); $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream()); Write-Host $reader.ReadToEnd(); $reader.Close(); }"

echo.

echo 测试3: 非法状态值 (应返回400错误)
powershell -Command "try { $response = Invoke-WebRequest -Uri '%API_BASE_URL%/batch-insert' -Method POST -ContentType 'application/json' -Body '{\"report\": {\"id\": \"R002\", \"generated_at\": \"2024-12-18 11:00:00\", \"status\": \"INVALID\", \"ai_judgment\": \"测试非法状态\", \"risk_level\": \"MEDIUM\"}, \"report_changes\": [{\"coin\": \"BTC\", \"current_amount\": 2.5, \"proposed_amount\": 2.2, \"reason\": \"测试非法状态\"}], \"report_news\": [1]}' -ErrorAction Stop; Write-Host $response.Content } catch { $_.Exception.Response.GetResponseStream().Seek(0, [System.IO.SeekOrigin]::Begin); $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream()); Write-Host $reader.ReadToEnd(); $reader.Close(); }"

echo.

echo 测试4: 非法风险等级 (应返回400错误)
powershell -Command "try { $response = Invoke-WebRequest -Uri '%API_BASE_URL%/batch-insert' -Method POST -ContentType 'application/json' -Body '{\"report\": {\"id\": \"R003\", \"generated_at\": \"2024-12-18 11:00:00\", \"status\": \"PENDING\", \"ai_judgment\": \"测试非法风险等级\", \"risk_level\": \"VERY_HIGH\"}, \"report_changes\": [{\"coin\": \"BTC\", \"current_amount\": 2.5, \"proposed_amount\": 2.2, \"reason\": \"测试非法风险等级\"}], \"report_news\": [1]}' -ErrorAction Stop; Write-Host $response.Content } catch { $_.Exception.Response.GetResponseStream().Seek(0, [System.IO.SeekOrigin]::Begin); $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream()); Write-Host $reader.ReadToEnd(); $reader.Close(); }"

echo.

echo 测试5: current_amount为0 (应返回400错误)
powershell -Command "try { $response = Invoke-WebRequest -Uri '%API_BASE_URL%/batch-insert' -Method POST -ContentType 'application/json' -Body '{\"report\": {\"id\": \"R004\", \"generated_at\": \"2024-12-18 11:00:00\", \"status\": \"PENDING\", \"ai_judgment\": \"测试除零错误\", \"risk_level\": \"MEDIUM\"}, \"report_changes\": [{\"coin\": \"BTC\", \"current_amount\": 0, \"proposed_amount\": 2.2, \"reason\": \"测试除零错误\"}], \"report_news\": [1]}' -ErrorAction Stop; Write-Host $response.Content } catch { $_.Exception.Response.GetResponseStream().Seek(0, [System.IO.SeekOrigin]::Begin); $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream()); Write-Host $reader.ReadToEnd(); $reader.Close(); }"

echo.

echo 测试6: 检查change_pct计算是否正确
echo BTC: (2.2-2.5)/2.5*100 = -12.0%%
echo ETH: (18-15)/15*100 = 20.0%%
powershell -Command "try { $response = Invoke-WebRequest -Uri '%API_BASE_URL%/batch-insert' -Method POST -ContentType 'application/json' -Body '{\"report\": {\"id\": \"R999\", \"generated_at\": \"2024-12-18 11:00:00\", \"status\": \"PENDING\", \"ai_judgment\": \"检查百分比计算\", \"risk_level\": \"MEDIUM\"}, \"report_changes\": [{\"coin\": \"BTC\", \"current_amount\": 2.5, \"proposed_amount\": 2.2, \"reason\": \"应计算为 -12.0%%\"}, {\"coin\": \"ETH\", \"current_amount\": 15.0, \"proposed_amount\": 18.0, \"reason\": \"应计算为 20.0%%\"}], \"report_news\": [1, 2]}' -ErrorAction Stop; Write-Host $response.Content } catch { $_.Exception.Response.GetResponseStream().Seek(0, [System.IO.SeekOrigin]::Begin); $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream()); Write-Host $reader.ReadToEnd(); $reader.Close(); }"