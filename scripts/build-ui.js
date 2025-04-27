/**
 * Simple script to copy UI files for deployment
 * Works on both Windows and Unix-based systems
 * 
 * Copies UI files to src/cli/browser directory to match the Python implementation
 */

const fs = require('fs');
const path = require('path');

// Define paths
const sourceDir = path.join(__dirname, '../src/web/ui');
const targetDir = path.join(__dirname, '../src/cli/browser');

// Create target directory if it doesn't exist
if (!fs.existsSync(targetDir)) {
  console.log(`Creating directory: ${targetDir}`);
  fs.mkdirSync(targetDir, { recursive: true });
}

// Read source directory
const files = fs.readdirSync(sourceDir);

// Copy each file
files.forEach(file => {
  const sourcePath = path.join(sourceDir, file);
  const targetPath = path.join(targetDir, file);
  
  // Skip directories for simplicity
  if (fs.statSync(sourcePath).isDirectory()) {
    console.log(`Skipping directory: ${file}`);
    return;
  }
  
  // Copy the file
  fs.copyFileSync(sourcePath, targetPath);
  console.log(`Copied: ${file}`);
});

console.log('UI build completed successfully!');
console.log(`Files are now available in ${targetDir}`); 