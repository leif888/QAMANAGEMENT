// Monaco Editor configuration for Gherkin language support

export const setupGherkinLanguage = () => {
  if (typeof window !== 'undefined' && (window as any).monaco) {
    const monaco = (window as any).monaco;
    
    // Register Gherkin language
    monaco.languages.register({ id: 'gherkin' });
    
    // Define Gherkin syntax highlighting
    monaco.languages.setMonarchTokensProvider('gherkin', {
      keywords: [
        'Feature', 'Scenario', 'Scenario Outline', 'Background', 'Examples',
        'Given', 'When', 'Then', 'And', 'But'
      ],
      
      tokenizer: {
        root: [
          // Keywords at the beginning of lines
          [/^(Feature|Scenario|Scenario Outline|Background|Examples)(:.*)?$/, 'keyword.feature'],
          [/^[ \t]*(Given|When|Then|And|But)/, 'keyword.step'],
          
          // Tags
          [/^[ \t]*@\w+/, 'tag'],
          
          // Comments
          [/^[ \t]*#.*$/, 'comment'],
          
          // Table separators
          [/\|/, 'table.separator'],
          
          // Strings in quotes
          [/"([^"\\]|\\.)*$/, 'string.invalid'],  // non-terminated string
          [/"/, 'string', '@string_double'],
          [/'([^'\\]|\\.)*$/, 'string.invalid'],  // non-terminated string
          [/'/, 'string', '@string_single'],
          
          // Variables in angle brackets
          [/<[^>]+>/, 'variable'],
          
          // Numbers
          [/\d+/, 'number'],
          
          // Whitespace
          [/[ \t\r\n]+/, ''],
        ],
        
        string_double: [
          [/[^\\"]+/, 'string'],
          [/\\./, 'string.escape'],
          [/"/, 'string', '@pop']
        ],
        
        string_single: [
          [/[^\\']+/, 'string'],
          [/\\./, 'string.escape'],
          [/'/, 'string', '@pop']
        ]
      }
    });

    // Define Gherkin theme with better colors
    monaco.editor.defineTheme('gherkin-theme', {
      base: 'vs',
      inherit: true,
      rules: [
        { token: 'keyword.feature', foreground: '0000FF', fontStyle: 'bold' },
        { token: 'keyword.step', foreground: '008000', fontStyle: 'bold' },
        { token: 'tag', foreground: 'FF6600', fontStyle: 'bold' },
        { token: 'comment', foreground: '808080', fontStyle: 'italic' },
        { token: 'string', foreground: 'A31515' },
        { token: 'string.escape', foreground: 'FF0000' },
        { token: 'variable', foreground: 'FF0000', fontStyle: 'italic' },
        { token: 'table.separator', foreground: '800080', fontStyle: 'bold' },
        { token: 'number', foreground: '098658' },
      ],
      colors: {
        'editor.background': '#FFFFFF',
        'editor.foreground': '#000000',
        'editorLineNumber.foreground': '#999999',
        'editor.selectionBackground': '#ADD6FF',
        'editor.inactiveSelectionBackground': '#E5EBF1',
      }
    });

    // Define dark theme for Gherkin
    monaco.editor.defineTheme('gherkin-dark', {
      base: 'vs-dark',
      inherit: true,
      rules: [
        { token: 'keyword.feature', foreground: '569CD6', fontStyle: 'bold' },
        { token: 'keyword.step', foreground: '4EC9B0', fontStyle: 'bold' },
        { token: 'tag', foreground: 'DCDCAA', fontStyle: 'bold' },
        { token: 'comment', foreground: '6A9955', fontStyle: 'italic' },
        { token: 'string', foreground: 'CE9178' },
        { token: 'string.escape', foreground: 'D7BA7D' },
        { token: 'variable', foreground: '9CDCFE', fontStyle: 'italic' },
        { token: 'table.separator', foreground: 'C586C0', fontStyle: 'bold' },
        { token: 'number', foreground: 'B5CEA8' },
      ],
      colors: {}
    });

    // Configure language features
    monaco.languages.setLanguageConfiguration('gherkin', {
      comments: {
        lineComment: '#'
      },
      brackets: [
        ['<', '>'],
        ['"', '"'],
        ["'", "'"]
      ],
      autoClosingPairs: [
        { open: '"', close: '"' },
        { open: "'", close: "'" },
        { open: '<', close: '>' }
      ],
      surroundingPairs: [
        { open: '"', close: '"' },
        { open: "'", close: "'" },
        { open: '<', close: '>' }
      ]
    });

    // Add completion provider for Gherkin keywords
    monaco.languages.registerCompletionItemProvider('gherkin', {
      provideCompletionItems: (model: any, position: any) => {
        const suggestions = [
          {
            label: 'Feature',
            kind: monaco.languages.CompletionItemKind.Keyword,
            insertText: 'Feature: ',
            documentation: 'Defines a feature'
          },
          {
            label: 'Scenario',
            kind: monaco.languages.CompletionItemKind.Keyword,
            insertText: 'Scenario: ',
            documentation: 'Defines a scenario'
          },
          {
            label: 'Scenario Outline',
            kind: monaco.languages.CompletionItemKind.Keyword,
            insertText: 'Scenario Outline: ',
            documentation: 'Defines a scenario outline with examples'
          },
          {
            label: 'Background',
            kind: monaco.languages.CompletionItemKind.Keyword,
            insertText: 'Background:',
            documentation: 'Defines background steps'
          },
          {
            label: 'Given',
            kind: monaco.languages.CompletionItemKind.Keyword,
            insertText: 'Given ',
            documentation: 'Defines a precondition'
          },
          {
            label: 'When',
            kind: monaco.languages.CompletionItemKind.Keyword,
            insertText: 'When ',
            documentation: 'Defines an action'
          },
          {
            label: 'Then',
            kind: monaco.languages.CompletionItemKind.Keyword,
            insertText: 'Then ',
            documentation: 'Defines an expected outcome'
          },
          {
            label: 'And',
            kind: monaco.languages.CompletionItemKind.Keyword,
            insertText: 'And ',
            documentation: 'Continues the previous step type'
          },
          {
            label: 'But',
            kind: monaco.languages.CompletionItemKind.Keyword,
            insertText: 'But ',
            documentation: 'Continues the previous step type (negative)'
          },
          {
            label: 'Examples',
            kind: monaco.languages.CompletionItemKind.Keyword,
            insertText: 'Examples:\n  | parameter |\n  | value     |',
            documentation: 'Defines examples for scenario outline'
          }
        ];

        return { suggestions };
      }
    });

    console.log('Gherkin language support initialized');
  }
};

// Initialize when Monaco is loaded
export const initializeMonaco = () => {
  if (typeof window !== 'undefined') {
    // Wait for Monaco to be available
    const checkMonaco = () => {
      if ((window as any).monaco) {
        setupGherkinLanguage();
      } else {
        setTimeout(checkMonaco, 100);
      }
    };
    checkMonaco();
  }
};
