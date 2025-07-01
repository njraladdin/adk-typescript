import { BaseTool } from './BaseTool';
import { ToolContext } from './ToolContext';
import { LlmRequest } from '../models/LlmRequest';
import { FunctionDeclaration, Schema, Content, Part } from '../models/types';

/**
 * A tool that loads the artifacts and adds them to the session.
 */
export class LoadArtifactsTool extends BaseTool {
  constructor() {
    super({
      name: 'load_artifacts',
      description: 'Loads the artifacts and adds them to the session.',
    });
  }

  /**
   * Get the function declaration for this tool
   */
  protected _getDeclaration(): FunctionDeclaration | null {
    return {
      name: this.name,
      description: this.description,
      parameters: {
        type: 'object',
        properties: {
          artifact_names: {
            type: 'array',
            items: {
              type: 'string'
            }
          }
        }
      }
    };
  }

  /**
   * Execute the tool
   */
  async execute(args: Record<string, any>, toolContext: ToolContext): Promise<any> {
    const artifactNames: string[] = args.artifact_names || [];
    return { artifact_names: artifactNames };
  }

  /**
   * Process the LLM request to add artifact information
   */
  async processLlmRequest({ 
    toolContext, 
    llmRequest 
  }: { 
    toolContext: ToolContext, 
    llmRequest: LlmRequest 
  }): Promise<void> {
    await super.processLlmRequest({ toolContext, llmRequest });
    await this.appendArtifactsToLlmRequest(toolContext, llmRequest);
  }

  /**
   * Append artifacts to the LLM request
   */
  private async appendArtifactsToLlmRequest(
    toolContext: ToolContext, 
    llmRequest: LlmRequest
  ): Promise<void> {
    const artifactNames = await toolContext.listArtifacts();
    if (!artifactNames || artifactNames.length === 0) {
      return;
    }

    // Tell the model about the available artifacts
    const instruction = `You have a list of artifacts:
${JSON.stringify(artifactNames)}

When the user asks questions about any of the artifacts, you should call the
\`load_artifacts\` function to load the artifact. Do not generate any text other
than the function call.
`;

    llmRequest.appendInstructions([instruction]);

    // Attach the content of the artifacts if the model requests them
    // This only adds the content to the model request, instead of the session
    if (llmRequest.contents && llmRequest.contents.length > 0) {
      const lastContent = llmRequest.contents[llmRequest.contents.length - 1];
      if (lastContent.parts && lastContent.parts.length > 0) {
        const lastPart = lastContent.parts[0];
        if (lastPart.functionResponse && lastPart.functionResponse.name === 'load_artifacts') {
          const requestedArtifactNames = lastPart.functionResponse.response['artifact_names'];
          for (const artifactName of requestedArtifactNames) {
            const artifact = toolContext.loadArtifact(artifactName);
            if (artifact) {
              llmRequest.contents.push({
                role: 'user',
                parts: [
                  { text: `Artifact ${artifactName} is:` } as Part,
                  artifact
                ]
              } as Content);
            }
          }
        }
      }
    }
  }
}

/**
 * Pre-instantiated load artifacts tool
 */
export const loadArtifactsTool = new LoadArtifactsTool(); 