
# Installing ADK TypeScript

## Set up your Node.js Environment

ADK TypeScript runs on Node.js. We recommend using a recent version of Node.js (v18 or higher) and npm (Node Package Manager) or yarn.

1.  **Install Node.js and npm:** If you don't have them installed, download and install them from [nodejs.org](https://nodejs.org/). npm is included with Node.js.
2.  **Create a Project Directory:**
    ```bash
    mkdir my-adk-project
    cd my-adk-project
    ```
3.  **Initialize your Project:** This creates a `package.json` file to manage dependencies.
    ```bash
    npm init -y
    ```
    *(Alternatively, use `yarn init -y` if you prefer yarn)*

## Install ADK TypeScript

Install the core ADK TypeScript library using npm (or yarn):

```bash
# Using npm
npm install adk-typescript

# Or using yarn
# yarn add adk-typescript
```

*(**Note:** Replace `adk-typescript` with the actual published package name if it differs)*.

You'll also likely need `dotenv` for managing environment variables (like API keys):

```bash
# Using npm
npm install dotenv @types/dotenv

# Or using yarn
# yarn add dotenv @types/dotenv
```

### (Optional) Verify your installation

You can check if the package was added to your `package.json` dependencies:

```json
// Example package.json excerpt
{
  // ... other fields
  "dependencies": {
    "adk-typescript": "^0.0.1-alpha.1", // Version might differ
    "dotenv": "^...",
    // ... other dependencies
  },
  "devDependencies": {
    "@types/dotenv": "^..."
    // ... other dev dependencies like typescript, @types/node
  }
}
```

Or list installed packages:

```bash
# Using npm
npm list adk-typescript

# Or using yarn
# yarn list --pattern adk-typescript
```

## Next steps

*   Try creating your first agent with the [**TypeScript Quickstart**](./quickstart.md)