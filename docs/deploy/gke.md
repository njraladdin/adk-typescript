# Deploy to GKE

[GKE](https://cloud.google.com/gke) is Google Cloud's managed Kubernetes service. It allows you to deploy and manage containerized applications using Kubernetes.

To deploy your agent you will need to have a Kubernetes cluster running on GKE. You can create a cluster using the Google Cloud Console or the `gcloud` command line tool.

## Agent sample

For each of the commands, we will reference a `capital_agent` sample defined in the [Agent](../agents/index.md) documentation page. We will assume it's in a `capital_agent` directory.

To proceed, confirm that your agent code is configured as follows:

1. Agent code is in a file called `index.ts` within your agent directory.
2. Your agent variable is named `rootAgent`.
3. The agent is properly exported from the module.

## Environment variables

Set your environment variables as described in the [Setup and Installation](../get-started/installation.md) guide. You also need to install the `kubectl` command line tool. You can find instructions to do so in the [Google Kubernetes Engine Documentation](https://cloud.google.com/kubernetes-engine/docs/how-to/cluster-access-for-kubectl).

```bash
export GOOGLE_CLOUD_PROJECT=your-project-id # Your GCP project ID
export GOOGLE_CLOUD_LOCATION=us-central1 # Or your preferred location
export GOOGLE_CLOUD_PROJECT_NUMBER=$(gcloud projects describe --format json $GOOGLE_CLOUD_PROJECT | jq -r ".projectNumber")
```

If you don't have `jq` installed, you can use the following command to get the project number:

```bash
gcloud projects describe $GOOGLE_CLOUD_PROJECT
```

And copy the project number from the output.

```bash
export GOOGLE_CLOUD_PROJECT_NUMBER=YOUR_PROJECT_NUMBER
```

## Deployment commands

### gcloud CLI

You can deploy your agent to GKE using the `gcloud` and `kubectl` cli and Kubernetes manifest files.

Ensure you have authenticated with Google Cloud (`gcloud auth login` and `gcloud config set project <your-project-id>`).

### Create a GKE cluster

You can create a GKE cluster using the `gcloud` command line tool. This example creates an Autopilot cluster named `adk-cluster` in the `us-central1` region.

> If creating a GKE Standard cluster, make sure [Workload Identity](https://cloud.google.com/kubernetes-engine/docs/how-to/workload-identity) is enabled. Workload Identity is enabled by default in an AutoPilot cluster.

```bash
gcloud container clusters create-auto adk-cluster \
    --location=$GOOGLE_CLOUD_LOCATION \
    --project=$GOOGLE_CLOUD_PROJECT
```

After creating the cluster, you need to connect to it using `kubectl`. This command configures `kubectl` to use the credentials for your new cluster.

```bash
gcloud container clusters get-credentials adk-cluster \
    --location=$GOOGLE_CLOUD_LOCATION \
    --project=$GOOGLE_CLOUD_PROJECT
```

### Artifact Registry

You need to create a Google Artifact Registry repository to store your container images. You can do this using the `gcloud` command line tool.

```bash
gcloud artifacts repositories create adk-repo \
    --repository-format=docker \
    --location=$GOOGLE_CLOUD_LOCATION \
    --description="ADK repository"
```

### Project Structure

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

### Code files

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
      "description": "ADK TypeScript Agent for GKE deployment",
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

    # Set the PORT environment variable for Cloud Run compatibility
    ENV PORT=8080

    # Start the application
    CMD [ "node", "dist/server.js" ]
    ```

### Build steps

Before building the container image, compile your TypeScript code:

```bash
npm install
npm run build
```

### Build the container image

Build the container image using the `gcloud` command line tool. This example builds the image and tags it as `adk-repo/adk-agent:latest`.

```bash
gcloud builds submit \
    --tag $GOOGLE_CLOUD_LOCATION-docker.pkg.dev/$GOOGLE_CLOUD_PROJECT/adk-repo/adk-agent:latest \
    --project=$GOOGLE_CLOUD_PROJECT \
    .
```

### Configure Kubernetes Service Account for Vertex AI

If your agent uses Vertex AI, you need to create a Kubernetes service account with the necessary permissions. This example creates a service account named `adk-agent-sa` and binds it to the `Vertex AI User` role.

```bash
kubectl create serviceaccount adk-agent-sa
```

```bash
gcloud projects add-iam-policy-binding projects/${GOOGLE_CLOUD_PROJECT} \
    --role=roles/aiplatform.user \
    --member=principal://iam.googleapis.com/projects/${GOOGLE_CLOUD_PROJECT_NUMBER}/locations/global/workloadIdentityPools/${GOOGLE_CLOUD_PROJECT}.svc.id.goog/subject/ns/default/sa/adk-agent-sa \
    --condition=None
```

### Create the Kubernetes manifest files

Create a Kubernetes deployment manifest file named `deployment.yaml` in your project directory. This file defines how to deploy your application on GKE.

```yaml title="deployment.yaml"
cat <<  EOF > deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: adk-agent
spec:
  replicas: 1
  selector:
    matchLabels:
      app: adk-agent
  template:
    metadata:
      labels:
        app: adk-agent
    spec:
      serviceAccount: adk-agent-sa
      containers:
      - name: adk-agent
        image: $GOOGLE_CLOUD_LOCATION-docker.pkg.dev/$GOOGLE_CLOUD_PROJECT/adk-repo/adk-agent:latest
        resources:
          limits:
            memory: "512Mi"
            cpu: "500m"
            ephemeral-storage: "128Mi"
          requests:
            memory: "256Mi"
            cpu: "250m"
            ephemeral-storage: "128Mi"
        ports:
        - containerPort: 8080
        env:
          - name: PORT
            value: "8080"
          - name: GOOGLE_CLOUD_PROJECT
            value: "$GOOGLE_CLOUD_PROJECT"
          - name: GOOGLE_CLOUD_LOCATION
            value: "$GOOGLE_CLOUD_LOCATION"
          - name: NODE_ENV
            value: "production"
          # Add any other necessary environment variables your agent might need
---
apiVersion: v1
kind: Service
metadata:
  name: adk-agent
spec:       
  type: LoadBalancer
  ports:
    - port: 80
      targetPort: 8080
  selector:
    app: adk-agent
EOF
```

### Deploy the Application

Deploy the application using the `kubectl` command line tool. This command applies the deployment and service manifest files to your GKE cluster.

```bash
kubectl apply -f deployment.yaml
```

After a few moments, you can check the status of your deployment using:

```bash
kubectl get pods -l=app=adk-agent
```

This command lists the pods associated with your deployment. You should see a pod with a status of `Running`.

Once the pod is running, you can check the status of the service using:

```bash
kubectl get service adk-agent
```

If the output shows a `External IP`, it means your service is accessible from the internet. It may take a few minutes for the external IP to be assigned.

You can get the external IP address of your service using:

```bash
kubectl get svc adk-agent -o=jsonpath='{.status.loadBalancer.ingress[0].ip}'
```

## Testing your agent

Once your agent is deployed to GKE, you can interact with it via the deployed UI (if enabled) or directly with its API endpoints using tools like `curl`. You'll need the service URL provided after deployment.

=== "UI Testing"

    ### UI Testing

    If you deployed your agent with the UI enabled:

    You can test your agent by simply navigating to the kubernetes service URL in your web browser.

    The ADK dev UI allows you to interact with your agent, manage sessions, and view execution details directly in the browser.

    To verify your agent is working as intended, you can:

    1. Select your agent from the dropdown menu.
    2. Type a message and verify that you receive an expected response from your agent.

    If you experience any unexpected behavior, check the pod logs for your agent using:

    ```bash
    kubectl logs -l app=adk-agent
    ```

=== "API Testing (curl)"

    ### API Testing (curl)

    You can interact with the agent's API endpoints using tools like `curl`. This is useful for programmatic interaction or if you deployed without the UI.

    #### Set the application URL

    Replace the example URL with the actual URL of your deployed Kubernetes service.

    ```bash
    export APP_URL="KUBERNETES_SERVICE_URL"
    ```

    #### List available apps

    Verify the deployed application name.

    ```bash
    curl -X GET $APP_URL/list-apps
    ```

    *(Adjust the `app_name` in the following commands based on this output if needed. The default is often the agent directory name, e.g., `capital_agent`)*.

    #### Create or Update a Session

    Initialize or update the state for a specific user and session. Replace `capital_agent` with your actual app name if different. The values `user_123` and `session_abc` are example identifiers; you can replace them with your desired user and session IDs.

    ```bash
    curl -X POST \
        $APP_URL/apps/capital_agent/users/user_123/sessions/session_abc \
        -H "Content-Type: application/json" \
        -d '{"state": {"preferredLanguage": "English", "visitCount": 5}}'
    ```

    #### Run the Agent

    Send a prompt to your agent. Replace `capital_agent` with your app name and adjust the user/session IDs and prompt as needed.

    ```bash
    curl -X POST $APP_URL/run_sse \
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
