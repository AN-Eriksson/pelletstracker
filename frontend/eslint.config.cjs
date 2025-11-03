module.exports = [
  { ignores: ['dist', 'build', 'node_modules', '.vite'] },

  {
    files: ['**/*.{js,jsx}'],
    languageOptions: {
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        ecmaFeatures: { jsx: true }
      }
    },
    plugins: {
      react: require('eslint-plugin-react'),
      'react-hooks': require('eslint-plugin-react-hooks'),
      'jsx-a11y': require('eslint-plugin-jsx-a11y'),
      prettier: require('eslint-plugin-prettier'),
      import: require('eslint-plugin-import')
    },
    settings: {
      react: { version: 'detect' },
      'import/resolver': { node: { extensions: ['.js', '.jsx'] } }
    },
    rules: {
      'prettier/prettier': 'warn',
      'react/react-in-jsx-scope': 'off',
      'react/prop-types': 'off',
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
      'jsx-a11y/no-onchange': 'off',
      'import/no-unresolved': 'off'
    }
  }
];