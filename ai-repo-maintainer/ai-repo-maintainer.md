


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
- include commit url in the issue body

handle commits where w replaced big files like 
https://github.com/google/adk-python/commit/6dec235c13f42f1a6f69048b30fb78f48831cdbd
set a max char limit for the diffs 

- handle commits that are too large to be processed. 

- agent able to implement the changes and submit a PR

- update readme to mention this is maintaned by AI agent 

- deploy agent to cloudrun 
