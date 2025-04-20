#!/usr/bin/env node
// NOTE: If you get a 'Cannot find module \"commander\"' error, run: npm install commander @types/commander
import { Command } from 'commander';
import path from 'path';
import { runCli, runInputFile } from './cli';
import { runEvals, getEvaluationCriteriaOrDefault, getRootAgent, tryGetResetFunc, parseAndGetEvalsToRun, EvalMetric } from './cliEval';
import { toCloudRun } from './cliDeploy';
import { runCmd } from './cliCreate';
import { getAgentGraph } from './agent_graph';
import { createApiServer } from './apiServer';
import * as fs from 'fs';

const program = new Command();

program
  .name('adk')
  .description('Agent Development Kit CLI tools (TypeScript port)')
  .version('0.1.0');

// create
program
  .command('create <appName>')
  .description('Creates a new app in the current folder with prepopulated agent template.')
  .option('--model <model>', 'Optional. The model used for the root agent.')
  .option('--api_key <apiKey>', 'Optional. The API Key needed to access the model.')
  .option('--project <project>', 'Optional. The Google Cloud Project for using VertexAI as backend.')
  .option('--region <region>', 'Optional. The Google Cloud Region for using VertexAI as backend.')
  .action(async (appName: string, options: any) => {
    await runCmd({
      agentName: appName,
      model: options.model,
      googleApiKey: options.api_key,
      googleCloudProject: options.project,
      googleCloudRegion: options.region,
    });
  });

// run
program
  .command('run <agent>')
  .description('Runs an interactive CLI for a certain agent.')
  .option('--save_session', 'Whether to save the session to a json file on exit.', false)
  .option('--input_file <inputFile>', 'Optional. Path to an input file to use.')
  .action((agent: string, options: any) => {
    const agentParentDir = path.dirname(agent);
    const agentFolderName = path.basename(agent);
    runCli({
      agentParentDir,
      agentFolderName,
      jsonFilePath: options.input_file,
      saveSession: options.save_session,
    });
  });

// graph
program
  .command('graph <agent>')
  .description('Generates a graph visualization of the agent and its tools.')
  .option('--output <outputFile>', 'Path to save the graph image. Default is "<agent_name>_graph.png"')
  .option('--highlight <pairs...>', 'Pairs of node names to highlight in the graph, e.g., "agent1,agent2"', [])
  .action((agent: string, options: any) => {
    try {
      // Import agent module and get root agent
      const agentParentDir = path.dirname(agent);
      const agentFolderName = path.basename(agent);
      const agentModule = require(path.join(agentParentDir, agentFolderName));
      const rootAgent = agentModule.agent.rootAgent;
      
      // Parse highlight pairs if provided
      const highlightPairs: [string, string][] = [];
      for (const pair of options.highlight) {
        const [from, to] = pair.split(',');
        if (from && to) {
          highlightPairs.push([from, to]);
        }
      }
      
      // Generate the graph
      const outputFile = options.output || `${agentFolderName}_graph.png`;
      const graph = getAgentGraph(rootAgent, highlightPairs, true);
      
      // Save the graph image
      fs.writeFileSync(outputFile, graph);
      console.log(`Graph saved to ${outputFile}`);
    } catch (error) {
      console.error('Error generating graph:', error);
      process.exit(1);
    }
  });

// eval
program
  .command('eval <agentModuleFilePath> [evalSetFilePaths...]')
  .description('Evaluates an agent given the eval sets.')
  .option('--config_file_path <configFilePath>', 'Optional. The path to config file.')
  .option('--print_detailed_results', 'Whether to print detailed results on console.', false)
  .action(async (agentModuleFilePath: string, evalSetFilePaths: string[], options: any) => {
    // Load evaluation criteria
    const evaluationCriteria = getEvaluationCriteriaOrDefault(options.config_file_path);
    const evalMetrics: EvalMetric[] = [];
    for (const metricName in evaluationCriteria) {
      evalMetrics.push({ metricName, threshold: evaluationCriteria[metricName] });
    }
    console.log(`Using evaluation criteria:`, evaluationCriteria);
    // Load agent and reset function
    const rootAgent = getRootAgent(agentModuleFilePath);
    const resetFunc = tryGetResetFunc(agentModuleFilePath);
    // Parse eval sets
    const evalSetToEvals = parseAndGetEvalsToRun(evalSetFilePaths);
    // Run evals
    for await (const result of runEvals({
      evalSetToEvals,
      rootAgent,
      resetFunc,
      evalMetrics,
      printDetailedResults: options.print_detailed_results,
    })) {
      // Print or process results as needed
      // (You can add summary logic here if desired)
    }
  });

// deploy cloud_run
program
  .command('deploy cloud_run <agent>')
  .description('Deploys an agent to Cloud Run.')
  .option('--project <project>', 'Google Cloud project to deploy the agent.')
  .option('--region <region>', 'Google Cloud region to deploy the agent.')
  .option('--service_name <serviceName>', 'The service name to use in Cloud Run.', 'adk-default-service-name')
  .option('--app_name <appName>', 'App name of the ADK API server.')
  .option('--port <port>', 'The port of the ADK API server.', '8000')
  .option('--trace_to_cloud', 'Whether to enable Cloud Trace for cloud run.', false)
  .option('--with_ui', 'Deploy ADK Web UI if set.', false)
  .option('--temp_folder <tempFolder>', 'Temp folder for the generated Cloud Run source files.')
  .option('--verbosity <verbosity>', 'Override the default verbosity level.', 'WARNING')
  .action((agent: string, options: any) => {
    toCloudRun({
      agentFolder: agent,
      project: options.project,
      region: options.region,
      serviceName: options.service_name,
      appName: options.app_name,
      tempFolder: options.temp_folder,
      port: parseInt(options.port, 10),
      traceToCloud: options.trace_to_cloud,
      withUi: options.with_ui,
      verbosity: options.verbosity,
    });
  });

// web (stub)
program
  .command('web')
  .description('Starts a web server for agents (Not implemented in TypeScript yet).')
  .action(() => {
    console.log('The "web" command is not implemented in the TypeScript CLI yet.');
  });

// api_server - implement this with our new apiServer module
program
  .command('api_server')
  .description('Starts an API server for agents.')
  .option('--agent_dir <agentDir>', 'Directory containing agent modules.', '.')
  .option('--db_url <dbUrl>', 'Database URL for session storage.', '')
  .option('--port <port>', 'Port to run the server on.', '8000')
  .option('--allow_origin <origins...>', 'Allowed origins for CORS.', ['*'])
  .option('--with_ui', 'Serve web UI if set.', false)
  .option('--trace_to_cloud', 'Enable Cloud Trace.', false)
  .action((options: any) => {
    try {
      const { app, server } = createApiServer({
        agentDir: options.agent_dir,
        sessionDbUrl: options.db_url,
        allowOrigins: options.allow_origin,
        web: options.with_ui,
        traceToCloud: options.trace_to_cloud,
        port: parseInt(options.port, 10)
      });
      
      console.log(`API server started on port ${options.port}`);
      console.log(`Agent directory: ${path.resolve(options.agent_dir)}`);
      
      // Handle graceful shutdown
      process.on('SIGINT', () => {
        console.log('Shutting down API server...');
        server.close(() => {
          console.log('API server stopped.');
          process.exit(0);
        });
      });
    } catch (error) {
      console.error('Error starting API server:', error);
      process.exit(1);
    }
  });

program.parse(process.argv); 