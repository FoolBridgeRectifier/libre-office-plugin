import path from 'node:path';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
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

    'no-react-class-components': {
      meta: {
        type: 'problem',
        docs: {
          description: 'Require React components to be written as functional components.',
        },
        schema: [],
      },
      create(context) {
        const currentFilePath = context.filename.replace(/\\/g, '/');
        const isReactComponentFile = currentFilePath.endsWith('.tsx');

        if (!isReactComponentFile) {
          return {};
        }

        const isReactClassSuper = (superClassNode) => {
          if (!superClassNode) {
            return false;
          }

          if (superClassNode.type === 'Identifier') {
            return superClassNode.name === 'Component' || superClassNode.name === 'PureComponent';
          }

          if (superClassNode.type !== 'MemberExpression') {
            return false;
          }

          const objectNode = superClassNode.object;
          const propertyNode = superClassNode.property;
          const isReactObject = objectNode.type === 'Identifier' && objectNode.name === 'React';
          const isComponentProperty =
            propertyNode.type === 'Identifier' &&
            (propertyNode.name === 'Component' || propertyNode.name === 'PureComponent');

          return isReactObject && isComponentProperty;
        };

        return {
          ClassDeclaration(node) {
            if (!isReactClassSuper(node.superClass)) {
              return;
            }

            context.report({
              node,
              message:
                'Write React components as functional components with hooks. Use classes only for framework inheritance such as Obsidian Plugin or FileView.',
            });
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
          'output',
          'runtime',
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

    'helper-modules-private-to-folder': {
      meta: {
        type: 'problem',
        docs: {
          description:
            'Require files or folders named helper/helpers to be imported only from their containing folder.',
        },
        schema: [],
      },
      create(context) {
        const currentFilePath = context.filename.replace(/\\/g, '/');
        const helperFolderNames = new Set(['helper', 'helpers']);
        const supportedExtensions = ['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs'];

        const resolveLocalModulePath = (sourceValue) => {
          if (typeof sourceValue !== 'string' || !sourceValue.startsWith('.')) {
            return null;
          }

          const currentDirectoryPath = path.dirname(currentFilePath);
          const modulePath = path.resolve(currentDirectoryPath, sourceValue).replace(/\\/g, '/');
          const candidatePaths = [
            modulePath,
            ...supportedExtensions.map((extensionName) => `${modulePath}${extensionName}`),
            ...supportedExtensions.map((extensionName) =>
              path.join(modulePath, `index${extensionName}`).replace(/\\/g, '/')
            ),
          ];

          return candidatePaths.find((candidatePath) => {
            try {
              return readdirSync(path.dirname(candidatePath)).includes(
                path.basename(candidatePath)
              );
            } catch {
              return false;
            }
          });
        };

        const getHelperContainingFolderPath = (resolvedPath) => {
          const pathParts = resolvedPath.split('/');
          const helperSegmentIndex = pathParts.findIndex((pathPart) =>
            helperFolderNames.has(pathPart)
          );

          if (helperSegmentIndex > 0) {
            return pathParts.slice(0, helperSegmentIndex).join('/');
          }

          const parsedPath = path.parse(resolvedPath);

          if (helperFolderNames.has(parsedPath.name)) {
            return parsedPath.dir.replace(/\\/g, '/');
          }

          return null;
        };

        const isInsideFolder = (filePath, folderPath) => {
          const relativePath = path.relative(folderPath, filePath).replace(/\\/g, '/');

          return relativePath === '' || (!relativePath.startsWith('../') && relativePath !== '..');
        };

        const checkImportSource = (node, sourceValue) => {
          const resolvedPath = resolveLocalModulePath(sourceValue);

          if (!resolvedPath) {
            return;
          }

          const helperContainingFolderPath = getHelperContainingFolderPath(resolvedPath);

          if (
            helperContainingFolderPath === null ||
            isInsideFolder(currentFilePath, helperContainingFolderPath)
          ) {
            return;
          }

          context.report({
            node,
            message:
              'Helper modules are private to their containing folder. Import the feature index or move shared code into a named module.',
          });
        };

        return {
          ExportAllDeclaration(node) {
            checkImportSource(node, node.source.value);
          },
          ExportNamedDeclaration(node) {
            if (node.source) {
              checkImportSource(node, node.source.value);
            }
          },
          ImportDeclaration(node) {
            checkImportSource(node, node.source.value);
          },
        };
      },
    },

    'single-helper-utils-level': {
      meta: {
        type: 'problem',
        docs: {
          description: 'Disallow more than one helper/helpers/utils path level in a module path.',
        },
        schema: [],
      },
      create(context) {
        const currentFilePath = context.filename.replace(/\\/g, '/');
        const countedNames = new Set(['helper', 'helpers', 'utils']);

        const helperUtilsLevelCount = currentFilePath
          .split('/')
          .map((pathPart) => path.parse(pathPart).name)
          .filter((pathPart) => countedNames.has(pathPart)).length;

        if (helperUtilsLevelCount <= 1) {
          return {};
        }

        return {
          Program(programNode) {
            context.report({
              node: programNode,
              message:
                'Use at most one helper/helpers/utils level in a path. Promote nested helper or utils code into a named feature folder.',
            });
          },
        };
      },
    },

    'barrel-files-use-index': {
      meta: {
        type: 'problem',
        docs: {
          description: 'Require files that only re-export other modules to be named index.ts.',
        },
        schema: [],
      },
      create(context) {
        const currentFilePath = context.filename.replace(/\\/g, '/');
        const baseName = path.basename(currentFilePath);

        const isReExportStatement = (node) =>
          node.type === 'ExportAllDeclaration' ||
          (node.type === 'ExportNamedDeclaration' && node.source !== null);

        return {
          Program(programNode) {
            if (programNode.body.length === 0 || baseName === 'index.ts') {
              return;
            }

            if (!programNode.body.every(isReExportStatement)) {
              return;
            }

            context.report({
              node: programNode,
              message: 'Files that only re-export other modules must be named index.ts.',
            });
          },
        };
      },
    },

    'function-imports-follow-index-visibility': {
      meta: {
        type: 'problem',
        docs: {
          description:
            'Require imported functions to stay within their local folder scope unless parent index.ts files re-export them.',
        },
        schema: [],
      },
      create(context) {
        const currentFilePath = context.filename.replace(/\\/g, '/');
        const isTestOrTestHelperFile =
          /\.(test)\.(ts|tsx)$/.test(currentFilePath) ||
          /TestHelpers\.ts$/.test(currentFilePath) ||
          currentFilePath.endsWith('/testFileHelpers.ts');

        if (isTestOrTestHelperFile) {
          return {};
        }

        const projectRootPath = process.cwd().replace(/\\/g, '/');
        const sourceRootPath = path.join(projectRootPath, 'src').replace(/\\/g, '/');
        const supportedExtensions = ['.ts', '.tsx'];
        const resolvedFunctionCache = new Map();

        const isFilePath = (filePath) => {
          try {
            return statSync(filePath).isFile();
          } catch {
            return false;
          }
        };

        const resolveLocalModulePath = (sourceValue, sourceFilePath = currentFilePath) => {
          if (typeof sourceValue !== 'string' || !sourceValue.startsWith('.')) {
            return null;
          }

          const currentDirectoryPath = path.dirname(sourceFilePath);
          const modulePath = path.resolve(currentDirectoryPath, sourceValue).replace(/\\/g, '/');
          const candidatePaths = [
            modulePath,
            ...supportedExtensions.map((extensionName) => `${modulePath}${extensionName}`),
            ...supportedExtensions.map((extensionName) =>
              path.join(modulePath, `index${extensionName}`).replace(/\\/g, '/')
            ),
          ];

          return candidatePaths.find((candidatePath) => isFilePath(candidatePath)) ?? null;
        };

        const getSourceText = (filePath) => {
          try {
            return readFileSync(filePath, 'utf8');
          } catch {
            return '';
          }
        };

        const parseNamedExports = (exportListText) =>
          exportListText
            .split(',')
            .map((exportPart) => exportPart.trim())
            .filter(Boolean)
            .map((exportPart) => {
              const aliasMatch = /^(\w+)\s+as\s+(\w+)$/.exec(exportPart);

              if (aliasMatch) {
                return {
                  importedName: aliasMatch[1],
                  exportedName: aliasMatch[2],
                };
              }

              return {
                importedName: exportPart,
                exportedName: exportPart,
              };
            });

        const getDirectFunctionExportNames = (filePath) => {
          const sourceText = getSourceText(filePath);
          const functionExportNames = new Set();
          const declarationPattern = /export\s+(?:async\s+)?function\s+([A-Za-z_$][\w$]*)\s*\(/g;
          const constFunctionPattern =
            /export\s+const\s+([A-Za-z_$][\w$]*)\s*=\s*(?:async\s*)?(?:function\b|\([^)]*\)\s*=>|[A-Za-z_$][\w$]*\s*=>)/g;

          for (const functionMatch of sourceText.matchAll(declarationPattern)) {
            functionExportNames.add(functionMatch[1]);
          }

          for (const functionMatch of sourceText.matchAll(constFunctionPattern)) {
            functionExportNames.add(functionMatch[1]);
          }

          return functionExportNames;
        };

        const getImportedBindingSources = (filePath) => {
          const sourceText = getSourceText(filePath);
          const importedBindingSources = new Map();
          const importPattern = /import\s+\{([\s\S]*?)\}\s+from\s+['"]([^'"]+)['"]/g;

          for (const importMatch of sourceText.matchAll(importPattern)) {
            const modulePath = resolveLocalModulePath(importMatch[2], filePath);

            if (!modulePath) {
              continue;
            }

            for (const binding of parseNamedExports(importMatch[1])) {
              importedBindingSources.set(binding.exportedName, {
                importedName: binding.importedName,
                modulePath,
              });
            }
          }

          return importedBindingSources;
        };

        const getFunctionExportSource = (filePath, exportedName, visitedKeys = new Set()) => {
          const cacheKey = `${filePath}:${exportedName}`;

          if (resolvedFunctionCache.has(cacheKey)) {
            return resolvedFunctionCache.get(cacheKey);
          }

          if (visitedKeys.has(cacheKey)) {
            return null;
          }

          visitedKeys.add(cacheKey);

          const directFunctionExportNames = getDirectFunctionExportNames(filePath);

          if (directFunctionExportNames.has(exportedName)) {
            const functionSource = { exportedName, filePath };

            resolvedFunctionCache.set(cacheKey, functionSource);

            return functionSource;
          }

          const sourceText = getSourceText(filePath);
          const reExportPattern = /export\s+\{([\s\S]*?)\}\s+from\s+['"]([^'"]+)['"]/g;

          for (const exportMatch of sourceText.matchAll(reExportPattern)) {
            const modulePath = resolveLocalModulePath(exportMatch[2], filePath);

            if (!modulePath) {
              continue;
            }

            const matchingExport = parseNamedExports(exportMatch[1]).find(
              (binding) => binding.exportedName === exportedName
            );

            if (!matchingExport) {
              continue;
            }

            const functionSource = getFunctionExportSource(
              modulePath,
              matchingExport.importedName,
              visitedKeys
            );

            if (functionSource) {
              resolvedFunctionCache.set(cacheKey, functionSource);

              return functionSource;
            }
          }

          const importedBindingSources = getImportedBindingSources(filePath);
          const localExportPattern = /export\s+\{([\s\S]*?)\}/g;

          for (const exportMatch of sourceText.matchAll(localExportPattern)) {
            const sourceIndex = exportMatch.index + exportMatch[0].length;

            if (
              sourceText
                .slice(sourceIndex, sourceIndex + 6)
                .trimStart()
                .startsWith('from')
            ) {
              continue;
            }

            const matchingExport = parseNamedExports(exportMatch[1]).find(
              (binding) => binding.exportedName === exportedName
            );

            if (!matchingExport) {
              continue;
            }

            const importedBindingSource = importedBindingSources.get(matchingExport.importedName);

            if (!importedBindingSource) {
              continue;
            }

            const functionSource = getFunctionExportSource(
              importedBindingSource.modulePath,
              importedBindingSource.importedName,
              visitedKeys
            );

            if (functionSource) {
              resolvedFunctionCache.set(cacheKey, functionSource);

              return functionSource;
            }
          }

          resolvedFunctionCache.set(cacheKey, null);

          return null;
        };

        const isInsideFolder = (filePath, folderPath) => {
          const relativePath = path.relative(folderPath, filePath).replace(/\\/g, '/');

          return relativePath === '' || (!relativePath.startsWith('../') && relativePath !== '..');
        };

        const getInitialVisibilityRoot = (functionFilePath) => {
          const functionFolderPath = path.dirname(functionFilePath).replace(/\\/g, '/');
          const parentFolderPath = path.dirname(functionFolderPath).replace(/\\/g, '/');

          if (functionFolderPath === sourceRootPath || parentFolderPath === sourceRootPath) {
            return functionFolderPath;
          }

          return parentFolderPath;
        };

        const isFunctionExportedByIndex = (folderPath, functionSource) => {
          const indexPath = path.join(folderPath, 'index.ts').replace(/\\/g, '/');

          if (!existsSync(indexPath)) {
            return false;
          }

          const indexedFunctionSource = getFunctionExportSource(
            indexPath,
            functionSource.exportedName
          );

          return indexedFunctionSource?.filePath === functionSource.filePath;
        };

        const getVisibilityRoot = (functionSource) => {
          let visibilityRootPath = getInitialVisibilityRoot(functionSource.filePath);

          while (
            visibilityRootPath !== sourceRootPath &&
            isFunctionExportedByIndex(visibilityRootPath, functionSource)
          ) {
            visibilityRootPath = path.dirname(visibilityRootPath).replace(/\\/g, '/');
          }

          return visibilityRootPath;
        };

        const getImportedName = (specifierNode) => {
          if (specifierNode.imported.type === 'Identifier') {
            return specifierNode.imported.name;
          }

          return typeof specifierNode.imported.value === 'string'
            ? specifierNode.imported.value
            : null;
        };

        return {
          ImportDeclaration(node) {
            const modulePath = resolveLocalModulePath(node.source.value);

            if (!modulePath) {
              return;
            }

            for (const specifierNode of node.specifiers) {
              if (specifierNode.type !== 'ImportSpecifier') {
                continue;
              }

              const importedName = getImportedName(specifierNode);

              if (!importedName) {
                continue;
              }

              const functionSource = getFunctionExportSource(modulePath, importedName);

              if (!functionSource) {
                continue;
              }

              const visibilityRootPath = getVisibilityRoot(functionSource);

              if (isInsideFolder(currentFilePath, visibilityRootPath)) {
                continue;
              }

              context.report({
                node: specifierNode,
                message: `Function ${importedName} is not exported through enough parent index.ts files for this import. Re-export it through the parent index.ts or keep the import inside ${path.relative(projectRootPath, visibilityRootPath).replace(/\\/g, '/')}.`,
              });
            }
          },
        };
      },
    },

    'single-child-function-exports-stay-local': {
      meta: {
        type: 'problem',
        docs: {
          description:
            'Require exported functions used only by one child folder to live in that child folder.',
        },
        schema: [],
      },
      create(context) {
        const currentFilePath = context.filename.replace(/\\/g, '/');
        const isTestOrTestHelperFile =
          /\.(test)\.(ts|tsx)$/.test(currentFilePath) ||
          /TestHelpers\.ts$/.test(currentFilePath) ||
          currentFilePath.endsWith('/testFileHelpers.ts');

        if (isTestOrTestHelperFile) {
          return {};
        }

        const projectRootPath = process.cwd().replace(/\\/g, '/');
        const sourceRootPath = path.join(projectRootPath, 'src').replace(/\\/g, '/');
        const supportedExtensions = ['.ts', '.tsx'];
        const resolvedFunctionCache = new Map();
        const sourceTextCache = new Map();
        const allSourceFilesCache = { value: null };

        const isFilePath = (filePath) => {
          try {
            return statSync(filePath).isFile();
          } catch {
            return false;
          }
        };

        const isProductionSourceFile = (filePath) =>
          /\.(ts|tsx)$/.test(filePath) &&
          !/\.(test)\.(ts|tsx)$/.test(filePath) &&
          !filePath.includes('/__mocks__/') &&
          !filePath.includes('/test-utils/') &&
          !filePath.includes('/tests/') &&
          !filePath.includes('/e2e/');

        const getSourceText = (filePath) => {
          if (sourceTextCache.has(filePath)) {
            return sourceTextCache.get(filePath);
          }

          let sourceText = '';

          try {
            sourceText = readFileSync(filePath, 'utf8');
          } catch {
            sourceText = '';
          }

          sourceTextCache.set(filePath, sourceText);

          return sourceText;
        };

        const getSourceFiles = (folderPath) => {
          const sourceFiles = [];

          for (const directoryEntry of readdirSync(folderPath, { withFileTypes: true })) {
            const entryPath = path.join(folderPath, directoryEntry.name).replace(/\\/g, '/');

            if (directoryEntry.isDirectory()) {
              if (!['coverage', 'dist', 'node_modules', 'runtime'].includes(directoryEntry.name)) {
                sourceFiles.push(...getSourceFiles(entryPath));
              }

              continue;
            }

            if (directoryEntry.isFile() && isProductionSourceFile(entryPath)) {
              sourceFiles.push(entryPath);
            }
          }

          return sourceFiles;
        };

        const getAllSourceFiles = () => {
          if (allSourceFilesCache.value === null) {
            allSourceFilesCache.value = getSourceFiles(sourceRootPath);
          }

          return allSourceFilesCache.value;
        };

        const resolveLocalModulePath = (sourceValue, sourceFilePath) => {
          if (typeof sourceValue !== 'string' || !sourceValue.startsWith('.')) {
            return null;
          }

          const currentDirectoryPath = path.dirname(sourceFilePath);
          const modulePath = path.resolve(currentDirectoryPath, sourceValue).replace(/\\/g, '/');
          const candidatePaths = [
            modulePath,
            ...supportedExtensions.map((extensionName) => `${modulePath}${extensionName}`),
            ...supportedExtensions.map((extensionName) =>
              path.join(modulePath, `index${extensionName}`).replace(/\\/g, '/')
            ),
          ];

          return candidatePaths.find((candidatePath) => isFilePath(candidatePath)) ?? null;
        };

        const parseNamedBindings = (bindingListText) =>
          bindingListText
            .split(',')
            .map((bindingPart) => bindingPart.trim())
            .filter(Boolean)
            .map((bindingPart) => {
              const aliasMatch = /^(\w+)\s+as\s+(\w+)$/.exec(bindingPart);

              if (aliasMatch) {
                return {
                  importedName: aliasMatch[1],
                  localName: aliasMatch[2],
                };
              }

              return {
                importedName: bindingPart,
                localName: bindingPart,
              };
            });

        const getDirectFunctionExportNames = (filePath) => {
          const sourceText = getSourceText(filePath);
          const functionExportNames = new Set();
          const declarationPattern = /export\s+(?:async\s+)?function\s+([A-Za-z_$][\w$]*)\s*\(/g;
          const constFunctionPattern =
            /export\s+const\s+([A-Za-z_$][\w$]*)\s*=\s*(?:async\s*)?(?:function\b|\([^)]*\)\s*=>|[A-Za-z_$][\w$]*\s*=>)/g;

          for (const functionMatch of sourceText.matchAll(declarationPattern)) {
            functionExportNames.add(functionMatch[1]);
          }

          for (const functionMatch of sourceText.matchAll(constFunctionPattern)) {
            functionExportNames.add(functionMatch[1]);
          }

          return functionExportNames;
        };

        const getImportedBindingSources = (filePath) => {
          const sourceText = getSourceText(filePath);
          const importedBindingSources = new Map();
          const importPattern = /import\s+\{([\s\S]*?)\}\s+from\s+['"]([^'"]+)['"]/g;

          for (const importMatch of sourceText.matchAll(importPattern)) {
            const modulePath = resolveLocalModulePath(importMatch[2], filePath);

            if (!modulePath) {
              continue;
            }

            for (const binding of parseNamedBindings(importMatch[1])) {
              importedBindingSources.set(binding.localName, {
                importedName: binding.importedName,
                modulePath,
              });
            }
          }

          return importedBindingSources;
        };

        const getFunctionExportSource = (filePath, exportedName, visitedKeys = new Set()) => {
          const cacheKey = `${filePath}:${exportedName}`;

          if (resolvedFunctionCache.has(cacheKey)) {
            return resolvedFunctionCache.get(cacheKey);
          }

          if (visitedKeys.has(cacheKey)) {
            return null;
          }

          visitedKeys.add(cacheKey);

          if (getDirectFunctionExportNames(filePath).has(exportedName)) {
            const functionSource = { exportedName, filePath };

            resolvedFunctionCache.set(cacheKey, functionSource);

            return functionSource;
          }

          const sourceText = getSourceText(filePath);
          const reExportPattern = /export\s+\{([\s\S]*?)\}\s+from\s+['"]([^'"]+)['"]/g;

          for (const exportMatch of sourceText.matchAll(reExportPattern)) {
            const modulePath = resolveLocalModulePath(exportMatch[2], filePath);

            if (!modulePath) {
              continue;
            }

            const matchingExport = parseNamedBindings(exportMatch[1]).find(
              (binding) => binding.localName === exportedName
            );

            if (!matchingExport) {
              continue;
            }

            const functionSource = getFunctionExportSource(
              modulePath,
              matchingExport.importedName,
              visitedKeys
            );

            if (functionSource) {
              resolvedFunctionCache.set(cacheKey, functionSource);

              return functionSource;
            }
          }

          const importedBindingSources = getImportedBindingSources(filePath);
          const localExportPattern = /export\s+\{([\s\S]*?)\}/g;

          for (const exportMatch of sourceText.matchAll(localExportPattern)) {
            const sourceIndex = exportMatch.index + exportMatch[0].length;

            if (
              sourceText
                .slice(sourceIndex, sourceIndex + 6)
                .trimStart()
                .startsWith('from')
            ) {
              continue;
            }

            const matchingExport = parseNamedBindings(exportMatch[1]).find(
              (binding) => binding.localName === exportedName
            );

            if (!matchingExport) {
              continue;
            }

            const importedBindingSource = importedBindingSources.get(matchingExport.importedName);

            if (!importedBindingSource) {
              continue;
            }

            const functionSource = getFunctionExportSource(
              importedBindingSource.modulePath,
              importedBindingSource.importedName,
              visitedKeys
            );

            if (functionSource) {
              resolvedFunctionCache.set(cacheKey, functionSource);

              return functionSource;
            }
          }

          resolvedFunctionCache.set(cacheKey, null);

          return null;
        };

        const getFunctionImporters = (functionSource) => {
          const importingFilePaths = [];
          const importPattern = /import\s+\{([\s\S]*?)\}\s+from\s+['"]([^'"]+)['"]/g;

          for (const sourceFilePath of getAllSourceFiles()) {
            if (sourceFilePath === functionSource.filePath) {
              continue;
            }

            for (const importMatch of getSourceText(sourceFilePath).matchAll(importPattern)) {
              const modulePath = resolveLocalModulePath(importMatch[2], sourceFilePath);

              if (!modulePath) {
                continue;
              }

              for (const binding of parseNamedBindings(importMatch[1])) {
                const importedFunctionSource = getFunctionExportSource(
                  modulePath,
                  binding.importedName
                );

                if (
                  importedFunctionSource?.filePath === functionSource.filePath &&
                  importedFunctionSource.exportedName === functionSource.exportedName
                ) {
                  importingFilePaths.push(sourceFilePath);
                }
              }
            }
          }

          return importingFilePaths;
        };

        const getOwningChildFolderName = (importingFilePath, ownerFolderPath) => {
          const relativePath = path
            .relative(ownerFolderPath, importingFilePath)
            .replace(/\\/g, '/');

          if (relativePath === '' || relativePath.startsWith('../') || relativePath === '..') {
            return null;
          }

          const pathParts = relativePath.split('/');

          return pathParts.length > 1 ? pathParts[0] : null;
        };

        const isOnlyUsedByOneChildFolder = (functionSource) => {
          const ownerFolderPath = path.dirname(functionSource.filePath).replace(/\\/g, '/');
          const importingFilePaths = getFunctionImporters(functionSource);
          const childFolderNames = new Set();

          if (ownerFolderPath === sourceRootPath) {
            return null;
          }

          if (importingFilePaths.length === 0) {
            return null;
          }

          for (const importingFilePath of importingFilePaths) {
            const childFolderName = getOwningChildFolderName(importingFilePath, ownerFolderPath);

            if (!childFolderName) {
              return null;
            }

            childFolderNames.add(childFolderName);
          }

          if (childFolderNames.size !== 1) {
            return null;
          }

          return [...childFolderNames][0];
        };

        const reportIfSingleChildExport = (node, exportedName) => {
          const functionSource = { exportedName, filePath: currentFilePath };
          const childFolderName = isOnlyUsedByOneChildFolder(functionSource);

          if (!childFolderName) {
            return;
          }

          context.report({
            node,
            message: `Function ${exportedName} is only used by the ${childFolderName} child folder. Move it into that child module instead of exporting it from the parent folder.`,
          });
        };

        return {
          ExportNamedDeclaration(node) {
            if (!node.declaration) {
              return;
            }

            if (node.declaration.type === 'FunctionDeclaration' && node.declaration.id) {
              reportIfSingleChildExport(node.declaration.id, node.declaration.id.name);
              return;
            }

            if (node.declaration.type !== 'VariableDeclaration') {
              return;
            }

            for (const declaratorNode of node.declaration.declarations) {
              const initializerNode = declaratorNode.init;

              if (
                declaratorNode.id.type !== 'Identifier' ||
                (initializerNode?.type !== 'ArrowFunctionExpression' &&
                  initializerNode?.type !== 'FunctionExpression')
              ) {
                continue;
              }

              reportIfSingleChildExport(declaratorNode.id, declaratorNode.id.name);
            }
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
      'strict-structure/no-react-class-components': 'error',
      'strict-structure/svg-only-in-assets': 'error',
      'strict-structure/max-statement-group-lines': ['error', { max: 4 }],
      'strict-structure/tailwind-only-styles': 'error',
      'strict-structure/long-classname-const': ['error', { maxLength: 80 }],
      'strict-structure/test-case-requires-assertion': 'error',
      'strict-structure/no-weak-test-assertions': 'error',
      'strict-structure/component-test-requires-snapshot': 'error',
      'strict-structure/helper-modules-private-to-folder': 'error',
      'strict-structure/single-helper-utils-level': 'error',
      'strict-structure/barrel-files-use-index': 'error',
      'strict-structure/function-imports-follow-index-visibility': 'error',
      'strict-structure/single-child-function-exports-stay-local': 'error',
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
      'output/**',
      'runtime/**',
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
      'output/**',
      'runtime/**',
      '.e2e-vault/**',
      '.worktrees/**',
    ],
  },

  // Prettier compatibility (must be last)
  prettierConfig,
];
