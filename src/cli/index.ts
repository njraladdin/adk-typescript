#!/usr/bin/env node
// NOTE: If you get a 'Cannot find module \"commander\"' error, run: npm install commander @types/commander
import { Command } from 'commander';
import path from 'path';
import { runCli, runInputFile } from './cli';
import { runEvals, getEvaluationCriteriaOrDefault, getRootAgent, tryGetResetFunc, parseAndGetEvalsToRun, EvalMetric, EvalStatus, EvalCaseResult } from './cliEval';
import { toCloudRun } from './cliDeploy';
import { runCmd } from './cliCreate';
import { getAgentGraph } from './agentGraph';
import { createApiServer } from './apiServer';
import { startWebServer } from './webServer';
import * as fs from 'fs';
import { VERSION } from '../index';
import { HelpfulCommand } from './HelpfulCommand';

const program = new Command();

program
  .name('adk')
  .description('Agent Development Kit CLI tools (TypeScript port)')
  .version(VERSION);

// create
program
  .addCommand(
    new HelpfulCommand('create')
      .argument('<appName>', 'The folder name for the agent source code')
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
      })
  );

// run
program
  .addCommand(
    new HelpfulCommand('run')
      .argument('<agent>', 'The path to the agent source code folder')
      .description('Runs an interactive CLI for a certain agent.')
      .option('--save_session', 'Whether to save the session to a json file on exit.', false)
      .option('--session_id <sessionId>', 'Optional. The session ID to save the session to on exit when --save_session is set to true. User will be prompted to enter a session ID if not set.')
      .option('--replay <replayFile>', 'Path to a JSON file with initial state and user queries. Creates a new session with this state and runs the queries without interactive mode.')
      .option('--resume <resumeFile>', 'Path to a previously saved session file. Replays the session and continues in interactive mode.')
      .action(async (agentFolderName, options) => {
        // When running via `npm run`, process.cwd() is the project root.
        // INIT_CWD is an env var set by npm that holds the original CWD.
        const agentParentDir = options.parentDir || process.env.INIT_CWD || process.cwd();
        
        // Warn if graphviz is not installed
        try {
          require('graphviz');
        } catch (error) {
          console.warn('Graphviz is not installed. The "graph" command will not work.');
        }
        
        try {
          // Validate that replay and resume are not both specified
          if (options.replay && options.resume) {
            console.error('Error: The --replay and --resume options cannot be used together.');
            process.exit(1);
          }
          

          
          // Resolve the agent path more carefully
          const cwd = process.cwd();
          const agentPath = path.resolve(cwd, agentFolderName);
          
          // If agent is "." (current directory), use current directory name as agent name
          if (agentFolderName === '.') {
            const agentParentDir = path.dirname(cwd);
            const agentFolderName = path.basename(cwd);
            
            console.log(`Running agent with parent dir: ${agentParentDir}, folder name: ${agentFolderName}`);
            
            runCli({
              agentParentDir,
              agentFolderName,
              replayFile: options.replay,
              resumeFile: options.resume,
              saveSession: options.save_session,
              sessionId: options.session_id,
            });
          } else {
            const agentParentDir = path.dirname(agentPath);
            const agentFolderName = path.basename(agentPath);
            
            console.log(`Running agent with parent dir: ${agentParentDir}, folder name: ${agentFolderName}`);
            
            runCli({
              agentParentDir,
              agentFolderName,
              replayFile: options.replay,
              resumeFile: options.resume,
              saveSession: options.save_session,
              sessionId: options.session_id,
            });
          }
        } catch (error) {
          console.error('Error running agent:', error);
          process.exit(1);
        }
      })
  );

// graph
program
  .command('graph <agent>')
  .description('Generates a graph visualization of the agent and its tools.')
  .option('--output <outputFile>', 'Path to save the graph image. Default is "<agent_name>_graph.png"')
  .option('--highlight <pairs...>', 'Pairs of node names to highlight in the graph, e.g., "agent1,agent2"', [])
  .action(async (agent: string, options: any) => {
    try {
      // Import agent module and get root agent
      const agentParentDir = path.dirname(agent);
      const agentFolderName = path.basename(agent);
      const agentModulePath = path.resolve(process.cwd(), agentParentDir, agentFolderName, 'index.ts');
      
      console.log(`Loading agent from: ${agentModulePath}`);
      const agentModule = require(agentModulePath);
      
      // Get the rootAgent from the module
      const rootAgent = agentModule.rootAgent || (agentModule.default && agentModule.default.rootAgent);
      
      if (!rootAgent) {
        throw new Error(`Could not find rootAgent in module ${agentModulePath}. Make sure it exports a 'rootAgent' property.`);
      }
      
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
      const graph = await getAgentGraph(rootAgent, highlightPairs, true);
      
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
  .addCommand(
    new HelpfulCommand('eval')
      .argument('<agentModuleFilePath>', 'The path to the agent module file that contains a root_agent')
      .argument('[evalSetFilePaths...]', 'One or more eval set file paths. You can specify specific evals from a set using colon syntax: file.json:eval1,eval2')
      .description('Evaluates an agent given the eval sets.')
      .option('--config_file_path <configFilePath>', 'Optional. The path to config file.')
      .option('--print_detailed_results', 'Whether to print detailed results on console.', false)
      .action(async (agentModuleFilePath: string, evalSetFilePaths: string[], options: any) => {
        try {
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
          
          // Convert to new format for runEvals
          const evalCasesByEvalSetId: Record<string, any[]> = {};
          for (const [evalSetFile, evalIds] of Object.entries(evalSetToEvals)) {
            // For now, we'll need to load the eval set files and convert them
            // This is a simplified approach - in a real implementation you'd use the LocalEvalSetsManager
            const evalSetData = JSON.parse(require('fs').readFileSync(evalSetFile, 'utf-8'));
            const evalCases = evalSetData.filter((item: any) => !evalIds.length || evalIds.includes(item.name));
            evalCasesByEvalSetId[evalSetFile] = evalCases;
          }
          
          // Run evals and collect all results
          const evalResults: EvalCaseResult[] = [];
          for await (const result of runEvals(
            evalCasesByEvalSetId,
            rootAgent,
            resetFunc,
            evalMetrics
          )) {
            evalResults.push(result);
          }

          console.log("*********************************************************************");
          
          // Generate and print summary
          const evalRunSummary: Record<string, [number, number]> = {};
          for (const evalResult of evalResults) {
            if (!(evalResult.evalSetId in evalRunSummary)) {
              evalRunSummary[evalResult.evalSetId] = [0, 0];
            }
            if (evalResult.finalEvalStatus === EvalStatus.PASSED) {
              evalRunSummary[evalResult.evalSetId][0] += 1;
            } else {
              evalRunSummary[evalResult.evalSetId][1] += 1;
            }
          }
          
          console.log("Eval Run Summary");
          for (const [evalSetFile, passFailCount] of Object.entries(evalRunSummary)) {
            console.log(
              `${evalSetFile}:\n  Tests passed: ${passFailCount[0]}\n  Tests failed: ${passFailCount[1]}`
            );
          }
        } catch (error) {
          console.error('Error running eval:', error);
          process.exit(1);
        }
      })
  );

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
  .option('--session_db_url <sessionDbUrl>', 
    'Optional. The database URL to store the session.\n' +
    '  - Use \'agentengine://<agent_engine_resource_id>\' to connect to Agent Engine sessions.\n' +
    '  - Use \'sqlite://<path_to_sqlite_file>\' to connect to a SQLite DB.\n' +
    '  - See https://docs.sqlalchemy.org/en/20/core/engines.html#backend-specific-urls for more details on supported DB URLs.')
  .option(
    '--adk_version <adkVersion>',
    'Optional. The ADK version used in Cloud Run deployment. (default: the version in the dev environment)',
    VERSION
  )
  .action(async (agent: string, options: any) => {
    await toCloudRun({
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
      sessionDbUrl: options.session_db_url,
      adkVersion: options.adk_version,
    });
  });

// web command
program
  .command('web [agent]')
  .description('Starts a web server for agents with Socket.IO for live interaction.')
  .option('--port <port>', 'Port to run the server on.', '3000')
  .option('--allow_origin <origins...>', 'Allowed origins for CORS.', ['*'])
  .option('--reload', 'Enable auto reload for server.', true)
  .option('--no-reload', 'Disable auto reload for server.')
  .option('--session_db_url <sessionDbUrl>', 
    'Optional. The database URL to store the session.\n' +
    '  - Use \'agentengine://<agent_engine_resource_id>\' to connect to Agent Engine sessions.\n' +
    '  - Use \'sqlite://<path_to_sqlite_file>\' to connect to a SQLite DB.\n' +
    '  - See https://docs.sqlalchemy.org/en/20/core/engines.html#backend-specific-urls for more details on supported DB URLs.')
  .action((agent: string | undefined, options: any) => {
    try {
      let agentDir = '.';
      
      if (agent) {
        // If specific agent is provided, use it
        // Resolve to an absolute path to avoid path resolution issues
        agentDir = path.resolve(process.cwd(), agent);
        console.log(`Using agent directory: ${agentDir}`);
      }
      
      // Start web server with the specified directory
      startWebServer({
        agentDir,
        port: parseInt(options.port, 10),
        allowOrigins: options.allow_origin,
        sessionDbUrl: options.session_db_url,
        reload: options.reload
      });
    } catch (error) {
      console.error('Error starting web server:', error);
      process.exit(1);
    }
  });

// api_server - implement this with our new apiServer module
program
  .command('api_server')
  .description('Starts an API server for agents.')
  .option('--agent_dir <agentDir>', 'Directory containing agent modules.', '.')
  .option('--session_db_url <sessionDbUrl>', 
    'Optional. The database URL to store the session.\n' +
    '  - Use \'agentengine://<agent_engine_resource_id>\' to connect to Agent Engine sessions.\n' +
    '  - Use \'sqlite://<path_to_sqlite_file>\' to connect to a SQLite DB.\n' +
    '  - See https://docs.sqlalchemy.org/en/20/core/engines.html#backend-specific-urls for more details on supported DB URLs.')
  .option('--port <port>', 'Port to run the server on.', '8000')
  .option('--allow_origin <origins...>', 'Allowed origins for CORS.', ['*'])
  .option('--with_ui', 'Serve web UI if set.', false)
  .option('--trace_to_cloud', 'Enable Cloud Trace.', false)
  .option('--reload', 'Enable auto reload for server.', true)
  .option('--no-reload', 'Disable auto reload for server.')
  .action((options: any) => {
    try {
      const { app, server } = createApiServer({
        agentDir: options.agent_dir,
        sessionDbUrl: options.session_db_url,
        allowOrigins: options.allow_origin,
        web: options.with_ui,
        traceToCloud: options.trace_to_cloud,
        port: parseInt(options.port, 10),
        reload: options.reload
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