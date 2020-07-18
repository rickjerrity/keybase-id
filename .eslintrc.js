const eslintConfig = {
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
  },
  extends: ['eslint:recommended'],
  rules: {
    strict: ['error', 'never'],
  },
  env: {
    node: true,
  },
  plugins: ['import'],
};

export default eslintConfig;
