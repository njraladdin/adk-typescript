@echo off
REM Setup script for local development on Windows
REM This links the local adk-typescript package and starts auto-rebuild

echo Building the project...
call npm run build

echo Linking adk-typescript globally...
call npm link

echo.
echo Setup complete!
echo.
echo Starting watch mode for auto-rebuild on changes...
echo Press Ctrl+C to stop watching.
echo.
echo In another terminal, you can now run examples:
echo   npx ts-node examples/quickstart/agent.ts
echo.
echo Changes to src/ will auto-rebuild!
echo.

call npm run build:watch
