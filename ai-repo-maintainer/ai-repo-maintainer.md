


workflow:
- get unreported commits on python repo 
- choose one commit
- get more context on commit (related issues and comments) 
- get commit diffs 
- agent analyzes what changed 
- create new issue on typescript repo 




TODO:
- include diffs in the issue body (already have tool, so just update agent instructions), done 
- agent able to get file structure of TS repo, get equivilent files content, and generate detailed implementation steps section in the issue body, done 
- ignore core / bump commits, done 
- include commit url in the issue body, done 
- handle commits that are too large to be processed. parse commit diff. update instruction so the agent flags issue for human manual inspection, done 

- agent write code for the ported version:
tool to create a new branch for the PR
tool to push a file into a branch 

agent writes the diffs for each typescript file 


it fetches original python file content
it fetch equivilent typescript file


agent uses the PUT /repos/{owner}/{repo}/contents/{path} endpoint to commit file content to a branch 


- agent submits a PR : create new branch, update files, submits PR

- add instruction to issue that yo ucan switch to Pr branch, run "git diff main...HEAD" or copy issue body into cursor to verify the changes with Claude sonnet 

- deploy agent to cloudrun 
