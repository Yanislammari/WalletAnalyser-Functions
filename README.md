# WalletAnalyser Functions

WalletAnalyser Functions is the serverless layer of the WalletAnalyser platform.  
It is built on **Azure Functions** and handles two types of workloads that are intentionally kept separate from the main backend:

- **Targeted HTTP triggers** — lightweight, single-purpose endpoints for specific operations that benefit from isolated, serverless execution (e.g. data enrichment, heavy computations, third-party integrations)
- **Cron jobs (Timer triggers)** — scheduled tasks that run automatically at defined intervals, such as syncing market data, refreshing asset prices, or cleaning up stale records

This separation keeps the core backend lean and ensures long-running or scheduled tasks do not impact API response times.

---

## 🚀 Purpose of the Functions Layer

- Execute scheduled background tasks (cron jobs) independently of the backend
- Handle specific processing operations that are too heavy or too infrequent for the main API
- Integrate with external services (market data providers, blob storage, database) in a serverless context
- Scale independently from the rest of the platform

---

## 🛠️ Tech Stack

- **Node.js 20**
- **TypeScript**
- **Azure Functions v4**
- **Azure App Service Plan (B1)**
- **Azure Blob Storage**
- **PostgreSQL**
- **GitHub Actions** (CI/CD)
- **Terraform** (infrastructure provisioning)

---

## 📦 Running the Project Locally

### Prerequisites

**1. Node.js 20 via nvm** (Node 23+ is not supported by Azure Functions v4):

```bash
nvm install 20
nvm use 20
node --version  # should print v20.x.x
```

**2. Azure Functions Core Tools v4:**

```bash
brew tap azure/functions
brew install azure-functions-core-tools@4
func --version  # should print 4.x.x
```

> If Homebrew fails due to outdated Command Line Tools, download the binary directly:
> ```bash
> curl -L "https://cdn.functions.azure.com/public/4.0.273114/Azure.Functions.Cli.osx-arm64.4.10.0.zip" -o func.zip
> unzip func.zip -d func-cli && chmod +x func-cli/func
> sudo ln -sf $(pwd)/func-cli/func /usr/local/bin/func
> ```

---

### Setup & Start

Install dependencies:

```bash
npm install
```

Build the TypeScript project:

```bash
npm run build
```

Start the local Functions runtime:

```bash
func start
```

Functions will be available at:

```
http://localhost:7071/api/{functionName}
```

---

## 🔧 Environment Variables

Create a `local.settings.json` (take `local.settings.json.example` for example) at the project root for local development (this file is gitignored):

```json
{
  "IsEncrypted": false,
  "Values": {
    "AzureWebJobsStorage": "UseDevelopmentStorage=true",
    "FUNCTIONS_WORKER_RUNTIME": "node",
    "DATABASE_URL": "xxxx",
    "MARKETSTACK_API_URL": "xxxx",
    "MARKETSTACK_API_KEY": "xxxx"
  }
}
```

In production, these values are injected via Terraform as Azure Function App settings.

---

## 🧹 Code Linting & Formatting

ESLint (Flat Config) and Prettier are used to maintain a consistent and professional codebase.

Run linting:

```bash
npm run lint
```

Format the code before pushing:

```bash
npm run format
```

---

## ☁️ Azure Deployment (CI/CD)

A GitHub Actions pipeline automatically:

1. Checks out the repository
2. Sets up Node.js 20
3. Installs dependencies
4. Builds the TypeScript project
5. Logs into Azure
6. Deploys the zip package directly to the Azure Function App (`walletanalyser-functions`)

No Docker image is involved — deployment uses Azure Functions native zip deploy via `Azure/functions-action`.

---

## 📄 Available Commands

`npm install`  
`npm run build`  
`npm run lint`  
`npm run format`  
`func start`

---

## ⚡ Functions Reference

### `MyFirstFunction`

| Property | Value |
|---|---|
| **Type** | HTTP Trigger |
| **Method** | GET, POST |
| **Route** | `/api/MyFirstFunction` |
| **Auth level** | Function |
| **Status** | 🧪 Test function |

**Description**

Test function used to verify that the Azure Functions runtime, deployment pipeline, and local development environment are working correctly. Not intended for production use.

**Example request**

```bash
curl -X GET "http://localhost:7071/api/MyFirstFunction?name=WalletAnalyser"
```

**Example response**

```
Hello, WalletAnalyser!
```

---

### `SyncAssetPricesHttp`

| Property | Value |
|---|---|
| **Type** | HTTP Trigger |
| **Method** | GET, POST |
| **Route** | `/api/SyncAssetPricesHttp` |
| **Auth level** | Function |
| **File** | `src/functions/SyncAssetPricesTrigger.ts` |

**Description**

Manually triggers the asset price synchronisation. Fetches the latest end-of-day prices for the configured number of assets from the Marketstack API and upserts them into the `AssetPrices` table. Useful for on-demand syncs or debugging without waiting for the scheduled timer.

**Example request**

```bash
curl -X GET "http://localhost:7071/api/SyncAssetPricesHttp"
```

**Example response**

```json
{
  "processedAt": "2026-05-11T04:20:00.000Z",
  "message": "Asset prices synchronized successfully"
}
```

---

### `SyncAssetPricesTimer`

| Property | Value |
|---|---|
| **Type** | Timer Trigger |
| **Schedule** | `0 0 * * *` (every day at midnight UTC) |
| **File** | `src/functions/SyncAssetPricesTimer.ts` |

**Description**

Scheduled job that runs automatically every day at midnight UTC. Performs the same price synchronisation as `SyncAssetPricesHttp` — fetches the latest prices from Marketstack and upserts them into the database. Requires Azurite (or a real Azure Storage connection) to manage timer state locally.

---
