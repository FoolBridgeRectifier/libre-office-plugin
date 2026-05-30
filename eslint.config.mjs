import path from 'node:path';
import { readdirSync } from 'node:fs';
import js from '@eslint/js';
import tsParser from 'typescript-eslint';
import importPlugin from 'eslint-plugin-import';
import reactPlugin from 'eslint-plugin-react';
import reactHooksPlugin from 'eslint-plugin-react-hooks';
import prettierConfig from 'eslint-config-prettier';

const strictStructurePlugin = {
  rules: {
    'types-only-in-interfaces-file': {
      meta: {
        type: 'problem',
        docs: {
          description: 'Allow type/interface/enum declarations only in interfaces.ts files.',
        },
        schema: [],
      },
      create(context) {
        const currentFilePath = context.filename.replace(/\\/g, '/');
        const isInterfacesFile = currentFilePath.endsWith('/interfaces.ts');

        if (isInterfacesFile) {
          return {};
        }

        const reportDeclaration = (node, declarationName) => {
          context.report({
            node,
            message: `Only interfaces.ts files can declare ${declarationName}.`,
          });
        };

        return {
          TSInterfaceDeclaration(node) {
            reportDeclaration(node, 'interfaces');
          },
          TSTypeAliasDeclaration(node) {
            reportDeclaration(node, 'type aliases');
          },
          TSEnumDeclaration(node) {
            reportDeclaration(node, 'enums');
          },
        };
      },
    },

    'module-consts-only-in-constants-file': {
      meta: {
        type: 'problem',
        docs: {
          description: 'Disallow non-function top-level const declarations outside constants.ts.',
        },
        schema: [],
      },
      create(context) {
        const currentFilePath = context.filename.replace(/\\/g, '/');
        const isConstantsFile = currentFilePath.endsWith('/constants.ts');

        if (isConstantsFile) {
          return {};
        }

        const isFunctionInitializer = (initializerNode) =>
          initializerNode?.type === 'ArrowFunctionExpression' ||
          initializerNode?.type === 'FunctionExpression';

        return {
          Program(programNode) {
            for (const topLevelNode of programNode.body) {
              if (topLevelNode.type !== 'VariableDeclaration' || topLevelNode.kind !== 'const') {
                continue;
              }

              for (const declaratorNode of topLevelNode.declarations) {
                if (!isFunctionInitializer(declaratorNode.init)) {
                  context.report({
                    node: declaratorNode,
                    message:
                      'Top-level const declarations outside constants.ts must initialize with a function.',
                  });
                }
              }
            }
          },
        };
      },
    },

    'no-double-cast': {
      meta: {
        type: 'problem',
        docs: {
          description:
            'Disallow double-casting via "as unknown as T". Use proper types or explicit type guards instead.',
        },
        schema: [],
      },
      create(context) {
        return {
          // Matches: expr as unknown as T  (TSAsExpression whose expression is also a TSAsExpression to unknown)
          TSAsExpression(node) {
            const innerExpression = node.expression;

            if (innerExpression.type !== 'TSAsExpression') {
              return;
            }

            const innerType = innerExpression.typeAnnotation;

            if (
              innerType.type === 'TSUnknownKeyword' ||
              (innerType.type === 'TSTypeReference' && innerType.typeName?.name === 'unknown')
            ) {
              context.report({
                node,
                message:
                  'Double-casting via "as unknown as T" bypasses type safety. Use a proper type or type guard instead.',
              });
            }
          },
        };
      },
    },

    'svg-only-in-assets': {
      meta: {
        type: 'problem',
        docs: {
          description: 'SVG files and SVG component definitions must live only inside src/assets/.',
        },
        schema: [],
      },
      create(context) {
        const currentFilePath = context.filename.replace(/\\/g, '/');
        const isInsideAssetsFolder = currentFilePath.includes('/src/assets/');

        // Allow SVG files and TSX with SVG components inside assets folder
        if (isInsideAssetsFolder) {
          return {};
        }

        // Skip test files - they may contain inline SVG for mocking purposes
        const isTestFile =
          currentFilePath.endsWith('.test.tsx') || currentFilePath.endsWith('.test.ts');

        if (isTestFile) {
          return {};
        }

        const isSvgFile = currentFilePath.endsWith('.svg');

        // Report SVG files outside assets
        if (isSvgFile) {
          return {
            Program(programNode) {
              context.report({
                node: programNode,
                message: 'SVG files must be placed inside src/assets/.',
              });
            },
          };
        }

        // For TSX files outside assets, check for JSX SVG elements
        const isTsxFile = currentFilePath.endsWith('.tsx');

        if (!isTsxFile) {
          return {};
        }

        return {
          JSXOpeningElement(node) {
            const elementName = node.name?.name;

            // Check for SVG element or common SVG child elements
            const svgElementNames = new Set([
              'svg',
              'rect',
              'circle',
              'ellipse',
              'line',
              'polyline',
              'polygon',
              'path',
              'text',
              'g',
              'defs',
              'use',
              'symbol',
              'linearGradient',
              'radialGradient',
              'stop',
              'clipPath',
              'mask',
              'pattern',
              'image',
              'foreignObject',
            ]);

            if (svgElementNames.has(elementName)) {
              context.report({
                node,
                message: `SVG components (${elementName}) must be defined inside src/assets/. Move this component to the assets folder.`,
              });
            }
          },
        };
      },
    },

    'max-statement-group-lines': {
      meta: {
        type: 'layout',
        docs: {
          description: 'Require blank lines so adjacent statement groups stay short.',
        },
        schema: [
          {
            type: 'object',
            properties: {
              max: {
                type: 'integer',
                minimum: 1,
              },
            },
            additionalProperties: false,
          },
        ],
      },
      create(context) {
        const sourceCode = context.sourceCode;
        const maxGroupedLines = context.options[0]?.max ?? 4;

        const hasBlankLineBetween = (previousNode, currentNode) => {
          const firstLineBetweenNodes = previousNode.loc.end.line;
          const lastLineBetweenNodes = currentNode.loc.start.line - 2;

          if (lastLineBetweenNodes < firstLineBetweenNodes) {
            return false;
          }

          return sourceCode.lines
            .slice(firstLineBetweenNodes, lastLineBetweenNodes + 1)
            .some((lineText) => lineText.trim() === '');
        };

        const shouldIgnoreStatement = (node) =>
          node.type === 'ImportDeclaration' ||
          node.type === 'ExportNamedDeclaration' ||
          node.type === 'ExportDefaultDeclaration' ||
          node.type === 'ExportAllDeclaration';

        const getGroupedLineCount = (groupedStatements) => {
          const firstStatement = groupedStatements[0];
          const lastStatement = groupedStatements[groupedStatements.length - 1];

          return lastStatement.loc.end.line - firstStatement.loc.start.line + 1;
        };

        const reportLargeGroup = (groupedStatements) => {
          if (groupedStatements.length < 2) {
            return;
          }

          const groupedLineCount = getGroupedLineCount(groupedStatements);

          if (groupedLineCount <= maxGroupedLines) {
            return;
          }

          context.report({
            node: groupedStatements[0],
            message: `Separate this ${groupedLineCount}-line statement group with blank lines so no group exceeds ${maxGroupedLines} lines.`,
          });
        };

        const checkStatementList = (statementList) => {
          let groupedStatements = [];
          let previousStatement = null;

          for (const statement of statementList) {
            if (shouldIgnoreStatement(statement)) {
              reportLargeGroup(groupedStatements);
              groupedStatements = [];
              previousStatement = null;
              continue;
            }

            if (previousStatement && hasBlankLineBetween(previousStatement, statement)) {
              reportLargeGroup(groupedStatements);
              groupedStatements = [];
            }

            groupedStatements.push(statement);
            previousStatement = statement;
          }

          reportLargeGroup(groupedStatements);
        };

        return {
          Program(node) {
            checkStatementList(node.body);
          },
          BlockStatement(node) {
            checkStatementList(node.body);
          },
          StaticBlock(node) {
            checkStatementList(node.body);
          },
        };
      },
    },

    'tailwind-only-styles': {
      meta: {
        type: 'problem',
        docs: {
          description: 'Disallow custom CSS files and imports outside the Tailwind entry file.',
        },
        schema: [],
      },
      create(context) {
        const currentFilePath = context.filename.replace(/\\/g, '/');
        const projectRootPath = process.cwd();
        const allowedCssFilePath = 'styles.css';
        const ignoredFolderNames = new Set([
          '.git',
          '.e2e-vault',
          '.worktrees',
          'coverage',
          'dist',
          'node_modules',
        ]);

        const getRelativePath = (filePath) =>
          path.relative(projectRootPath, filePath).replace(/\\/g, '/');

        const getCssFilePaths = (folderPath) => {
          const cssFilePaths = [];

          for (const directoryEntry of readdirSync(folderPath, { withFileTypes: true })) {
            if (ignoredFolderNames.has(directoryEntry.name)) {
              continue;
            }

            const entryPath = path.join(folderPath, directoryEntry.name);

            if (directoryEntry.isDirectory()) {
              cssFilePaths.push(...getCssFilePaths(entryPath));
              continue;
            }

            if (directoryEntry.isFile() && directoryEntry.name.endsWith('.css')) {
              cssFilePaths.push(getRelativePath(entryPath));
            }
          }

          return cssFilePaths;
        };

        const isAllowedTailwindEntryImport = (sourceValue) =>
          currentFilePath.endsWith('/src/main.ts') && sourceValue === '../styles.css';

        return {
          Program(programNode) {
            if (!currentFilePath.endsWith('/src/main.ts')) {
              return;
            }

            const customCssFilePaths = getCssFilePaths(projectRootPath).filter(
              (cssFilePath) => cssFilePath !== allowedCssFilePath
            );

            if (customCssFilePaths.length === 0) {
              return;
            }

            context.report({
              node: programNode,
              message: `Only ${allowedCssFilePath} is allowed. Use Tailwind classes instead of CSS files: ${customCssFilePaths.join(', ')}.`,
            });
          },
          ImportDeclaration(node) {
            const sourceValue = node.source.value;

            if (typeof sourceValue !== 'string' || !sourceValue.endsWith('.css')) {
              return;
            }

            if (isAllowedTailwindEntryImport(sourceValue)) {
              return;
            }

            context.report({
              node,
              message:
                'Do not import CSS files. Use Tailwind classes and the shared Tailwind entry.',
            });
          },
        };
      },
    },

    'long-classname-const': {
      meta: {
        type: 'suggestion',
        docs: {
          description: 'Require long JSX className values to be assigned to a named const first.',
        },
        schema: [
          {
            type: 'object',
            properties: {
              maxLength: {
                type: 'integer',
                minimum: 1,
              },
            },
            additionalProperties: false,
          },
        ],
      },
      create(context) {
        const sourceCode = context.sourceCode;
        const maxClassNameLength = context.options[0]?.maxLength ?? 80;

        const isSeparatedClassNameReference = (expressionNode) =>
          expressionNode.type === 'Identifier' ||
          expressionNode.type === 'MemberExpression' ||
          expressionNode.type === 'ChainExpression';

        const getClassNameLength = (attributeValueNode) => {
          if (!attributeValueNode) {
            return 0;
          }

          if (attributeValueNode.type === 'Literal') {
            return typeof attributeValueNode.value === 'string'
              ? attributeValueNode.value.length
              : 0;
          }

          if (attributeValueNode.type !== 'JSXExpressionContainer') {
            return sourceCode.getText(attributeValueNode).length;
          }

          const expressionNode = attributeValueNode.expression;

          if (
            expressionNode.type === 'JSXEmptyExpression' ||
            isSeparatedClassNameReference(expressionNode)
          ) {
            return 0;
          }

          return sourceCode.getText(expressionNode).length;
        };

        return {
          JSXAttribute(node) {
            if (node.name?.name !== 'className') {
              return;
            }

            const classNameLength = getClassNameLength(node.value);

            if (classNameLength <= maxClassNameLength) {
              return;
            }

            context.report({
              node,
              message: `Move this ${classNameLength}-character className into a named const and pass that const to the component.`,
            });
          },
        };
      },
    },

    'test-case-requires-assertion': {
      meta: {
        type: 'problem',
        docs: {
          description: 'Require every Jest test case to contain an assertion.',
        },
        schema: [],
      },
      create(context) {
        const currentFilePath = context.filename.replace(/\\/g, '/');
        const isTestFile = /\.(test)\.(ts|tsx)$/.test(currentFilePath);

        if (!isTestFile) {
          return {};
        }

        const isAssertionCall = (node) => {
          if (node.type !== 'CallExpression') {
            return false;
          }

          if (node.callee.type === 'Identifier' && node.callee.name === 'expect') {
            return true;
          }

          return (
            node.callee.type === 'MemberExpression' &&
            node.callee.object.type === 'Identifier' &&
            node.callee.object.name === 'assert'
          );
        };

        const containsAssertion = (node) => {
          if (!node || typeof node !== 'object') {
            return false;
          }

          if (isAssertionCall(node)) {
            return true;
          }

          for (const [key, value] of Object.entries(node)) {
            if (key === 'parent') {
              continue;
            }

            if (Array.isArray(value) && value.some((childNode) => containsAssertion(childNode))) {
              return true;
            }

            if (!Array.isArray(value) && containsAssertion(value)) {
              return true;
            }
          }

          return false;
        };

        const isTestCaseCallee = (calleeNode) => {
          if (calleeNode.type === 'Identifier') {
            return calleeNode.name === 'test' || calleeNode.name === 'it';
          }

          if (calleeNode.type !== 'MemberExpression') {
            return false;
          }

          return isTestCaseCallee(calleeNode.object);
        };

        const getTestCallback = (node) =>
          node.arguments.find(
            (argumentNode) =>
              argumentNode.type === 'ArrowFunctionExpression' ||
              argumentNode.type === 'FunctionExpression'
          );

        return {
          CallExpression(node) {
            if (!isTestCaseCallee(node.callee)) {
              return;
            }

            const testCallback = getTestCallback(node);

            if (!testCallback || containsAssertion(testCallback.body)) {
              return;
            }

            context.report({
              node,
              message: 'Every test case must include at least one assertion.',
            });
          },
        };
      },
    },

    'no-weak-test-assertions': {
      meta: {
        type: 'problem',
        docs: {
          description:
            'Disallow weak Jest assertions such as truthiness checks and primitive toEqual.',
        },
        schema: [],
      },
      create(context) {
        const currentFilePath = context.filename.replace(/\\/g, '/');
        const isTestFile = /\.(test)\.(ts|tsx)$/.test(currentFilePath);
        const weakMatcherNames = new Set([
          'toBeTruthy',
          'toBeFalsy',
          'toBeDefined',
          'toBeUndefined',
        ]);

        if (!isTestFile) {
          return {};
        }

        const getPropertyName = (memberExpressionNode) => {
          if (memberExpressionNode.property.type === 'Identifier') {
            return memberExpressionNode.property.name;
          }

          return typeof memberExpressionNode.property.value === 'string'
            ? memberExpressionNode.property.value
            : null;
        };

        const isExpectChain = (node) => {
          if (!node) {
            return false;
          }

          if (node.type === 'CallExpression') {
            return node.callee.type === 'Identifier' && node.callee.name === 'expect';
          }

          if (node.type === 'MemberExpression') {
            return isExpectChain(node.object);
          }

          return false;
        };

        const isPrimitiveExpectedValue = (node) => {
          if (!node) {
            return false;
          }

          if (node.type === 'Literal') {
            return true;
          }

          if (node.type === 'TemplateLiteral') {
            return node.expressions.length === 0;
          }

          return node.type === 'UnaryExpression' && node.argument.type === 'Literal';
        };

        return {
          CallExpression(node) {
            if (node.callee.type !== 'MemberExpression' || !isExpectChain(node.callee.object)) {
              return;
            }

            const matcherName = getPropertyName(node.callee);

            if (weakMatcherNames.has(matcherName)) {
              context.report({
                node,
                message: `Avoid weak assertion matcher ${matcherName}. Assert the exact expected value or visible behavior instead.`,
              });
            }

            if (matcherName === 'toEqual' && isPrimitiveExpectedValue(node.arguments[0])) {
              context.report({
                node,
                message: 'Use toBe for primitive expected values instead of toEqual.',
              });
            }
          },
        };
      },
    },

    'component-test-requires-snapshot': {
      meta: {
        type: 'problem',
        docs: {
          description:
            'Require React component test files to include at least one snapshot assertion.',
        },
        schema: [],
      },
      create(context) {
        const currentFilePath = context.filename.replace(/\\/g, '/');
        const isComponentTestFile = currentFilePath.endsWith('.test.tsx');

        if (!isComponentTestFile) {
          return {};
        }

        const getPropertyName = (memberExpressionNode) => {
          if (memberExpressionNode.property.type === 'Identifier') {
            return memberExpressionNode.property.name;
          }

          return typeof memberExpressionNode.property.value === 'string'
            ? memberExpressionNode.property.value
            : null;
        };

        let hasSnapshotAssertion = false;

        return {
          CallExpression(node) {
            if (node.callee.type !== 'MemberExpression') {
              return;
            }

            const matcherName = getPropertyName(node.callee);

            if (matcherName === 'toMatchSnapshot' || matcherName === 'toMatchInlineSnapshot') {
              hasSnapshotAssertion = true;
            }
          },
          'Program:exit'(node) {
            if (hasSnapshotAssertion) {
              return;
            }

            context.report({
              node,
              message: 'Component test files must include at least one snapshot assertion.',
            });
          },
        };
      },
    },

    'strict-file-name': {
      meta: {
        type: 'problem',
        docs: {
          description: 'Require file name to match folder name or be helpers/constants/interfaces.',
        },
        schema: [],
      },
      create(context) {
        const currentFilePath = context.filename;
        const extensionName = path.extname(currentFilePath);

        if (extensionName !== '.ts' && extensionName !== '.tsx') {
          return {};
        }

        const baseNameWithoutExtension = path.basename(currentFilePath, extensionName);
        const parentFolderName = path.basename(path.dirname(currentFilePath));

        // Standard structural files are always allowed regardless of folder
        const structuralFileNames = new Set([
          'helpers',
          'constants',
          'interfaces',
          'index',
          'utils',
        ]);
        if (structuralFileNames.has(baseNameWithoutExtension)) {
          return {};
        }

        // Special infrastructure folders where multiple files per folder is intentional
        const specialFolders = new Set([
          '__mocks__',
          'test-utils',
          'tests',
          'icons',
          'context',
          'hooks',
          'e2e',
          'src',
        ]);
        if (specialFolders.has(parentFolderName)) {
          return {};
        }

        // Convert kebab-case folder name to PascalCase (e.g. "color-picker" -> "ColorPicker")
        const pascalCaseFolderName = parentFolderName
          .split('-')
          .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
          .join('');

        // Convert kebab-case folder name to camelCase (e.g. "color-picker" -> "colorPicker")
        const camelCaseFolderName = parentFolderName
          .split('-')
          .map((part, index) => (index === 0 ? part : part.charAt(0).toUpperCase() + part.slice(1)))
          .join('');

        // Allow .test. files whose base name matches either the kebab-case or PascalCase folder name
        const testFilePattern = /^(.*)\.test$/;
        const testMatch = baseNameWithoutExtension.match(testFilePattern);
        if (testMatch) {
          if (
            testMatch[1] === parentFolderName ||
            testMatch[1] === pascalCaseFolderName ||
            testMatch[1] === camelCaseFolderName
          ) {
            return {};
          }
        }

        return {
          Program(programNode) {
            const isKebabCaseMatch = baseNameWithoutExtension === parentFolderName;
            const isPascalCaseMatch = baseNameWithoutExtension === pascalCaseFolderName;
            const isCamelCaseMatch = baseNameWithoutExtension === camelCaseFolderName;

            if (!isKebabCaseMatch && !isPascalCaseMatch && !isCamelCaseMatch) {
              context.report({
                node: programNode,
                message: `File name must match parent folder name (${parentFolderName}${extensionName}, ${camelCaseFolderName}${extensionName}, or ${pascalCaseFolderName}${extensionName}) or use helpers/constants/interfaces/utils.`,
              });
            }
          },
        };
      },
    },
  },
};

/** @type {import('eslint').Linter.Config[]} */
export default [
  // Base JavaScript rules
  js.configs.recommended,

  // TypeScript rules (base)
  ...tsParser.configs.recommended,
  ...tsParser.configs.strict,

  // TypeScript + React rules
  {
    files: ['**/*.{ts,tsx}'],
    plugins: {
      import: importPlugin,
      react: reactPlugin,
      'react-hooks': reactHooksPlugin,
      'strict-structure': strictStructurePlugin,
    },
    languageOptions: {
      parser: tsParser.parser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        ecmaFeatures: {
          jsx: true,
        },
      },
      globals: {
        window: 'readonly',
        document: 'readonly',
        console: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly',
        requestAnimationFrame: 'readonly',
        cancelAnimationFrame: 'readonly',
        fetch: 'readonly',
        Headers: 'readonly',
        WebSocket: 'readonly',
        URL: 'readonly',
        URLSearchParams: 'readonly',
        Blob: 'readonly',
        File: 'readonly',
        FormData: 'readonly',
        AbortController: 'readonly',
        AbortSignal: 'readonly',
        TextEncoder: 'readonly',
        TextDecoder: 'readonly',
        Buffer: 'readonly',
        process: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        module: 'readonly',
        require: 'readonly',
        exports: 'readonly',
        global: 'readonly',
      },
    },
    settings: {
      'import/parsers': {
        '@typescript-eslint/parser': ['.ts', '.tsx'],
      },
      'import/resolver': {
        typescript: true,
        node: { extensions: ['.ts', '.tsx', '.js', '.jsx'] },
      },
      react: {
        version: '18.3',
      },
    },
    rules: {
      // React specific rules
      'react/react-in-jsx-scope': 'off', // Not needed with React 18+
      'react/prop-types': 'off', // Using TypeScript
      'react/jsx-uses-react': 'off', // Not needed with React 18+
      'react/jsx-uses-vars': 'error',
      'react/no-unescaped-entities': 'warn',
      'react/no-unknown-property': 'error',
      'react/self-closing-comp': 'warn',
      'react/jsx-key': 'error',
      'react/jsx-no-duplicate-props': 'error',
      'react/jsx-no-target-blank': 'warn',
      'react/jsx-no-undef': 'error',

      // React Hooks rules
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',

      // TypeScript specific rules (no type checking required)
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],
      '@typescript-eslint/no-unused-expressions': 'error',
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-non-null-assertion': 'off', // Allow in existing codebase
      '@typescript-eslint/consistent-type-imports': 'error',

      // Import strictness
      'import/no-unresolved': 'error',
      'import/named': 'error',
      'import/default': 'error',
      'import/namespace': 'error',

      // General code quality rules
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      'no-debugger': 'error',
      'no-var': 'error',
      'prefer-const': 'error',
      'no-unused-vars': 'off', // Handled by TypeScript
      'no-undef': 'off', // TypeScript already catches undefined names via tsc; ESLint's no-undef doesn't understand DOM lib types
      eqeqeq: ['error', 'always'],
      curly: ['error', 'all'],
      'no-throw-literal': 'error',
      'prefer-promise-reject-errors': 'error',
      'no-return-await': 'error',
      'require-await': 'off', // Allow async functions without await (for return type consistency)
      'no-async-promise-executor': 'error',
      'no-promise-executor-return': 'off', // Allow returning from promise executor
      'no-multiple-empty-lines': ['warn', { max: 2, maxEOF: 1 }],
      'no-trailing-spaces': 'warn',
      'eol-last': 'warn',
      'no-useless-assignment': 'warn',

      // Structural strictness
      'strict-structure/types-only-in-interfaces-file': 'error',
      'strict-structure/module-consts-only-in-constants-file': 'error',
      'strict-structure/strict-file-name': 'error',
      'strict-structure/no-double-cast': 'error',
      'strict-structure/svg-only-in-assets': 'error',
      'strict-structure/max-statement-group-lines': ['error', { max: 4 }],
      'strict-structure/tailwind-only-styles': 'error',
      'strict-structure/long-classname-const': ['error', { maxLength: 80 }],
      'strict-structure/test-case-requires-assertion': 'error',
      'strict-structure/no-weak-test-assertions': 'error',
      'strict-structure/component-test-requires-snapshot': 'error',
    },
  },

  // Script files (Node.js environment)
  {
    files: ['scripts/**/*.{ts,js,mjs}', '*.config.{ts,js,mjs}', '*.mjs', '*.js'],
    languageOptions: {
      globals: {
        process: 'readonly',
        console: 'readonly',
        Buffer: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        module: 'readonly',
        require: 'readonly',
        exports: 'readonly',
        global: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly',
      },
    },
    rules: {
      'no-console': 'off', // Scripts can use console
      '@typescript-eslint/no-explicit-any': 'error',
    },
  },

  // CommonJS files (.cjs)
  {
    files: ['**/*.cjs'],
    languageOptions: {
      sourceType: 'commonjs',
      globals: {
        process: 'readonly',
        console: 'readonly',
        Buffer: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        module: 'readonly',
        require: 'readonly',
        exports: 'readonly',
        global: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly',
      },
    },
    rules: {
      '@typescript-eslint/no-require-imports': 'off',
      'no-console': 'off',
      '@typescript-eslint/no-explicit-any': 'error',
    },
  },

  // Test files — structural strictness does not apply inside test and mock files
  {
    files: ['**/*.test.{ts,tsx,cjs}', '**/__mocks__/**', '**/test-utils/**', '**/tests/**'],
    languageOptions: {
      globals: {
        jest: 'readonly',
        describe: 'readonly',
        it: 'readonly',
        test: 'readonly',
        expect: 'readonly',
        beforeAll: 'readonly',
        afterAll: 'readonly',
        beforeEach: 'readonly',
        afterEach: 'readonly',
        vi: 'readonly',
        console: 'readonly',
      },
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      'no-console': 'off',
      // Mock/stub files may have empty or constructor-only classes as stubs
      '@typescript-eslint/no-extraneous-class': 'off',
      '@typescript-eslint/no-useless-constructor': 'off',
      // Structural rules do not apply inside test fixtures
      'strict-structure/types-only-in-interfaces-file': 'off',
      'strict-structure/module-consts-only-in-constants-file': 'off',
      'strict-structure/strict-file-name': 'off',
      // Test stubs and mock adapters legitimately use double casts to satisfy interfaces
      'strict-structure/no-double-cast': 'off',
    },
  },

  // E2E test files — structural strictness does not apply to integration test suites
  {
    files: ['**/e2e/**/*.ts', '**/e2e/**/*.tsx'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      'no-console': 'off',
      // E2E integration suites can exceed line limits without subfolder splitting
      'max-lines': 'off',
      // Structural rules do not apply inside E2E suites
      'strict-structure/types-only-in-interfaces-file': 'off',
      'strict-structure/module-consts-only-in-constants-file': 'off',
      'strict-structure/strict-file-name': 'off',
      // E2E runtime adapters may use double casts to bridge Obsidian/test types
      'strict-structure/no-double-cast': 'off',
      // E2E tests must contain at least one assertion
      'strict-structure/e2e-test-requires-assertion': 'error',
    },
  },

  // Type declaration files — exempt from file-name structural check
  {
    files: ['**/types/**', '**/*.d.ts'],
    rules: {
      'strict-structure/strict-file-name': 'off',
    },
  },

  // Root-level test setup file is shared infrastructure, not a feature module.
  {
    files: ['testSetup.ts'],
    rules: {
      'strict-structure/strict-file-name': 'off',
    },
  },

  // Non-test files must strictly keep <= 150 lines
  {
    files: ['**/*.{ts,tsx,js,jsx,mjs,cjs}'],
    ignores: [
      '**/*.test.{ts,tsx,js,jsx,cjs}',
      '**/__mocks__/**',
      '**/test-utils/**',
      '**/tests/**',
      '**/e2e/**',
      // The ESLint config itself is a single structured file; splitting it would reduce clarity
      'eslint.config.mjs',
    ],
    rules: {
      'max-lines': ['error', { max: 150, skipBlankLines: false, skipComments: false }],
    },
  },

  // Email helpers - uses require() for Node.js modules inside functions
  {
    files: ['**/email/helpers.ts'],
    rules: {
      '@typescript-eslint/no-require-imports': 'off',
    },
  },

  // Ignore patterns
  {
    ignores: [
      'node_modules/**',
      'dist/**',
      'coverage/**',
      'main.js',
      '.e2e-vault/**',
      '.worktrees/**',
    ],
  },

  // Prettier compatibility (must be last)
  prettierConfig,
];
