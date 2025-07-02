# Deploy to Cloud Run

[Cloud Run](https://cloud.google.com/run)
is a fully managed platform that enables you to run your code directly on top of Google's scalable infrastructure.

To deploy your agent, you can use either the `adk deploy cloud_run` command (recommended), or with `gcloud run deploy` command through Cloud Run.

## Agent sample

For each of the commands, we will reference a `capital_agent` sample defined in the [Agent](../agents/index.md) documentation page. We will assume it's in a `capital_agent` directory.

To proceed, confirm that your agent code is configured as follows:

1. Agent code is in a file called `index.ts` within your agent directory.
2. Your agent variable is named `rootAgent`.
3. The agent is properly exported from the module.

## Environment variables

Set your environment variables as described in the [Setup and Installation](../get-started/installation.md) guide.

```bash
export GOOGLE_CLOUD_PROJECT=your-project-id
export GOOGLE_CLOUD_LOCATION=us-central1 # Or your preferred location
```

*(Replace `your-project-id` with your actual GCP project ID)*

## Deployment commands

=== "adk CLI"

    ###  adk CLI

    The `adk deploy cloud_run` command deploys your agent code to Google Cloud Run.

    Ensure you have authenticated with Google Cloud (`gcloud auth login` and `gcloud config set project <your-project-id>`).

    #### Setup environment variables

    Optional but recommended: Setting environment variables can make the deployment commands cleaner.

    ```bash
    # Set your Google Cloud Project ID
    export GOOGLE_CLOUD_PROJECT="your-gcp-project-id"

    # Set your desired Google Cloud Location
    export GOOGLE_CLOUD_LOCATION="us-central1" # Example location

    # Set the path to your agent code directory
    export AGENT_PATH="./capital_agent" # Assuming capital_agent is in the current directory

    # Set a name for your Cloud Run service (optional)
    export SERVICE_NAME="capital-agent-service"

    # Set an application name (optional)
    export APP_NAME="capital-agent-app"
    ```

    #### Command usage

    ##### Minimal command

    ```bash
    npx adk deploy cloud_run \
    --project=$GOOGLE_CLOUD_PROJECT \
    --region=$GOOGLE_CLOUD_LOCATION \
    $AGENT_PATH
    ```

    ##### Full command with optional flags

    ```bash
    npx adk deploy cloud_run \
    --project=$GOOGLE_CLOUD_PROJECT \
    --region=$GOOGLE_CLOUD_LOCATION \
    --service_name=$SERVICE_NAME \
    --app_name=$APP_NAME \
    --with_ui \
    $AGENT_PATH
    ```

    ##### Arguments

    * `AGENT_PATH`: (Required) Positional argument specifying the path to the directory containing your agent's source code (e.g., `$AGENT_PATH` in the examples, or `capital_agent/`). This directory must contain your main agent file (e.g., `index.ts`).

    ##### Options

    * `--project TEXT`: (Required) Your Google Cloud project ID (e.g., `$GOOGLE_CLOUD_PROJECT`).
    * `--region TEXT`: (Required) The Google Cloud location for deployment (e.g., `$GOOGLE_CLOUD_LOCATION`, `us-central1`).
    * `--service_name TEXT`: (Optional) The name for the Cloud Run service (e.g., `$SERVICE_NAME`). Defaults to `adk-default-service-name`.
    * `--app_name TEXT`: (Optional) The application name for the ADK API server (e.g., `$APP_NAME`). Defaults to the name of the directory specified by `AGENT_PATH` (e.g., `capital_agent` if `AGENT_PATH` is `./capital_agent`).
    * `--agent_engine_id TEXT`: (Optional) If you are using a managed session service via Vertex AI Agent Engine, provide its resource ID here.
    * `--port INTEGER`: (Optional) The port number the ADK API server will listen on within the container. Defaults to 8000.
    * `--with_ui`: (Optional) If included, deploys the ADK dev UI alongside the agent API server. By default, only the API server is deployed.
    * `--temp_folder TEXT`: (Optional) Specifies a directory for storing intermediate files generated during the deployment process. Defaults to a timestamped folder in the system's temporary directory. *(Note: This option is generally not needed unless troubleshooting issues).*
    * `--help`: Show the help message and exit.

    ##### Authenticated access 
    During the deployment process, you might be prompted: `Allow unauthenticated invocations to [your-service-name] (y/N)?`.

    * Enter `y` to allow public access to your agent's API endpoint without authentication.
    * Enter `N` (or press Enter for the default) to require authentication (e.g., using an identity token as shown in the "Testing your agent" section).

    Upon successful execution, the command will deploy your agent to Cloud Run and provide the URL of the deployed service.

=== "gcloud CLI"

    ### gcloud CLI

    Alternatively, you can deploy using the standard `gcloud run deploy` command with a `Dockerfile`. This method requires more manual setup compared to the `adk` command but offers flexibility, particularly if you want to embed your agent within a custom [Express](https://expressjs.com/) application.

    Ensure you have authenticated with Google Cloud (`gcloud auth login` and `gcloud config set project <your-project-id>`).

    #### Project Structure

    Organize your project files as follows:

    ```txt
    your-project-directory/
    ├── capital_agent/
    │   └── index.ts       # Your agent code (TypeScript implementation)
    ├── src/
    │   └── server.ts      # Express server entry point
    ├── package.json       # Node.js dependencies
    ├── tsconfig.json      # TypeScript configuration
    └── Dockerfile         # Container build instructions
    ```

    Create the following files (`src/server.ts`, `package.json`, `tsconfig.json`, `Dockerfile`) in the root of `your-project-directory/`.

    #### Code files

    1. This file sets up the Express server to serve your ADK agent API:

        ```typescript title="src/server.ts"
        import express from 'express';
        import path from 'path';
        import { createApiServer } from 'adk-typescript/dist/cli/apiServer';

        // Get the directory where server.ts is located
        const AGENT_DIR = path.resolve(__dirname, '..');
        
        // Example allowed origins for CORS
        const ALLOWED_ORIGINS = ['http://localhost', 'http://localhost:8080', '*'];
        
        // Set to true if you intend to serve a web interface, false otherwise
        const SERVE_WEB_INTERFACE = true;

        // Create the API server 
        const { app, server } = createApiServer({
          agentDir: AGENT_DIR,
          sessionDbUrl: '', // Let it use default in-memory session store
          allowOrigins: ALLOWED_ORIGINS,
          web: SERVE_WEB_INTERFACE,
          port: parseInt(process.env.PORT || '8080', 10)
        });

        // You can add more Express routes or configurations below if needed
        // Example:
        // app.get('/hello', (req, res) => {
        //   res.json({ message: 'Hello World' });
        // });

        // Graceful shutdown handling
        process.on('SIGINT', () => {
          console.log('Shutting down API server...');
          server.close(() => {
            console.log('API server stopped.');
            process.exit(0);
          });
        });

        console.log(`Server running on port ${process.env.PORT || 8080}`);
        ```

    2. Configure Node.js dependencies:

        ```json title="package.json"
        {
          "name": "adk-typescript-agent",
          "version": "1.0.0",
          "description": "ADK TypeScript Agent for Cloud Run deployment",
          "main": "dist/server.js",
          "scripts": {
            "build": "tsc",
            "start": "node dist/server.js",
            "dev": "ts-node src/server.ts"
          },
          "dependencies": {
            "adk-typescript": "^0.1.0",
            "express": "^4.18.2",
            "@google-cloud/vertexai": "^0.2.1"
          },
          "devDependencies": {
            "@types/express": "^4.17.17",
            "@types/node": "^20.4.2",
            "ts-node": "^10.9.1",
            "typescript": "^5.1.6"
          },
          "engines": {
            "node": ">=18.0.0"
          }
        }
        ```

    3. Configure TypeScript:

        ```json title="tsconfig.json"
        {
          "compilerOptions": {
            "target": "ES2020",
            "module": "NodeNext",
            "moduleResolution": "NodeNext",
            "esModuleInterop": true,
            "strict": true,
            "outDir": "dist",
            "rootDir": ".",
            "skipLibCheck": true,
            "forceConsistentCasingInFileNames": true,
            "resolveJsonModule": true
          },
          "include": ["src/**/*", "capital_agent/**/*"],
          "exclude": ["node_modules", "dist"]
        }
        ```

    4. Define the container image:

        ```dockerfile title="Dockerfile"
        FROM node:18-slim
        WORKDIR /app

        # Copy package.json and package-lock.json
        COPY package*.json ./

        # Install dependencies
        RUN npm ci --only=production

        # Copy compiled TypeScript
        COPY dist/ ./dist/
        COPY capital_agent/ ./capital_agent/

        # Create a non-root user and use it
        RUN mkdir -p /home/nodeuser/.npm && \
            chown -R node:node /home/nodeuser/.npm && \
            chown -R node:node /app

        USER node

        # Start the application
        CMD [ "node", "dist/server.js" ]
        ```

    #### Build steps

    Before building the container image, compile your TypeScript code:

    ```bash
    npm install
    npm run build
    ```

    #### Deploy using `gcloud`

    Navigate to `your-project-directory` in your terminal.

    ```bash
    gcloud run deploy capital-agent-service \
    --source . \
    --region $GOOGLE_CLOUD_LOCATION \
    --project $GOOGLE_CLOUD_PROJECT \
    --allow-unauthenticated \
    --set-env-vars="GOOGLE_CLOUD_PROJECT=$GOOGLE_CLOUD_PROJECT,GOOGLE_CLOUD_LOCATION=$GOOGLE_CLOUD_LOCATION"
    # Add any other necessary environment variables your agent might need
    ```

    * `capital-agent-service`: The name you want to give your Cloud Run service.
    * `--source .`: Tells gcloud to build the container image from the Dockerfile in the current directory.
    * `--region`: Specifies the deployment region.
    * `--project`: Specifies the GCP project.
    * `--allow-unauthenticated`: Allows public access to the service. Remove this flag for private services.
    * `--set-env-vars`: Passes necessary environment variables to the running container. Ensure you include all variables required by ADK and your agent.

    `gcloud` will build the Docker image, push it to Google Artifact Registry, and deploy it to Cloud Run. Upon completion, it will output the URL of your deployed service.

    For a full list of deployment options, see the [`gcloud run deploy` reference documentation](https://cloud.google.com/sdk/gcloud/reference/run/deploy).

## Testing your agent

Once your agent is deployed to Cloud Run, you can interact with it via the deployed UI (if enabled) or directly with its API endpoints using tools like `curl`. You'll need the service URL provided after deployment.

=== "UI Testing"

    ### UI Testing

    If you deployed your agent with the UI enabled:

    *   **adk CLI:** You included the `--with_ui` flag during deployment.
    *   **gcloud CLI:** You set `SERVE_WEB_INTERFACE = true` in your `server.ts`.

    You can test your agent by simply navigating to the Cloud Run service URL provided after deployment in your web browser.

    ```bash
    # Example URL format
    # https://your-service-name-abc123xyz.a.run.app
    ```

    The ADK dev UI allows you to interact with your agent, manage sessions, and view execution details directly in the browser.

    To verify your agent is working as intended, you can:

    1. Select your agent from the dropdown menu.
    2. Type a message and verify that you receive an expected response from your agent.

    If you experience any unexpected behavior, check the [Cloud Run](https://console.cloud.google.com/run) console logs.

=== "API Testing (curl)"

    ### API Testing (curl)

    You can interact with the agent's API endpoints using tools like `curl`. This is useful for programmatic interaction or if you deployed without the UI.

    You'll need the service URL provided after deployment and potentially an identity token for authentication if your service isn't set to allow unauthenticated access.

    #### Set the application URL

    Replace the example URL with the actual URL of your deployed Cloud Run service.

    ```bash
    export APP_URL="YOUR_CLOUD_RUN_SERVICE_URL"
    # Example: export APP_URL="https://adk-default-service-name-abc123xyz.a.run.app"
    ```

    #### Get an identity token (if needed)

    If your service requires authentication (i.e., you didn't use `--allow-unauthenticated` with `gcloud` or answered 'N' to the prompt with `adk`), obtain an identity token.

    ```bash
    export TOKEN=$(gcloud auth print-identity-token)
    ```

    *If your service allows unauthenticated access, you can omit the `-H "Authorization: Bearer $TOKEN"` header from the `curl` commands below.*

    #### List available apps

    Verify the deployed application name.

    ```bash
    curl -X GET -H "Authorization: Bearer $TOKEN" $APP_URL/list-apps
    ```

    *(Adjust the `app_name` in the following commands based on this output if needed. The default is often the agent directory name, e.g., `capital_agent`)*.

    #### Create or Update a Session

    Initialize or update the state for a specific user and session. Replace `capital_agent` with your actual app name if different. The values `user_123` and `session_abc` are example identifiers; you can replace them with your desired user and session IDs.

    ```bash
    curl -X POST -H "Authorization: Bearer $TOKEN" \
        $APP_URL/apps/capital_agent/users/user_123/sessions/session_abc \
        -H "Content-Type: application/json" \
        -d '{"state": {"preferredLanguage": "English", "visitCount": 5}}'
    ```

    #### Run the Agent

    Send a prompt to your agent. Replace `capital_agent` with your app name and adjust the user/session IDs and prompt as needed.

    ```bash
    curl -X POST -H "Authorization: Bearer $TOKEN" \
        $APP_URL/run_sse \
        -H "Content-Type: application/json" \
        -d '{
        "app_name": "capital_agent",
        "user_id": "user_123",
        "session_id": "session_abc",
        "new_message": {
            "role": "user",
            "parts": [{
            "text": "What is the capital of Canada?"
            }]
        },
        "streaming": false
        }'
    ```

    * Set `"streaming": true` if you want to receive Server-Sent Events (SSE).
    * The response will contain the agent's execution events, including the final answer.
