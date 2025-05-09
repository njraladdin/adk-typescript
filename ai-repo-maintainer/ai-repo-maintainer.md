


workflow:
- get unreported commits on python repo 
- choose one commit
- get more context on commit (related issues and comments) 
- get commit diffs 
- agent analyzes what changed 
- create new issue on typescript repo 



future: agent actually implements the changes and submits a PR


TODO:
- include diffs in the issue body (already have tool, so jsut update agent instructions)

- no need for vector embeddings, you can just grab the file equivilent form the other project then update each file with the changes (and getting more context by also providing the import tmodules files if context sizes allows it )
