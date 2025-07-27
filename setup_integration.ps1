# 学生管理系统与QA系统整合安装脚本
# 请在PowerShell中以管理员权限运行此脚本

Write-Host "=== 学生管理系统与QA系统整合安装 ===" -ForegroundColor Green

# 设置路径
$StudentProjectPath = "D:\AugmentProjects\StudentManagement"
$TestsPath = "$StudentProjectPath\tests"
$QAProjectPath = "D:\AugmentProjects\QAManagement"

# 检查项目路径
if (-not (Test-Path $StudentProjectPath)) {
    Write-Host "错误: 学生管理系统项目路径不存在: $StudentProjectPath" -ForegroundColor Red
    exit 1
}

if (-not (Test-Path $QAProjectPath)) {
    Write-Host "错误: QA管理系统项目路径不存在: $QAProjectPath" -ForegroundColor Red
    exit 1
}

Write-Host "1. 检查Python环境..." -ForegroundColor Yellow
try {
    $pythonVersion = python --version 2>&1
    Write-Host "Python版本: $pythonVersion" -ForegroundColor Green
} catch {
    Write-Host "错误: Python未安装或不在PATH中" -ForegroundColor Red
    exit 1
}

Write-Host "2. 安装学生管理系统测试依赖..." -ForegroundColor Yellow
Set-Location $TestsPath

# 更新requirements.txt
$newRequirements = @"
pytest==7.4.3
pytest-bdd==7.0.0
playwright==1.40.0
pytest-html==3.2.0
pytest-json-report==1.5.0
allure-pytest==2.13.2
python-dotenv==1.0.0
requests==2.31.0
"@

$newRequirements | Out-File -FilePath "$TestsPath\requirements_qa.txt" -Encoding UTF8
Write-Host "已创建 requirements_qa.txt" -ForegroundColor Green

# 安装依赖
Write-Host "安装Python依赖包..." -ForegroundColor Yellow
pip install -r requirements_qa.txt

# 安装Playwright浏览器
Write-Host "安装Playwright浏览器..." -ForegroundColor Yellow
playwright install

Write-Host "3. 复制集成文件..." -ForegroundColor Yellow

# 创建utils目录
$utilsPath = "$TestsPath\utils"
if (-not (Test-Path $utilsPath)) {
    New-Item -ItemType Directory -Path $utilsPath -Force
    Write-Host "已创建utils目录" -ForegroundColor Green
}

# 复制集成文件
Copy-Item "$QAProjectPath\student_management_integration.py" "$utilsPath\qa_integration.py" -Force
Copy-Item "$QAProjectPath\enhanced_conftest.py" "$TestsPath\conftest.py" -Force
Copy-Item "$QAProjectPath\qa_execution_script.py" "$TestsPath\qa_execution.py" -Force

Write-Host "已复制集成文件" -ForegroundColor Green

Write-Host "4. 创建配置文件..." -ForegroundColor Yellow

# 创建.env文件
$envContent = @"
# 学生管理系统配置
BASE_URL=http://localhost:3001
BROWSER=chromium
HEADLESS=false
SLOW_MO=0
RECORD_VIDEO=false

# QA系统集成配置
QA_SYSTEM_API=http://localhost:8000/api/v1
EXECUTION_ID=

# 测试配置
TEST_ENVIRONMENT=test
"@

$envContent | Out-File -FilePath "$TestsPath\.env" -Encoding UTF8
Write-Host "已创建.env配置文件" -ForegroundColor Green

Write-Host "5. 创建执行脚本..." -ForegroundColor Yellow

# 创建快速执行脚本
$quickRunScript = @"
# 快速执行学生管理系统测试
param(
    [string]`$Browser = "chromium",
    [switch]`$Headless,
    [string]`$Tags = "",
    [int]`$ExecutionId = 0
)

`$env:BROWSER = `$Browser
`$env:HEADLESS = if (`$Headless) { "true" } else { "false" }
`$env:EXECUTION_ID = if (`$ExecutionId -gt 0) { `$ExecutionId.ToString() } else { "" }

Write-Host "执行学生管理系统测试..." -ForegroundColor Green
Write-Host "浏览器: `$Browser" -ForegroundColor Yellow
Write-Host "无头模式: `$(`$env:HEADLESS)" -ForegroundColor Yellow

if (`$Tags) {
    pytest step_definitions\ -v -m `$Tags --html=reports/test_report.html --self-contained-html
} else {
    pytest step_definitions\ -v --html=reports/test_report.html --self-contained-html
}
"@

$quickRunScript | Out-File -FilePath "$TestsPath\run_qa_tests.ps1" -Encoding UTF8
Write-Host "已创建快速执行脚本: run_qa_tests.ps1" -ForegroundColor Green

Write-Host "6. 测试集成..." -ForegroundColor Yellow

# 测试基本功能
Write-Host "测试Python导入..." -ForegroundColor Yellow
python -c "import pytest, playwright, requests; print('所有依赖包导入成功')"

if ($LASTEXITCODE -eq 0) {
    Write-Host "依赖包测试通过" -ForegroundColor Green
} else {
    Write-Host "依赖包测试失败" -ForegroundColor Red
}

Write-Host "7. 启动QA系统后端..." -ForegroundColor Yellow
Write-Host "请在新的PowerShell窗口中执行以下命令启动QA系统:" -ForegroundColor Cyan
Write-Host "cd $QAProjectPath\backend" -ForegroundColor White
Write-Host "python -m app.main" -ForegroundColor White

Write-Host "`n=== 整合完成 ===" -ForegroundColor Green
Write-Host "现在你可以:" -ForegroundColor Yellow
Write-Host "1. 启动学生管理系统 (http://localhost:3001)" -ForegroundColor White
Write-Host "2. 启动QA管理系统后端 (http://localhost:8000)" -ForegroundColor White
Write-Host "3. 启动QA管理系统前端 (http://localhost:3000)" -ForegroundColor White
Write-Host "4. 在QA系统中创建测试用例并执行" -ForegroundColor White
Write-Host "`n快速测试命令:" -ForegroundColor Yellow
Write-Host "cd $TestsPath" -ForegroundColor White
Write-Host ".\run_qa_tests.ps1 -Browser chromium" -ForegroundColor White
Write-Host ".\run_qa_tests.ps1 -Browser chromium -Headless -Tags smoke" -ForegroundColor White

Write-Host "`n集成文件位置:" -ForegroundColor Yellow
Write-Host "- 配置文件: $TestsPath\.env" -ForegroundColor White
Write-Host "- 集成助手: $TestsPath\utils\qa_integration.py" -ForegroundColor White
Write-Host "- 执行脚本: $TestsPath\qa_execution.py" -ForegroundColor White
Write-Host "- 快速运行: $TestsPath\run_qa_tests.ps1" -ForegroundColor White
