simple version: 
- get original python repo new commits 
- get current issues on the typescript repo
- check which of those commits are not already reported in the issues
- agent checks if an issue is mentioned in the commits, get related issues and comments on those commits 
- use llm to analyze what changed  
- create new issue on typescript repo 

agent: 
- context about how we ported the python project to typescript, and his job is to report new updates in the typescript repo 
- gets command to check for now commits on the original python repo 
- uses tool to get commits that were not reported in the issues 


