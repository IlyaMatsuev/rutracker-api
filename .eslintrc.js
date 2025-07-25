module.exports = {
  root: true,
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: "module",
  },
  extends: ["airbnb-base", "prettier"],
  plugins: ["prettier"],
  rules: {
    "prettier/prettier": "error",
    "class-methods-use-this": "off",
  },
  ignorePatterns: ["**/*.d.ts"],
  env: {
    node: true,
  },
  overrides: [
    {
      files: ["tests/**/*.test.js"],
      env: {
        jest: true,
      },
    },
  ],
};
