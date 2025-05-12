


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
tool too apply diffs 

flow:
agent should already have typescript files + python commit diffs from previous steps 
agent writes the diffs for each typescript file 
it uses too to apply the diffs (also saved locally in tmp folder for debugging)
tool return full file, it reviews it and make adjustemnets accrodingly, then review again etc. 

QUESTION: 
are we providing too many tools to the agent? should we delegate impelmenting changes to another agent? 


- agent submits a PR : create new branch, update files, submits PR:
when all files are updated with diffs, it creates a new branch
it uses tool to push each updated file into branch
it uses tool creates a new pull request 


- when checking the PR branch, run "git diff main...HEAD" command and copy into cursor to verify the changes with Claude sonnet 

- deploy agent to cloudrun 
