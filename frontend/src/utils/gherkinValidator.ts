/**
 * Gherkin语法验证工具
 */

export interface ValidationError {
  line: number
  message: string
  severity: 'error' | 'warning' | 'info'
}

export interface ValidationResult {
  isValid: boolean
  errors: ValidationError[]
  warnings: ValidationError[]
}

export class GherkinValidator {
  private static readonly KEYWORDS = [
    'Feature', 'Background', 'Scenario', 'Scenario Outline', 'Examples',
    'Given', 'When', 'Then', 'And', 'But'
  ]

  private static readonly STEP_KEYWORDS = ['Given', 'When', 'Then', 'And', 'But']

  /**
   * 验证Gherkin语法
   */
  static validate(content: string): ValidationResult {
    const lines = content.split('\n')
    const errors: ValidationError[] = []
    const warnings: ValidationError[] = []

    let hasFeature = false
    let hasScenario = false
    let currentScenario: string | null = null
    let scenarioSteps: string[] = []
    let inExamples = false

    lines.forEach((line, index) => {
      const lineNumber = index + 1
      const trimmedLine = line.trim()

      // 跳过空行和注释
      if (!trimmedLine || trimmedLine.startsWith('#')) {
        return
      }

      // 检查Feature
      if (trimmedLine.startsWith('Feature:')) {
        if (hasFeature) {
          errors.push({
            line: lineNumber,
            message: '一个文件只能包含一个Feature',
            severity: 'error'
          })
        }
        hasFeature = true
        
        if (trimmedLine === 'Feature:') {
          errors.push({
            line: lineNumber,
            message: 'Feature后面必须有描述',
            severity: 'error'
          })
        }
        return
      }

      // 检查Scenario
      if (trimmedLine.startsWith('Scenario:') || trimmedLine.startsWith('Scenario Outline:')) {
        if (!hasFeature) {
          errors.push({
            line: lineNumber,
            message: 'Scenario必须在Feature之后定义',
            severity: 'error'
          })
        }

        // 检查上一个场景的步骤
        if (currentScenario && scenarioSteps.length === 0) {
          warnings.push({
            line: lineNumber - 1,
            message: `场景 "${currentScenario}" 没有定义任何步骤`,
            severity: 'warning'
          })
        }

        hasScenario = true
        currentScenario = trimmedLine.substring(trimmedLine.indexOf(':') + 1).trim()
        scenarioSteps = []
        inExamples = false

        if (!currentScenario) {
          errors.push({
            line: lineNumber,
            message: 'Scenario后面必须有描述',
            severity: 'error'
          })
        }
        return
      }

      // 检查Examples
      if (trimmedLine.startsWith('Examples:')) {
        if (!currentScenario) {
          errors.push({
            line: lineNumber,
            message: 'Examples必须在Scenario Outline之后定义',
            severity: 'error'
          })
        }
        inExamples = true
        return
      }

      // 检查步骤
      const stepKeyword = this.STEP_KEYWORDS.find(keyword => 
        trimmedLine.startsWith(keyword + ' ')
      )

      if (stepKeyword) {
        if (!hasScenario) {
          errors.push({
            line: lineNumber,
            message: '测试步骤必须在Scenario之后定义',
            severity: 'error'
          })
        }

        scenarioSteps.push(stepKeyword)

        // 检查步骤顺序
        this.validateStepOrder(scenarioSteps, lineNumber, stepKeyword, warnings)

        // 检查步骤内容
        const stepContent = trimmedLine.substring(stepKeyword.length + 1).trim()
        if (!stepContent) {
          errors.push({
            line: lineNumber,
            message: `${stepKeyword}后面必须有步骤描述`,
            severity: 'error'
          })
        }
        return
      }

      // 检查表格数据
      if (trimmedLine.startsWith('|') && trimmedLine.endsWith('|')) {
        if (!inExamples && !this.isInDataTable(lines, index)) {
          warnings.push({
            line: lineNumber,
            message: '表格数据应该在Examples或步骤之后使用',
            severity: 'warning'
          })
        }
        return
      }

      // 检查标签
      if (trimmedLine.startsWith('@')) {
        // 标签是合法的，不需要特殊处理
        return
      }

      // 检查未知关键字
      const words = trimmedLine.split(' ')
      if (words.length > 0) {
        const firstWord = words[0]
        if (firstWord.endsWith(':') && !this.KEYWORDS.includes(firstWord.slice(0, -1))) {
          warnings.push({
            line: lineNumber,
            message: `未知的关键字: ${firstWord}`,
            severity: 'warning'
          })
        }
      }
    })

    // 最终检查
    if (!hasFeature) {
      errors.push({
        line: 1,
        message: '缺少Feature定义',
        severity: 'error'
      })
    }

    if (!hasScenario) {
      warnings.push({
        line: 1,
        message: '建议至少定义一个Scenario',
        severity: 'warning'
      })
    }

    // 检查最后一个场景
    if (currentScenario && scenarioSteps.length === 0) {
      warnings.push({
        line: lines.length,
        message: `场景 "${currentScenario}" 没有定义任何步骤`,
        severity: 'warning'
      })
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    }
  }

  /**
   * 验证步骤顺序
   */
  private static validateStepOrder(
    steps: string[], 
    lineNumber: number, 
    currentStep: string, 
    warnings: ValidationError[]
  ) {
    if (steps.length < 2) return

    const lastStep = steps[steps.length - 2]
    
    // Given应该在When之前，When应该在Then之前
    if (currentStep === 'Given' && (lastStep === 'When' || lastStep === 'Then')) {
      warnings.push({
        line: lineNumber,
        message: 'Given步骤通常应该在When和Then之前',
        severity: 'warning'
      })
    }

    if (currentStep === 'When' && lastStep === 'Then') {
      warnings.push({
        line: lineNumber,
        message: 'When步骤通常应该在Then之前',
        severity: 'warning'
      })
    }
  }

  /**
   * 检查是否在数据表格中
   */
  private static isInDataTable(lines: string[], currentIndex: number): boolean {
    // 检查前面几行是否有步骤或Examples
    for (let i = currentIndex - 1; i >= 0; i--) {
      const line = lines[i].trim()
      if (!line || line.startsWith('#')) continue
      
      if (line.startsWith('Examples:')) return true
      
      const hasStepKeyword = this.STEP_KEYWORDS.some(keyword => 
        line.startsWith(keyword + ' ')
      )
      if (hasStepKeyword) return true
      
      if (line.startsWith('Scenario')) break
    }
    
    return false
  }

  /**
   * 格式化验证结果为可读文本
   */
  static formatValidationResult(result: ValidationResult): string {
    const messages: string[] = []

    if (result.isValid) {
      messages.push('✅ Gherkin语法验证通过')
    } else {
      messages.push('❌ Gherkin语法验证失败')
    }

    result.errors.forEach(error => {
      messages.push(`第${error.line}行 - 错误: ${error.message}`)
    })

    result.warnings.forEach(warning => {
      messages.push(`第${warning.line}行 - 警告: ${warning.message}`)
    })

    return messages.join('\n')
  }
}
