import { Command } from 'commander';

/**
 * Command that shows full help on error instead of just the error message.
 * 
 * A custom Commander Command class that overrides the default error handling
 * behavior to display the full help text when a required argument is missing,
 * followed by the error message. This provides users with better context
 * about command usage without needing to run a separate --help command.
 */
export class HelpfulCommand extends Command {
  /**
   * Override the error handling to show help text before errors.
   * This is called when Commander encounters an error during parsing.
   */
  error(message: string, options?: { exitCode?: number; code?: string }): never {
    // Show the help text first
    this.outputHelp();
    
    // Then show the error message in red
    console.error(`\n\x1b[31mError: ${message}\x1b[0m`);
    
    // Exit with error code (defaults to 1, but can be overridden)
    process.exit(options?.exitCode ?? 1);
  }

  /**
   * Override the missing argument handling to show help text.
   * This is called when a required argument is missing.
   */
  missingArgument(name: string): never {
    // Show the help text first
    this.outputHelp();
    
    // Then show the missing argument error in red
    console.error(`\n\x1b[31mError: Missing required argument '${name}'\x1b[0m`);
    
    // Exit with error code 2 (similar to Python's ctx.exit(2))
    process.exit(2);
  }

  /**
   * Override parse to catch missing arguments and show help.
   */
  parse(argv?: readonly string[], options?: { from: 'node' | 'electron' | 'user' }): this {
    try {
      return super.parse(argv, options);
    } catch (error: any) {
      // If it's a missing argument error, show help
      if (error.code === 'commander.missingArgument') {
        this.missingArgument(error.argument);
      }
      
      // If it's any other error, use our custom error handler
      this.error(error.message);
    }
  }
} 