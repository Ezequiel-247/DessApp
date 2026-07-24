module.exports = {
  env: { browser: true, es2021: true },
  extends: ["eslint:recommended", "plugin:react/recommended"],
  plugins: ["react"],
  parserOptions: { ecmaVersion: 2021, sourceType: "module" },
  settings: { react: { version: "detect" } },
  rules: {
    "react/react-in-jsx-scope": "off",
    "react/prop-types": "off",
    "no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
    "no-console": "off",
  },
};
