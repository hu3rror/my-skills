---
id: create-readme.localize-template-references
file: skills/awesome-copilot/create-readme/SKILL.md
upstream:
  source: github/awesome-copilot
  path: skills/create-readme/SKILL.md
verification: diff
summary: >-
  Task step 2 localized: the 4 remote README template URLs replaced with local references/ copies (new local-only assets under skills/awesome-copilot/create-readme/references/, one-line type annotation each) — the skill no longer fetches template sites at run time.
origin: "PATCHES.md A-class row #10"
---

## Why

Fetching template sites at run time is fragile and slow; local copies keep the skill self-contained. The four references/ files are added as new-file hunks in the same record.

## Diff

```diff
--- a/skills/create-readme/SKILL.md
+++ b/skills/create-readme/SKILL.md
@@ -10,11 +10,11 @@ You're a senior expert software engineer with extensive experience in open sourc
 ## Task
 
 1. Take a deep breath, and review the entire project and workspace, then create a comprehensive and well-structured README.md file for the project.
-2. Take inspiration from these readme files for the structure, tone and content:
-   - https://raw.githubusercontent.com/Azure-Samples/serverless-chat-langchainjs/refs/heads/main/README.md
-   - https://raw.githubusercontent.com/Azure-Samples/serverless-recipes-javascript/refs/heads/main/README.md
-   - https://raw.githubusercontent.com/sinedied/run-on-output/refs/heads/main/README.md
-   - https://raw.githubusercontent.com/sinedied/smoke/refs/heads/main/README.md
+2. Take inspiration from these readme examples (local copies in `references/` alongside this skill — read the ones closest to the project's type, not all of them) for the structure, tone and content:
+   - [Serverless AI Chat with RAG using LangChain.js](references/azure-chat-rag-langchainjs.md) — full web-app README: badge header, overview, features, setup & deployment steps, resources
+   - [Serverless Recipes for JavaScript/TypeScript](references/azure-serverless-recipes.md) — sample collection README: intro, prerequisites, run steps, samples list
+   - [run-on-output](references/run-on-output.md) — CLI tool README: concise, feature list, install, usage with examples
+   - [smoke](references/smoke.md) — developer tool README: intro, easy example first, install, detailed usage
 3. Do not overuse emojis, and keep the readme concise and to the point.
 4. Do not include sections like "LICENSE", "CONTRIBUTING", "CHANGELOG", etc. There are dedicated files for those sections.
 5. Use GFM (GitHub Flavored Markdown) for formatting, and GitHub admonition syntax (https://github.com/orgs/community/discussions/16925) where appropriate.

--- /dev/null
+++ b/skills/awesome-copilot/create-readme/references/azure-chat-rag-langchainjs.md
@@ -0,0 +1,282 @@
+<!-- Source: https://raw.githubusercontent.com/Azure-Samples/serverless-chat-langchainjs/refs/heads/main/README.md
+     Fetched for local reference by the create-readme skill; images/links point into the upstream repo. -->
+<!-- prettier-ignore -->
+<div align="center">
+
+<img src="./packages/webapp/public/favicon.png" alt="" align="center" height="64" />
+
+# Serverless AI Chat with RAG using LangChain.js
+
+[![Open project in GitHub Codespaces](https://img.shields.io/badge/Codespaces-Open-blue?style=flat-square&logo=github)](https://codespaces.new/Azure-Samples/serverless-chat-langchainjs?hide_repo_select=true&ref=main&quickstart=true)
+[![Join Azure AI Foundry Discord](https://img.shields.io/badge/Discord-Azure_AI_Community-blue?style=flat-square&logo=discord&color=5865f2&logoColor=fff)](https://aka.ms/foundry/discord)
+[![Official Learn documentation](https://img.shields.io/badge/Documentation-00a3ee?style=flat-square)](https://learn.microsoft.com/azure/developer/javascript/ai/get-started-app-chat-template-langchainjs)
+[![Watch to learn about RAG and this sample on YouTube](https://img.shields.io/badge/YouTube-d95652.svg?style=flat-square&logo=youtube)](https://www.youtube.com/watch?v=xkFOmx5yxIA&list=PLlrxD0HtieHi5ZpsHULPLxm839IrhmeDk&index=4)
+[![dev.to blog post walkthrough](https://img.shields.io/badge/Blog%20post-black?style=flat-square&logo=dev.to)](https://dev.to/azure/build-a-serverless-chatgpt-with-rag-using-langchainjs-3487)
+<br>
+[![Build Status](https://img.shields.io/github/actions/workflow/status/Azure-Samples/serverless-chat-langchainjs/build-test.yaml?style=flat-square&label=Build)](https://github.com/Azure-Samples/serverless-chat-langchainjs/actions)
+![Node version](https://img.shields.io/badge/Node.js->=20-3c873a?style=flat-square)
+[![Ollama + Llama3.1](https://img.shields.io/badge/Ollama-Llama3.1-ff7000?style=flat-square)](https://ollama.com/library/llama3.1)
+[![TypeScript](https://img.shields.io/badge/TypeScript-blue?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
+[![License](https://img.shields.io/badge/License-MIT-yellow?style=flat-square)](LICENSE)
+
+:star: If you like this sample, star it on GitHub — it helps a lot!
+
+[Overview](#overview) • [Get started](#getting-started) • [Run the sample](#run-the-sample) • [Resources](#resources) • [FAQ](#faq) • [Troubleshooting](#troubleshooting)
+
+![Animation showing the chat app in action](./docs/images/demo.gif)
+
+</div>
+
+This sample shows how to build a serverless AI chat experience with Retrieval-Augmented Generation using [LangChain.js](https://js.langchain.com/) and Azure. The application is hosted on [Azure Static Web Apps](https://learn.microsoft.com/azure/static-web-apps/overview) and [Azure Functions](https://learn.microsoft.com/azure/azure-functions/functions-overview?pivots=programming-language-javascript), with [Azure Cosmos DB for NoSQL](https://learn.microsoft.com/azure/cosmos-db/nosql/vector-) as the vector database. You can use it as a starting point for building more complex AI applications.
+
+> [!TIP]
+> You can test this application locally without any cost using [Ollama](https://ollama.com/). Follow the instructions in the [Local Development](#local-development) section to get started.
+
+## Overview
+
+Building AI applications can be complex and time-consuming, but using LangChain.js and Azure serverless technologies allows to greatly simplify the process. This application is a chatbot that uses a set of enterprise documents to generate responses to user queries.
+
+We provide sample data to make this sample ready to try, but feel free to replace it with your own. We use a fictitious company called _Contoso Real Estate_, and the experience allows its customers to ask support questions about the usage of its products. The sample data includes a set of documents that describes its terms of service, privacy policy and a support guide.
+
+<div align="center">
+  <img src="./docs/images/architecture.drawio.png" alt="Application architecture" width="640px" />
+</div>
+
+This application is made from multiple components:
+
+- A web app made with a single chat web component built with [Lit](https://lit.dev) and hosted on [Azure Static Web Apps](https://learn.microsoft.com/azure/static-web-apps/overview). The code is located in the `packages/webapp` folder.
+
+- A serverless API built with [Azure Functions](https://learn.microsoft.com/azure/azure-functions/functions-overview?pivots=programming-language-javascript) and using [LangChain.js](https://js.langchain.com/) to ingest the documents and generate responses to the user chat queries. The code is located in the `packages/api` folder.
+
+- A database to store chat sessions and the text extracted from the documents and the vectors generated by LangChain.js, using [Azure Cosmos DB for NoSQL](https://learn.microsoft.com/azure/cosmos-db/nosql/).
+
+- A file storage to store the source documents, using [Azure Blob Storage](https://learn.microsoft.com/azure/storage/blobs/storage-blobs-introduction).
+
+We use the [HTTP protocol for AI chat apps](https://aka.ms/chatprotocol) to communicate between the web app and the API.
+
+## Features
+
+- **Serverless Architecture**: Utilizes Azure Functions and Azure Static Web Apps for a fully serverless deployment.
+- **Retrieval-Augmented Generation (RAG)**: Combines the power of Azure Cosmos DB and LangChain.js to provide relevant and accurate responses.
+- **Chat Sessions History**: Maintains a personal chat history for each user, allowing them to revisit previous conversations.
+- **Scalable and Cost-Effective**: Leverages Azure's serverless offerings to provide a scalable and cost-effective solution.
+- **Local Development**: Supports local development using Ollama for testing without any cloud costs.
+
+## Getting started
+
+There are multiple ways to get started with this project.
+
+The quickest way is to use [GitHub Codespaces](#use-github-codespaces) that provides a preconfigured environment for you. Alternatively, you can [set up your local environment](#use-your-local-environment) following the instructions below.
+
+> [!IMPORTANT]
+> If you want to run this sample entirely locally using Ollama, you have to follow the instructions in the [local environment](#use-your-local-environment) section.
+
+### Use your local environment
+
+You need to install following tools to work on your local machine:
+
+- [Node.js LTS](https://nodejs.org/download/)
+- [Azure Developer CLI](https://aka.ms/azure-dev/install)
+- [Git](https://git-scm.com/downloads)
+- [PowerShell 7+](https://github.com/powershell/powershell) _(for Windows users only)_
+  - **Important**: Ensure you can run `pwsh.exe` from a PowerShell command. If this fails, you likely need to upgrade PowerShell.
+  - Instead of Powershell, you can also use Git Bash or WSL to run the Azure Developer CLI commands.
+- [Azure Functions Core Tools](https://learn.microsoft.com/azure/azure-functions/functions-run-local?tabs=macos%2Cisolated-process%2Cnode-v4%2Cpython-v2%2Chttp-trigger%2Ccontainer-apps&pivots=programming-language-javascript) _(should be installed automatically with NPM, only install manually if the API fails to start)_
+
+Then you can get the project code:
+
+1. [**Fork**](https://github.com/Azure-Samples/serverless-chat-langchainjs/fork) the project to create your own copy of this repository.
+2. On your forked repository, select the **Code** button, then the **Local** tab, and copy the URL of your forked repository.
+
+<div align="center">
+  <img src="./docs/images/clone-url.png" alt="Screenshot showing how to copy the repository URL" width="400px" />
+</div>
+3. Open a terminal and run this command to clone the repo: <code> git clone &lt;your-repo-url&gt; </code>
+
+### Use GitHub Codespaces
+
+You can run this project directly in your browser by using GitHub Codespaces, which will open a web-based VS Code:
+
+[![Open in GitHub Codespaces](https://img.shields.io/static/v1?style=for-the-badge&label=GitHub+Codespaces&message=Open&color=blue&logo=github)](https://codespaces.new/Azure-Samples/serverless-chat-langchainjs?hide_repo_select=true&ref&quickstart=true)
+
+### Use a VSCode dev container
+
+A similar option to Codespaces is VS Code Dev Containers, that will open the project in your local VS Code instance using the [Dev Containers extension](https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.remote-containers).
+
+You will also need to have [Docker](https://www.docker.com/products/docker-desktop) installed on your machine to run the container.
+
+[![Open in Dev Containers](https://img.shields.io/static/v1?style=for-the-badge&label=Dev%20Containers&message=Open&color=blue&logo=visualstudiocode)](https://vscode.dev/redirect?url=vscode://ms-vscode-remote.remote-containers/cloneInVolume?url=https://github.com/Azure-Samples/serverless-chat-langchainjs)
+
+## Run the sample
+
+There are multiple ways to run this sample: locally using Ollama or Azure OpenAI models, or by deploying it to Azure.
+
+### Deploy the sample to Azure
+
+#### Azure prerequisites
+
+- **Azure account**. If you're new to Azure, [get an Azure account for free](https://azure.microsoft.com/free) to get free Azure credits to get started. If you're a student, you can also get free credits with [Azure for Students](https://aka.ms/azureforstudents).
+- **Azure subscription with access enabled for the Azure OpenAI service**. You can request access with [this form](https://aka.ms/oaiapply).
+- **Azure account permissions**:
+  - Your Azure account must have `Microsoft.Authorization/roleAssignments/write` permissions, such as [Role Based Access Control Administrator](https://learn.microsoft.com/azure/role-based-access-control/built-in-roles#role-based-access-control-administrator-preview), [User Access Administrator](https://learn.microsoft.com/azure/role-based-access-control/built-in-roles#user-access-administrator), or [Owner](https://learn.microsoft.com/azure/role-based-access-control/built-in-roles#owner). If you don't have subscription-level permissions, you must be granted [RBAC](https://learn.microsoft.com/azure/role-based-access-control/built-in-roles#role-based-access-control-administrator-preview) for an existing resource group and [deploy to that existing group](docs/deploy_existing.md#resource-group).
+  - Your Azure account also needs `Microsoft.Resources/deployments/write` permissions on the subscription level.
+
+#### Cost estimation
+
+See the [cost estimation](./docs/cost.md) details for running this sample on Azure.
+
+#### Deploy the sample
+
+1. Open a terminal and navigate to the root of the project.
+2. Authenticate with Azure by running `azd auth login`.
+3. Run `azd up` to deploy the application to Azure. This will provision Azure resources, deploy this sample, and build the search index based on the files found in the `./data` folder.
+   - You will be prompted to select a base location for the resources. If you're unsure of which location to choose, select `eastus2`.
+   - By default, the OpenAI resource will be deployed to `eastus2`. You can set a different location with `azd env set AZURE_OPENAI_RESOURCE_GROUP_LOCATION <location>`. Currently only a short list of locations is accepted. That location list is based on the [OpenAI model availability table](https://learn.microsoft.com/azure/ai-services/openai/concepts/models#standard-deployment-model-availability) and may become outdated as availability changes.
+
+The deployment process will take a few minutes. Once it's done, you'll see the URL of the web app in the terminal.
+
+<div align="center">
+  <img src="./docs/images/azd-up.png" alt="Screenshot of the azd up command result" width="600px" />
+</div>
+
+You can now open the web app in your browser and start chatting with the bot.
+
+##### Enhance security
+
+When deploying the sample in an enterprise context, you may want to enforce tighter security restrictions to protect your data and resources. See the [enhance security](./docs/enhance-security.md) guide for more information.
+
+#### Enable CI/CD
+
+If you want to enable Continuous Deployment for your forked repository, you need to configure the Azure pipeline first:
+
+1. Open a terminal at the root of your forked project.
+2. Authenticate with Azure by running `azd auth login`.
+3. Run `azd pipeline config` to configure the required secrets and variables for connecting to Azure from GitHub Actions.
+   - This command will set up the necessary Azure service principal and configure GitHub repository secrets.
+   - Follow the prompts to complete the configuration.
+
+Once configured, the GitHub Actions workflow will automatically deploy your application to Azure whenever you push changes to the main branch.
+
+#### Clean up
+
+To clean up all the Azure resources created by this sample:
+
+1. Run `azd down --purge`
+2. When asked if you are sure you want to continue, enter `y`
+
+The resource group and all the resources will be deleted.
+
+### Run the sample locally with Ollama
+
+If you have a machine with enough resources, you can run this sample entirely locally without using any cloud resources. To do that, you first have to install [Ollama](https://ollama.com) and then run the following commands to download the models on your machine:
+
+```bash
+ollama pull llama3.1:latest
+ollama pull nomic-embed-text:latest
+```
+
+> [!NOTE]
+> The `llama3.1` model with download a few gigabytes of data, so it can take some time depending on your internet connection.
+
+After that you have to install the NPM dependencies:
+
+```bash
+npm install
+```
+
+Then you can start the application by running the following command which will start the web app and the API locally:
+
+```bash
+npm start
+```
+
+Then, open a new terminal running concurrently and run the following command to upload the PDF documents from the `/data` folder to the API:
+
+```bash
+npm run upload:docs
+```
+
+This only has to be done once, unless you want to add more documents.
+
+You can now open the URL `http://localhost:8000` in your browser to start chatting with the bot.
+
+> [!NOTE]
+> While local models usually works well enough to answer the questions, sometimes they may not be able to follow perfectly the advanced formatting instructions for the citations and follow-up questions. This is expected, and a limitation of using smaller local models.
+
+### Run the sample locally with Azure OpenAI models
+
+First you need to provision the Azure resources needed to run the sample. Follow the instructions in the [Deploy the sample to Azure](#deploy-the-sample-to-azure) section to deploy the sample to Azure, then you'll be able to run the sample locally using the deployed Azure resources.
+
+Once your deployment is complete, you should see a `.env` file in the `packages/api` folder. This file contains the environment variables needed to run the application using Azure resources.
+
+To run the sample, you can then use the same commands as for the Ollama setup. This will start the web app and the API locally:
+
+```bash
+npm start
+```
+
+Open the URL `http://localhost:8000` in your browser to start chatting with the bot.
+
+Note that the documents are uploaded automatically when deploying the sample to Azure with `azd up`.
+
+> [!TIP]
+> You can switch back to using Ollama models by simply deleting the `packages/api/.env` file and starting the application again. To regenerate the `.env` file, you can run `azd env get-values > packages/api/.env`.
+
+## Resources
+
+Here are some resources to learn more about the technologies used in this sample:
+
+- [LangChain.js documentation](https://js.langchain.com)
+- [Generative AI with JavaScript](https://github.com/microsoft/generative-ai-with-javascript)
+- [Generative AI For Beginners](https://github.com/microsoft/generative-ai-for-beginners)
+- [Azure OpenAI Service](https://learn.microsoft.com/azure/ai-services/openai/overview)
+- [Azure Cosmos DB for NoSQL](https://learn.microsoft.com/azure/cosmos-db/nosql/)
+- [Ask YouTube: LangChain.js + Azure Quickstart sample](https://github.com/Azure-Samples/langchainjs-quickstart-demo)
+- [Chat + Enterprise data with Azure OpenAI and Azure AI Search](https://github.com/Azure-Samples/azure-search-openai-javascript)
+- [Revolutionize your Enterprise Data with Chat: Next-gen Apps w/ Azure OpenAI and AI Search](https://aka.ms/entgptsearchblog)
+
+You can also find [more Azure AI samples here](https://github.com/Azure-Samples/azureai-samples).
+
+## FAQ
+
+You can find answers to frequently asked questions in the [FAQ](./docs/faq.md).
+
+## Troubleshooting
+
+If you have any issue when running or deploying this sample, please check the [troubleshooting guide](./docs/troubleshooting.md). If you can't find a solution to your problem, please [open an issue](https://github.com/Azure-Samples/serverless-chat-langchainjs/issues) in this repository.
+
+## Guidance
+
+For more detailed guidance on how to use this sample, please refer to the [tutorial](./docs/tutorial/01-introduction.md).
+
+## Getting Help
+
+If you get stuck or have any questions about building AI apps, join:
+
+[![Azure AI Foundry Discord](https://img.shields.io/badge/Discord-Azure_AI_Foundry_Community_Discord-blue?style=for-the-badge&logo=discord&color=5865f2&logoColor=fff)](https://aka.ms/foundry/discord)
+
+If you have product feedback or errors while building visit:
+
+[![Azure AI Foundry Developer Forum](https://img.shields.io/badge/GitHub-Azure_AI_Foundry_Developer_Forum-blue?style=for-the-badge&logo=github&color=000000&logoColor=fff)](https://aka.ms/foundry/forum)
+
+## Contributing
+
+This project welcomes contributions and suggestions. Most contributions require you to agree to a
+Contributor License Agreement (CLA) declaring that you have the right to, and actually do, grant us
+the rights to use your contribution. For details, visit https://cla.opensource.microsoft.com.
+
+When you submit a pull request, a CLA bot will automatically determine whether you need to provide
+a CLA and decorate the PR appropriately (e.g., status check, comment). Simply follow the instructions
+provided by the bot. You will only need to do this once across all repos using our CLA.
+
+This project has adopted the [Microsoft Open Source Code of Conduct](https://opensource.microsoft.com/codeofconduct/).
+For more information see the [Code of Conduct FAQ](https://opensource.microsoft.com/codeofconduct/faq/) or
+contact [opencode@microsoft.com](mailto:opencode@microsoft.com) with any additional questions or comments.
+
+## Trademarks
+
+This project may contain trademarks or logos for projects, products, or services. Authorized use of Microsoft
+trademarks or logos is subject to and must follow
+[Microsoft's Trademark & Brand Guidelines](https://www.microsoft.com/en-us/legal/intellectualproperty/trademarks/usage/general).
+Use of Microsoft trademarks or logos in modified versions of this project must not cause confusion or imply Microsoft sponsorship.
+Any use of third-party trademarks or logos are subject to those third-party's policies.
\ No newline at end of file
--- /dev/null
+++ b/skills/awesome-copilot/create-readme/references/azure-serverless-recipes.md
@@ -0,0 +1,164 @@
+<!-- Source: https://raw.githubusercontent.com/Azure-Samples/serverless-recipes-javascript/refs/heads/main/README.md
+     Fetched for local reference by the create-readme skill; images/links point into the upstream repo. -->
+<!-- prettier-ignore -->
+<div align="center">
+
+<img src="./docs/images/icon.png" alt="" align="center" height="96" />
+
+# Serverless Recipes for JavaScript/TypeScript
+
+[![Open project in GitHub Codespaces](https://img.shields.io/badge/Codespaces-Open-blue?style=flat-square&logo=github)](https://codespaces.new/Azure-Samples/serverless-recipes-javascript?hide_repo_select=true&ref=main&quickstart=true)
+[![Join Azure AI Foundry Discord](https://img.shields.io/badge/Discord-Azure_AI_Community-blue?style=flat-square&logo=discord&color=5865f2&logoColor=fff)](https://aka.ms/foundry/discord)
+[![Build Status](https://img.shields.io/github/actions/workflow/status/Azure-Samples/serverless-recipes-javascript/build-test.yaml?style=flat-square&label=Build)](https://github.com/Azure-Samples/serverless-recipes-javascript/actions)
+![Node version](https://img.shields.io/badge/Node.js->=20-3c873a?style=flat-square)
+[![TypeScript](https://img.shields.io/badge/TypeScript-blue?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
+[![License](https://img.shields.io/badge/License-MIT-yellow?style=flat-square)](LICENSE)
+
+⭐ If you like this project, star it on GitHub — it helps a lot!
+
+[Get started](#getting-started) • [Run the samples](#run-the-samples) • [Samples list](#samples-list) • [Resources](#resources) • [Troubleshooting](#troubleshooting)
+
+</div>
+
+This repository is a collection of code examples demonstrating how to build serverless applications using TypeScript and Azure. Each recipe is a standalone sample that demonstrates how to build a specific feature or use a specific technology. You can use these samples as a starting point for your own projects or to learn more about serverless development with Azure.
+
+> [!NOTE]
+> **What's Serverless?**<br>
+> Serverless computing allows you to build and run applications without managing infrastructure. You can focus on your code and let the cloud provider handle the rest. Azure provides a wide range of serverless services, including [Azure Functions](https://learn.microsoft.com/azure/azure-functions/functions-overview?pivots=programming-language-javascript), [Azure Static Web Apps]([Azure Static Web Apps](https://learn.microsoft.com/azure/static-web-apps/overview), [Azure Cosmos DB](https://learn.microsoft.com/azure/cosmos-db/nosql/), and more.
+
+## Why serverless?
+
+Let's say you're a developer for the Contoso Solutions company, and you've been tasked to build new applications with a fast turnaround time, startup style. You need to build these apps quickly with a low initial budget, and you don't want to worry about managing servers, scaling, or infrastructure. **You want to focus on writing code and delivering value to your users.**
+
+*This is exactly where serverless is a great fit!*
+
+While walking through this collection of ready-to-use code examples, you'll learn how to solve common problems and build applications using many of the serverless technologies available on Azure. The best part? You only need to pay attention to the code and the business logic, all samples are ready to deploy and run in your Azure account.
+
+## Prerequisites
+- **Azure account**. If you're new to Azure, [get an Azure account for free](https://azure.microsoft.com/free) to get free Azure credits to get started. If you're a student, you can also get free credits with [Azure for Students](https://aka.ms/azureforstudents).
+- **GitHub account**. If you don't have one, you can [create a free GitHub account](https://github.com/signup). You can optionally use [GitHub Copilot Free](https://github.com/features/copilot) to help you write code and ship your application even faster.
+
+## Getting started
+
+There are multiple ways to get started with this project.
+
+The quickest way is to use [GitHub Codespaces](#use-github-codespaces) that provides a preconfigured environment for you. Alternatively, you can [set up your local environment](#use-your-local-environment) following the instructions below.
+
+<details open>
+<summary><h3>Use GitHub Codespaces</h3></summary>
+
+You can run this project directly in your browser by using GitHub Codespaces, which will open a web-based VS Code:
+
+[![Open in GitHub Codespaces](https://img.shields.io/static/v1?style=flat-square&label=GitHub+Codespaces&message=Open&color=blue&logo=github)](https://codespaces.new/Azure-Samples/serverless-recipes-javascript?hide_repo_select=true&ref&quickstart=true)
+
+</details>
+
+<details>
+<summary><h3>Use a VSCode dev container</h3></summary>
+
+A similar option to Codespaces is VS Code Dev Containers, that will open the project in your local VS Code instance using the [Dev Containers extension](https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.remote-containers).
+
+You will also need to have [Docker](https://www.docker.com/get-started/) installed on your machine to run the container.
+
+[![Open in Dev Containers](https://img.shields.io/static/v1?style=flat-square&label=Dev%20Containers&message=Open&color=blue&logo=visualstudiocode)](https://vscode.dev/redirect?url=vscode://ms-vscode-remote.remote-containers/cloneInVolume?url=https://github.com/Azure-Samples/serverless-recipes-javascript)
+
+</details>
+
+<details>
+<summary><h3>Use your local environment</h3></summary>
+
+You need to install following tools to work on your local machine:
+
+- [Node.js LTS](https://nodejs.org/en/download)
+- [Azure Developer CLI](https://aka.ms/azure-dev/install)
+- [Git](https://git-scm.com/downloads)
+- [PowerShell 7+](https://github.com/powershell/powershell) _(for Windows users only)_
+  - **Important**: Ensure you can run `pwsh.exe` from a PowerShell command. If this fails, you likely need to upgrade PowerShell.
+  - Instead of Powershell, you can also use Git Bash or WSL to run the Azure Developer CLI commands.
+- [Azure Functions Core Tools](https://learn.microsoft.com/azure/azure-functions/functions-run-local?tabs=macos%2Cisolated-process%2Cnode-v4%2Cpython-v2%2Chttp-trigger%2Ccontainer-apps&pivots=programming-language-javascript) _(should be installed automatically with NPM, only install manually if the API fails to start)_
+
+Then you can get the project code:
+
+1. [**Fork**](https://github.com/Azure-Samples/serverless-recipes-javascript/fork) the project to create your own copy of this repository.
+2. On your forked repository, select the **Code** button, then the **Local** tab, and copy the URL of your forked repository.
+
+   ![Screenshot showing how to copy the repository URL](./docs/images/clone-url.png)
+3. Open a terminal and run this command to clone the repo: `git clone <your-repo-url>`
+
+</details>
+
+## Run the samples
+
+After setting up your environment, you can deploy and run any of the samples. Each sample is a standalone project that you can run independently. Follows these steps to run a sample:
+
+```bash
+# Open the sample directory
+cd samples/<sample-name>
+
+# Install dependencies
+npm install
+
+# Deploy the sample to Azure
+azd auth login
+azd up
+```
+
+Once the initial deployment is completed, you can also run the sample locally with `npm start`.
+You can check the `README.md` file in each sample directory for more specific instructions.
+
+## Samples list
+
+<!-- #begin-samples -->
+
+| | Sample | Deployment Time | Video | Blog |
+| --- |:--- | --- | --- | --- |
+| <img src="./samples/openai-extension-embeddings/docs/images/icon.png" width="32px"/> | [Azure Functions OpenAI extension - embeddings](./samples/openai-extension-embeddings) | 5min | - | - |
+| <img src="./samples/openai-extension-textcompletion/docs/images/icon.png" width="32px"/> | [Azure Functions OpenAI extension - text completion](./samples/openai-extension-textcompletion) | 5min | - | - |
+
+<!-- #end-samples -->
+
+## Resources
+
+Here are some additional resources to learn more about the technologies used:
+
+- [Serverless Node.js with Azure Functions](https://learn.microsoft.com/azure/developer/javascript/how-to/develop-serverless-apps?tabs=v4-ts) (Microsoft Learn)
+- [Azure Cosmos DB for NoSQL](https://learn.microsoft.com/azure/cosmos-db/nosql/) (Microsoft Learn)
+- [Azure OpenAI Service](https://learn.microsoft.com/azure/ai-services/openai/overview) (Microsoft Learn)
+- [Generative AI with JavaScript](https://github.com/microsoft/generative-ai-with-javascript) (GitHub)
+- [Serverless AI Chat with RAG using LangChain.js](https://github.com/Azure-Samples/serverless-chat-langchainjs) (GitHub)
+
+## Troubleshooting
+
+If you have any issue when running or deploying the samples, please check the [troubleshooting guide](./docs/troubleshooting.md). If you can't find a solution to your problem, please [open an issue](https://github.com/Azure-Samples/serverless-recipes-javascript/issues) in this repository.
+
+## Getting Help
+
+If you get stuck or have any questions about building AI apps, join:
+
+[![Azure AI Foundry Discord](https://img.shields.io/badge/Discord-Azure_AI_Foundry_Community_Discord-blue?style=for-the-badge&logo=discord&color=5865f2&logoColor=fff)](https://aka.ms/foundry/discord)
+
+If you have product feedback or errors while building visit:
+
+[![Azure AI Foundry Developer Forum](https://img.shields.io/badge/GitHub-Azure_AI_Foundry_Developer_Forum-blue?style=for-the-badge&logo=github&color=000000&logoColor=fff)](https://aka.ms/foundry/forum)
+
+## Contributing
+
+This project welcomes contributions and suggestions. Most contributions require you to agree to a
+Contributor License Agreement (CLA) declaring that you have the right to, and actually do, grant us
+the rights to use your contribution. For details, visit https://cla.opensource.microsoft.com.
+
+When you submit a pull request, a CLA bot will automatically determine whether you need to provide
+a CLA and decorate the PR appropriately (e.g., status check, comment). Simply follow the instructions
+provided by the bot. You will only need to do this once across all repos using our CLA.
+
+This project has adopted the [Microsoft Open Source Code of Conduct](https://opensource.microsoft.com/codeofconduct/).
+For more information see the [Code of Conduct FAQ](https://opensource.microsoft.com/codeofconduct/faq/) or
+contact [opencode@microsoft.com](mailto:opencode@microsoft.com) with any additional questions or comments.
+
+## Trademarks
+
+This project may contain trademarks or logos for projects, products, or services. Authorized use of Microsoft
+trademarks or logos is subject to and must follow
+[Microsoft's Trademark & Brand Guidelines](https://www.microsoft.com/en-us/legal/intellectualproperty/trademarks/usage/general).
+Use of Microsoft trademarks or logos in modified versions of this project must not cause confusion or imply Microsoft sponsorship.
+Any use of third-party trademarks or logos are subject to those third-party's policies.
\ No newline at end of file
--- /dev/null
+++ b/skills/awesome-copilot/create-readme/references/run-on-output.md
@@ -0,0 +1,148 @@
+<!-- Source: https://raw.githubusercontent.com/sinedied/run-on-output/refs/heads/main/README.md
+     Fetched for local reference by the create-readme skill; images/links point into the upstream repo. -->
+<div align="center">
+  <img src="icon.png" width="96" alt="run-on-output logo">
+  
+  # run-on-output
+  *Execute tasks when CLI output patterns are detected*
+  
+  [![Build Status](https://img.shields.io/github/actions/workflow/status/sinedied/run-on-output/ci.yml?style=flat-square)](https://github.com/sinedied/run-on-output/actions)
+  [![npm version](https://img.shields.io/npm/v/run-on-output?style=flat-square)](https://www.npmjs.com/package/run-on-output)
+  [![Node.js](https://img.shields.io/badge/Node.js->=20-3c873a?style=flat-square)](https://nodejs.org)
+  [![XO code style](https://shields.io/badge/code_style-5ed9c7?logo=xo&labelColor=gray&style=flat-square)](https://github.com/xojs/xo)
+  [![License](https://img.shields.io/badge/License-MIT-blue?style=flat-square)](LICENSE)
+
+  ⭐ If you like this project, star it on GitHub!
+
+  [Features](#features) • [Installation](#installation) • [Usage](#usage) • [Examples](#examples)
+
+</div>
+
+
+A lightweight Node.js CLI tool that monitors command output in real-time and triggers actions when specific patterns are found. Perfect for automation workflows, development environments, and CI/CD pipelines.
+
+## Features
+
+- 🎯 **Pattern Matching** - Monitor stdout/stderr for regex patterns or plain strings
+- ⚡ **Real-time Monitoring** - Output is forwarded in real-time while monitoring  
+- 🔧 **Flexible Actions** - Display messages or execute commands when patterns match
+- 📝 **Multiple Patterns** - Wait for multiple patterns before triggering actions
+- 🚀 **Zero Dependencies** - Built with Node.js built-in modules only
+
+## Installation
+
+```bash
+npm install -g run-on-output
+```
+
+Or use without installing:
+
+```bash
+npx run-on-output [options] <command> [args...]
+```
+
+## Usage
+
+### Basic Examples
+
+**Display a message when server starts:**
+```bash
+run-on-output -s "Server started" -m "🚀 Server is ready" npm start
+```
+
+**Execute a health check when server is listening:**
+```bash
+run-on-output -p "listening on port \\d+" -r "curl http://localhost:3000/health" node server.js
+```
+
+**Monitor development environment startup:**
+```bash
+run-on-output -s "webpack compiled,server ready" -m "✅ Development environment ready" npm run dev
+```
+
+**Multiple actions - show message and open browser:**
+```bash
+run-on-output -s "ready" -m "Server is up" -r "open http://localhost:3000" npm start
+```
+
+**Run npm script when server is ready:**
+```bash
+run-on-output -s "Server running" -n "test" node server.js
+```
+
+> [!TIP]
+> You can use the short alias `roo` instead of `run-on-output` for faster typing:
+> ```bash
+> roo -s "Server started" -m "🚀 Server is ready" npm start
+> ```
+
+### Command Line Options
+
+```
+run-on-output [OPTIONS] <command> [args...]
+
+OPTIONS:
+  -p, --patterns <patterns>    Comma-separated list of regex patterns to watch for
+  -s, --strings <strings>      Comma-separated list of plain strings to watch for
+  -r, --run <command>          Command to execute after all patterns are found
+  -n, --npm <script>           npm script to run after all patterns are found
+  -m, --message <text>         Message to display after all patterns are found
+  -h, --help                   Show this help message
+
+REQUIREMENTS:
+  - Either --patterns or --strings must be specified (but not both)
+  - At least one of --run, --npm, or --message must be specified
+```
+
+### Pattern Types
+
+**Plain Strings (`-s, --strings`)**
+- Matches exact text (case-insensitive)
+- Easier to use for simple text matching
+- Example: `-s "Server started,Database connected"`
+
+**Regex Patterns (`-p, --patterns`)**
+- Use regular expressions for complex matching
+- Supports all JavaScript regex features
+- Example: `-p "listening on port \\d+,ready in \\d+ms"`
+
+## Examples
+
+**Development Workflow**
+```bash
+# Wait for both webpack and server, then open browser
+run-on-output -s "webpack compiled,Local:" -r "open http://localhost:3000" npm run dev
+
+# Monitor test runner and show completion message
+run-on-output -s "Tests completed" -m "✅ All tests passed" npm test
+```
+
+**CI/CD Pipeline**
+```bash
+# Wait for deployment completion and run smoke tests
+run-on-output -p "deployment.*complete" -r "./scripts/smoke-test.sh" deploy.sh
+
+# Monitor build process and trigger notifications
+run-on-output -s "Build successful" -r "slack-notify '#dev' 'Build completed'" npm run build
+```
+
+**Docker & Containers**
+```bash
+# Wait for container health check and run integration tests
+run-on-output -s "healthy" -r "npm run test:integration" docker-compose up
+
+# Monitor database initialization
+run-on-output -p "database.*ready" -m "📁 Database initialized" ./start-db.sh
+```
+
+**API Development**
+```bash
+# Wait for API server and run endpoint tests
+run-on-output -p "server.*listening.*port" -r "npm run test:api" node api.js
+
+# Monitor microservices startup and run deployment script
+run-on-output -s "auth-service ready,user-service ready" -n "deploy" ./start-services.sh
+
+# Combine message, command and npm script
+run-on-output -s "Database connected" -m "🎉 Ready for testing" -n "test:integration" npm start
+```
\ No newline at end of file
--- /dev/null
+++ b/skills/awesome-copilot/create-readme/references/smoke.md
@@ -0,0 +1,368 @@
+<!-- Source: https://raw.githubusercontent.com/sinedied/smoke/refs/heads/main/README.md
+     Fetched for local reference by the create-readme skill; images/links point into the upstream repo. -->
+# :dash: smoke
+
+[![NPM version](https://img.shields.io/npm/v/smoke.svg)](https://www.npmjs.com/package/smoke)
+[![Build Status](https://github.com/sinedied/smoke/workflows/build/badge.svg)](https://github.com/sinedied/smoke/actions)
+![Node version](https://img.shields.io/node/v/smoke.svg)
+[![XO code style](https://img.shields.io/badge/code_style-XO-5ed9c7.svg)](https://github.com/sindresorhus/xo)
+[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
+
+> Simple yet powerful file-based mock server with recording abilities
+
+![demo](https://user-images.githubusercontent.com/593151/49312821-9f2cc680-f4e5-11e8-900a-117120c38422.gif)
+
+Just drop a bunch of (JSON) files in a folder and you're ready to go!
+
+### Basic mock example
+1. Start the server: `smoke`
+2. Create a file named `get_api#hello.json`:
+    ```json
+    {
+      "message": "hello world!"
+    }
+    ```
+3. Test the mock: `curl http://localhost:3000/api/hello`
+
+### Features
+
+**Smoke** is a file-based, convention over configuration mock server that can fill your API mocking needs without any
+complex setup. Yet, it supports many advanced features and dynamic mocks for almost any situation:
+
+- Generate mocks quickly by recording responses from an existing server
+- Use folders and file names to describe API routes and REST methods
+- Use templates to generate responses based on input queries and route parameters
+- Add / edit / remove mocks without restarting the server
+- Generate mocks with JavaScript for more complex responses
+- Define different mock sets to simulate various scenarii (errors...), with fallback
+- Customize headers and status code if needed, automatically detect content-type if not specified
+- Add custom middlewares to modify requests/responses
+- Mock only specific requests and proxy the rest to an existing server
+- Supports CORS (cross-origin resource-sharing)
+
+## Installation
+
+```bash
+npm install -g smoke
+```
+
+## Usage
+
+See [some example mocks](test/mocks) to quickly get a grasp of the syntax and possibilities.
+
+CLI usage is quite straightforward you can just run `smoke` unless you want to add some options:
+```
+Usage: smoke [<mocks_folder>] [options]
+
+Base options:
+  -p, --port <num>                  Server port           [default: 3000]
+  -h, --host <host>                 Server host           [default: "localhost"]
+  -s, --set <name>                  Mocks set to use      [default: none]
+  -n, --not-found <glob>            Mocks for 404 errors  [default: "404.*"]
+  -i, --ignore <glob>               Files to ignore       [default: none]
+  -k, --hooks <file>                Middleware hooks      [default: none]
+  -x, --proxy <host>                Fallback proxy if no mock found
+  -o, --allow-cors [all|<hosts>]    Enable CORS requests  [default: none]
+  --https                           Enable secure request serving with HTTPS [default: false]
+  -l, --logs                        Enable server logs
+  -v, --version                     Show version
+  --help                            Show help
+
+Mock recording:
+  -r, --record <host>               Proxy & record requests if no mock found
+  -c, --collection <file>           Save to single file mock collection
+  -d, --depth <N>                   Folder depth for mocks  [default: 1]
+  -a, --save-headers                Save response headers
+  -q, --save-query                  Save query parameters
+```
+
+### File naming
+
+**General format:** `methods_api#route#@routeParam$queryParam=value.__set.extension`
+
+The path and file name of the mock is used to determinate:
+
+#### Supported HTTP methods
+Optionally prefix your file by the HTTP method supported followed by an underscore (for example `get_`).
+You can specify multiple methods at once using a `+` to separate them (for example `post+put_`);
+If no method is specified, the mock will be used for any HTTP method.
+
+#### Server route and named route parameters
+Use any combination of folders or hash-separated components to specify the server route.
+
+For example `api/example/get_hello.json` is equivalent to `get_api#example#hello.json` and will respond to
+`GET api/example/hello` requests.
+
+Additionaly, any route component can be defined as a route parameter by prefixing the name with `@`, for example
+`api#resource#@id.json` will match `GET api/resource/1` and expose `1` as the value for the `id` parameter that can be
+used in dynamic mocks (templates or JavaScript).
+
+#### Query parameters
+You can further discriminate mocks by adding query parameters to match after defining the route, using a `$` (instead
+of the regular `?`) like you would specify them in a request.
+
+For example `get_api#hello$who=john.json` will match the request `api/get_hello?who=john.json`.
+
+Multiple query parameters to match can be added with `&`, for example `get_api#hello$who=john&greet=hi.json`.
+Any specified query parameter in the file name must be matched (in any order) by the request, but the opposite is not
+needed.
+
+Note that special characters must be URL-encoded, for example use `get_api#hello$who=john%20doe.json` to set the
+parameter `who` with the value `john doe`.
+
+> Tip: If you need to URL-encode a string, just run `node -p "encodeURIComponent('some string')"` in a terminal.
+
+#### Content type
+The file extension will determine the content type of the response if it's not already specified in a
+[custom header](#custom-status-and-headers).
+
+Files with no extension will use the default MIME type `application/octet-stream`.
+
+You can have multiple mocks with the same API route and different file extensions, the server will then use the best
+mock depending of the [`Accept` header](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Accept) of the
+request.
+
+#### Mock set
+You can optionally specify a mock set before the file extension by using a `__set-name` suffix after the file name.
+
+For example `get_api#hello__error.json` will only be used if you start the server with the `error` set enabled:
+`smoke --set error`.
+
+If you do not specify a mock set on your file name, it will be considered as the default mock for the specified route
+and will be used as a fallback if no mock with this set matched.
+
+#### Templates
+If you add an underscore `_` after the file extension, the mock will be processed as a template before being sent to
+the client. Templates works only on text-based formats.
+
+For example `get_hello.html_` or `get_hello.json_` will be treated as templates. 
+
+Every template can use an implicit context object that have these properties defined:
+- `method`: the HTTP method of the request (ex: `'GET'`, `'POST'`)
+- `query`: map with query parameters that were part of the request URL. For example, matched URL
+  `http://server/hello?who=world` will result in the query value: `{ who: 'world' }`.
+- `params`: map containing matched route parameters. For example the mock `resource#@id.json_` with the matched URL
+  `http://server/resource/123` will result in the params value: `{ id: '123' }`.
+- `headers`: map containing request headers
+- `body`: the request body. JSON bodies are automatically parsed.
+- `files`: if the request includes `multipart/form-data`, this will be the array of uploaded files (see
+  [multer documentation](https://github.com/expressjs/multer) for more details)
+
+##### Template syntax
+
+- `{{ }}` interpolates data in place
+
+  For example, create **get_hello.txt_** with this:
+  ```
+  Hello {{query.name}}!
+  ```
+
+  Then `curl "http://localhost:3000/hello?name=John"` returns `Hello John!`
+
+- `{{{ }}}` escapes HTML special chars from interpolated string
+
+  For example, create **get_hello.html_** with this:
+  ```html
+  <h1>Hello {{{query.name}}}!</h1>
+  ```
+
+  Then `curl "http://localhost:3000/hello?name=%3CJack%26Jones%3E"` returns:
+  ```html
+  <h1>Hello &lt;Jack&amp;Jones&gt;!</h1>
+  ```
+
+- `<{ }>` evaluates JavaScript to generate data
+
+  For example, create **get_hello.html_** with this:
+  ```html
+  Hello to:
+  <ul>
+    <{ query.name.forEach(name => { }><li>{{name}}</li><{ }); }>
+  </ul>
+  ```
+
+  Then `curl "http://localhost:3000/hello?name=Jack&name=Jones"` returns:
+  ```html
+  Hello to:
+  <ul>
+    <li>Jack</li><li>Jones</li>
+  </ul>
+  ```
+
+### Custom status and headers
+
+By default all mocks responses are sent with a status code `200` (OK), or `204` (No content) if a mock file is empty.
+
+You can customize the response status and (optionally) headers with JSON and [JavaScript](#javascript-mocks) files,
+using this syntax:
+```js
+{
+  "statusCode": 400,
+  "body": {
+    "error": "Bad request"
+  },
+  // headers can be omitted, only use if you want to customize them
+  "headers": {
+    "Content-Type": "text/plain"
+  } 
+}
+```
+
+You can also use non-string content type if you encode the content as a base64 string in the `body` property and add
+the property `"buffer": true` to the mock:
+```js
+{
+  "statusCode": 200,
+  "body": "U21va2Ugcm9ja3Mh",
+  "buffer": true,
+  "headers": {
+    "Content-Type": "application/octet-stream"
+  } 
+}
+```
+
+### Mock formats
+
+Any file format is supported for mocks, and the file extension will be used to determine the response content type.
+Files with no extension will use the default MIME type `application/octet-stream`.
+
+Text formats (for example `.json`, `.html`, `.txt`...) can be processed as [templates](#templates) by adding an
+underscore to the file extension.
+
+Note that JSON files and templates must use `UTF-8` encoding.
+
+#### JavaScript mocks
+
+In addition, you can define dynamic mocks using JavaScript by using the `.js` extension, that will be loaded as a regular
+Node.js module.
+
+In that case, your JS module is expected to export a function that take an input data object with the
+[same properties](#templates) as for templates and must returns the response body or an
+[object](#custom-status-and-headers) containing the status code, headers and body.
+
+Example:
+```js
+export default (data) => `{ "data": "Your user agent is: ${data.headers['user-agent']}" }`;
+```
+
+Note that by default, JS mocks use `application/json` for the response content type. If you want to use another type,
+you must set the `Content-Type` header yourself, for example:
+```js
+export default data => ({
+  statusCode: 200,
+  headers: {
+    'Content-Type': 'text/plain'
+  },
+  body: `Your user agent is: ${data.headers['user-agent']}`
+});
+```
+
+### Fallback proxy
+
+If you want to override responses of an existing server, you can use the `--proxy <host>` option. This will proxy
+every request for which a mock does not exist to the specified host.
+
+This can also be useful for mocking yet-to-be-implemented APIs and keep using real implemented APIs.
+
+### Mock recording
+
+To quickly create a mock set of an existing server (to allow working offline for example), you can use the
+`--record <host>` option. This will proxy every request for which a mock does not exist to the specified host, and
+record the resulting response as a mock file.
+
+You can change the maximum folder depth for mock files created this way using the `--depth` option.
+
+The recorded mock set can also be changed using the `--set` option.
+
+Instead of recoring separate mock files, you can also record to a
+[single file mock collection](#single-file-mock-collection) using the `--collection <file>` option. 
+
+Note that by default response headers and request query parameters are not saved. To change this behavior, you can
+use the `--save-headers` and `--save-query` options.
+
+### Middleware hooks
+
+For more advanced usages, you can hook on any standard
+[Express middleware](https://expressjs.com/en/guide/writing-middleware.html) to modify the request and/or the response
+returned by the server.
+
+To hook on your own middlewares, use the `--hooks` to specify a JavaScript module with exports setup like this:
+```js
+export const before = []; // middlewares to be executed before the request is processed
+export const after = [];  // middlewares to be executed after the request has been processed
+```
+
+Middlewares executed before the request is processed can be used to bypass regular mock response, for example to
+randomly simulate a server failure with an early error 500 response.
+
+On the other hand, middlewares executed after the request have been processed can be used to augment or modify the
+response, for example by adding header or changing the response status. You can also access and modify the response
+body by using the special `res.body` property.
+
+Remember that once you have used `.send()`, `.sendStatus` or `.json()` in a middleware the response cannot be altered
+anymore, that's why you should use the `res.body` property instead if you plan to alter the response later on.
+
+See some [example hooks](test/hooks.js).
+
+## Enabling CORS
+
+Smoke offers support to requests originating from a different origin. However, by default, this would be disabled.
+
+To enable CORS, pass the hosts that you want to allow to `-o` or `--allow-cors` arguments.
+
+**Accepted Values**
+- `all` - Allow requests from `*`
+- `<hosts>` - You could also pass a comma-separated list of hosts that you want to allow requests from something like `'http://localhost:3000,http://example.com'`
+
+### Single file mock collection
+
+You can regroup multiple mocks in a special single file with the extension `.mocks.js`, using this format:
+```js
+export default {
+  '<file_name>': '<file_content>' // can be a string, an object (custom response) or a function (JavaScript mock)
+};
+```
+See this [example mock collection](test/mocks/collection.mocks.js) to get an idea of all possibilities.
+
+The format of file name is the same as for individual mock files, and will be used to match the request using the same
+rules. As for the mock content, the format is also the same as what you would put in single file mock. If a request
+matches both a mock file and a mock within a collection with the same specificity, the mock file will always be used
+over the collection.
+
+As the format is the same, you can convert a bunch of files to a single file mock collection and conversely.
+To convert separate mock files to a collection:
+```sh
+smoke-conv <glob> <output_file>  // Will create <output_file>.mocks.js from all mocks found
+```
+
+To convert a mock collection to separate files:
+```sh
+smoke-conv <file> <output_folder>  // Will extract separate mocks into <output_folder>
+```
+
+Note that only text-based file content will be inserted directly, other file content will be converted to a base64
+string.
+
+:warning: There is a limitation regarding JavaScript mocks: only the exported function will be converted for a given
+mock, meaning that if you have non-exported functions, variables or imports they will be lost during the conversion.
+
+## Migration from v1/v2/v3 to v4
+
+If you are migrating from a previous version of Smoke, you need to be aware that the default module format has changed: earlier version used CommonJS modules, while v4 uses ES modules by default.
+
+But don't worry! You don't have to regenerate or updates all your mock files, Smoke will still support the CommonJS format for backward compatibility, though you need to rename all your `*.js` mocks, collections and hooks files to use the `.cjs` extension instead of `.js`.
+
+If you prefer to migrate your existing mock files to the new ES module format, you can do so by updating the export syntax to use `export default` instead of `module.exports` in mock files and collections, and `export` the `before` and `after` hooks constant separately in hooks fles.
+
+> [!NOTE]
+> If you try to record new mocks into an existing collection in CommonJS format, the result will be saved into a new collection in ES modules format.
+
+## Other mock servers
+
+If you cannot find what you need here, you might want to check out one of these other Node.js mock servers:
+
+- [JSON Server](https://github.com/typicode/json-server)
+- [mockserver](https://github.com/namshi/mockserver)
+- [node-mock-server](https://github.com/smollweide/node-mock-server)
+- [node-easymock](https://github.com/CyberAgent/node-easymock)
+- [mockserver-node](https://github.com/jamesdbloom/mockserver-node)
\ No newline at end of file
```
