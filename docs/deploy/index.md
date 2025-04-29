# Deploying Your Agent

Once you've built and tested your agent using ADK TypeScript,
the next step is to deploy it so it can be accessed, queried, and used in
production or integrated with other applications. Deployment moves your agent
from your local development machine to a scalable and reliable environment.

<img src="../assets/deploy-agent.png" alt="Deploying your agent">

## Deployment Options

Your ADK TypeScript agent can be deployed to a range of different environments based
on your needs for production readiness or custom flexibility:

### Agent Engine in Vertex AI

[Agent Engine](agent-engine.md) is a fully managed auto-scaling service on Google Cloud
specifically designed for deploying, managing, and scaling AI agents built with
frameworks such as ADK TypeScript. It provides a serverless deployment experience with
automatic scaling, high availability, and simple management.

Learn more about [deploying your agent to Vertex AI Agent Engine](agent-engine.md).

### Cloud Run

[Cloud Run](https://cloud.google.com/run) is a managed auto-scaling compute platform on
Google Cloud that enables you to run your agent as a container-based
application. It's a great option for when you need more control over your deployment
while still benefiting from managed infrastructure.

Learn more about [deploying your agent to Cloud Run](cloud-run.md).

### Google Kubernetes Engine (GKE)

[GKE](https://cloud.google.com/kubernetes-engine) is Google Cloud's managed Kubernetes service
that gives you the highest degree of control and customization for your agent deployment. This is
ideal for complex production scenarios with specific networking, scaling, or integration requirements.

Learn more about [deploying your agent to GKE](gke.md).
