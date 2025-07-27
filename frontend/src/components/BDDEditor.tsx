import React, { useState, useRef, useEffect } from 'react'
import { Card, Button, Space, message, Badge } from 'antd'
import { PlayCircleOutlined, SaveOutlined, UndoOutlined, RedoOutlined, BugOutlined } from '@ant-design/icons'
import Editor from '@monaco-editor/react'
import { GherkinValidator, ValidationResult } from '../utils/gherkinValidator'

interface BDDEditorProps {
  value?: string
  onChange?: (value: string) => void
  height?: number
  readOnly?: boolean
}

const BDDEditor: React.FC<BDDEditorProps> = ({
  value = '',
  onChange,
  height = 400,
  readOnly = false
}) => {
  const [editorValue, setEditorValue] = useState(value)
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null)
  const editorRef = useRef<any>(null)

  // Gherkin语法高亮配置
  const gherkinLanguageConfig = {
    id: 'gherkin',
    extensions: ['.feature'],
    aliases: ['Gherkin', 'gherkin'],
    mimetypes: ['text/x-gherkin']
  }

  const gherkinTokensProvider = {
    tokenizer: {
      root: [
        // 关键字
        [/^(Feature|Background|Scenario|Scenario Outline|Examples|Given|When|Then|And|But)/, 'keyword'],
        // 标签
        [/@[a-zA-Z_][a-zA-Z0-9_]*/, 'tag'],
        // 注释
        [/#.*$/, 'comment'],
        // 字符串
        [/"([^"\\]|\\.)*$/, 'string.invalid'],
        [/"/, 'string', '@string'],
        // 参数
        [/<[^>]+>/, 'variable'],
        // 数字
        [/\d+/, 'number'],
        // 表格分隔符
        [/\|/, 'delimiter'],
      ],
      string: [
        [/[^\\"]+/, 'string'],
        [/\\./, 'string.escape'],
        [/"/, 'string', '@pop']
      ]
    }
  }

  const gherkinTheme = {
    base: 'vs' as const,
    inherit: true,
    rules: [
      { token: 'keyword', foreground: '0000FF', fontStyle: 'bold' },
      { token: 'tag', foreground: '008000' },
      { token: 'comment', foreground: '808080', fontStyle: 'italic' },
      { token: 'string', foreground: 'A31515' },
      { token: 'variable', foreground: 'FF6600' },
      { token: 'number', foreground: '098658' },
      { token: 'delimiter', foreground: '000000', fontStyle: 'bold' }
    ],
    colors: {}
  }

  const handleEditorDidMount = (editor: any, monaco: any) => {
    editorRef.current = editor

    // 注册Gherkin语言
    monaco.languages.register(gherkinLanguageConfig)
    monaco.languages.setMonarchTokensProvider('gherkin', gherkinTokensProvider)
    monaco.editor.defineTheme('gherkin-theme', gherkinTheme)
    monaco.editor.setTheme('gherkin-theme')

    // 自动补全配置
    monaco.languages.registerCompletionItemProvider('gherkin', {
      provideCompletionItems: (model: any, position: any) => {
        const suggestions = [
          {
            label: 'Feature',
            kind: monaco.languages.CompletionItemKind.Keyword,
            insertText: 'Feature: ${1:Feature name}\n  ${2:Feature description}\n\n',
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            documentation: 'Define feature functionality'
          },
          {
            label: 'Scenario',
            kind: monaco.languages.CompletionItemKind.Keyword,
            insertText: 'Scenario: ${1:Scenario name}\n  Given ${2:precondition}\n  When ${3:action}\n  Then ${4:expected result}',
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            documentation: 'Define test scenario'
          },
          {
            label: 'Given',
            kind: monaco.languages.CompletionItemKind.Keyword,
            insertText: 'Given ${1:precondition}',
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            documentation: 'Given precondition'
          },
          {
            label: 'When',
            kind: monaco.languages.CompletionItemKind.Keyword,
            insertText: 'When ${1:action}',
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            documentation: 'When action is performed'
          },
          {
            label: 'Then',
            kind: monaco.languages.CompletionItemKind.Keyword,
            insertText: 'Then ${1:expected result}',
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            documentation: 'Then expected result'
          },
          {
            label: 'And',
            kind: monaco.languages.CompletionItemKind.Keyword,
            insertText: 'And ${1:additional condition}',
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            documentation: 'And additional condition'
          },
          {
            label: 'But',
            kind: monaco.languages.CompletionItemKind.Keyword,
            insertText: 'But ${1:exception}',
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            documentation: 'But exception'
          }
        ]
        return { suggestions }
      }
    })
  }

  const handleEditorChange = (newValue: string | undefined) => {
    const value = newValue || ''
    setEditorValue(value)
    onChange?.(value)

    // Real-time syntax validation
    const result = GherkinValidator.validate(value)
    setValidationResult(result)
  }

  const handleSave = () => {
    message.success('BDD test case saved')
  }

  const handleValidate = () => {
    const result = GherkinValidator.validate(editorValue)
    setValidationResult(result)

    if (result.isValid) {
      message.success('BDD syntax validation passed')
    } else {
      const errorMessage = GherkinValidator.formatValidationResult(result)
      message.error({
        content: (
          <div style={{ whiteSpace: 'pre-line' }}>
            {errorMessage}
          </div>
        ),
        duration: 8
      })
    }
  }

  const insertTemplate = () => {
    const template = `Feature: Feature Name
  As a user
  I want to implement some functionality
  So that I can get some value

Scenario: Scenario Name
  Given I am on some page
  When I perform some action
  Then I should see the expected result`

    if (editorRef.current) {
      editorRef.current.setValue(template)
      setEditorValue(template)
      onChange?.(template)
    }
  }

  useEffect(() => {
    setEditorValue(value)
    // Initial validation
    if (value) {
      const result = GherkinValidator.validate(value)
      setValidationResult(result)
    }
  }, [value])

  return (
    <Card
      title={
        <Space>
          BDD Test Case Editor
          {validationResult && (
            <Badge
              count={validationResult.errors.length}
              style={{ backgroundColor: '#f5222d' }}
            />
          )}
          {validationResult && validationResult.warnings.length > 0 && (
            <Badge
              count={validationResult.warnings.length}
              style={{ backgroundColor: '#faad14' }}
            />
          )}
        </Space>
      }
      extra={
        <Space>
          <Button icon={<UndoOutlined />} size="small" onClick={() => editorRef.current?.trigger('keyboard', 'undo', null)}>
            Undo
          </Button>
          <Button icon={<RedoOutlined />} size="small" onClick={() => editorRef.current?.trigger('keyboard', 'redo', null)}>
            Redo
          </Button>
          <Button onClick={insertTemplate} size="small">
            Insert Template
          </Button>
          <Button
            icon={<PlayCircleOutlined />}
            onClick={handleValidate}
            size="small"
            type={validationResult?.isValid === false ? 'primary' : 'default'}
            danger={validationResult?.isValid === false}
          >
            Validate Syntax
          </Button>
          <Button type="primary" icon={<SaveOutlined />} onClick={handleSave} size="small">
            Save
          </Button>
        </Space>
      }
    >
      <Editor
        height={height}
        language="gherkin"
        value={editorValue}
        onChange={handleEditorChange}
        onMount={handleEditorDidMount}
        options={{
          readOnly,
          minimap: { enabled: false },
          fontSize: 14,
          lineNumbers: 'on',
          roundedSelection: false,
          scrollBeyondLastLine: false,
          automaticLayout: true,
          wordWrap: 'on',
          folding: true,
          lineDecorationsWidth: 10,
          lineNumbersMinChars: 3,
          glyphMargin: false,
          contextmenu: true,
          selectOnLineNumbers: true,
          matchBrackets: 'always',
          theme: 'gherkin-theme'
        }}
      />
    </Card>
  )
}

export default BDDEditor
