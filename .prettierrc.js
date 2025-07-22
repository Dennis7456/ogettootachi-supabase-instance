export default {
  semi: true,
  trailingComma: "es5",
  singleQuote: true,
  printWidth: 100,
  tabWidth: 2,
  useTabs: false,
  arrowParens: "always",
  bracketSpacing: true,
  endOfLine: "lf",
  jsxSingleQuote: true,
  quoteProps: "as-needed",
  proseWrap: "preserve",
  overrides: [
    {
      files: ["*.json", "*.jsonc"],
      options: {
        printWidth: 120,
      },
    },
    {
      files: ["*.md", "*.mdx"],
      options: {
        printWidth: 100,
        proseWrap: "always",
      },
    },
    {
      files: ["*.yml", "*.yaml"],
      options: {
        tabWidth: 2,
      },
    },
    {
      files: ["*.ts", "*.tsx"],
      options: {
        parser: "typescript",
      },
    },
  ],
};
