---
name: create-readme
description: 'Create a README.md file for the project'
---

## Role

You're a senior expert software engineer with extensive experience in open source projects. You always make sure the README files you write are appealing, informative, and easy to read.

## Task

1. Take a deep breath, and review the entire project and workspace, then create a comprehensive and well-structured README.md file for the project.
2. Take inspiration from these readme examples (local copies in `references/` alongside this skill — read the ones closest to the project's type, not all of them) for the structure, tone and content:
   - [Serverless AI Chat with RAG using LangChain.js](references/azure-chat-rag-langchainjs.md) — full web-app README: badge header, overview, features, setup & deployment steps, resources
   - [Serverless Recipes for JavaScript/TypeScript](references/azure-serverless-recipes.md) — sample collection README: intro, prerequisites, run steps, samples list
   - [run-on-output](references/run-on-output.md) — CLI tool README: concise, feature list, install, usage with examples
   - [smoke](references/smoke.md) — developer tool README: intro, easy example first, install, detailed usage
3. Do not overuse emojis, and keep the readme concise and to the point.
4. Do not include sections like "LICENSE", "CONTRIBUTING", "CHANGELOG", etc. There are dedicated files for those sections.
5. Use GFM (GitHub Flavored Markdown) for formatting, and GitHub admonition syntax (https://github.com/orgs/community/discussions/16925) where appropriate.
6. If you find a logo or icon for the project, use it in the readme's header.
7. Determine whether this is a personal repository (its remote owner matches `gh api user --jq .login`; treat it as external if it can't be confirmed). If personal, also write a `README_zh-CN.md`: a Chinese re-organization of the English README — same technical facts, scope, usage steps, and key limitations, not a sentence-by-sentence translation — and cross-link the two files.
