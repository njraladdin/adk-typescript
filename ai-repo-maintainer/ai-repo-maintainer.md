


workflow:
- get unreported commits on python repo 
- choose one commit
- get more context on commit (related issues and comments) 
- get commit diffs 
- agent analyzes what changed 
- create new issue on typescript repo 



future: agent actually implements the changes and submits a PR


TODO:
- include diffs in the issue body (already have tool, so just update agent instructions), done 

- analysis step: get typesciprt port docs, add implementation steps section: 
we give typescirpt project docs (dcos overfiew + file structure), we give ported proejct docs (overview + file structure). we give the diffs. 
so body includes:
IMPLEMENTATION SECTION: 
overview of changes 
implementation steps, instructions on how to port the changes, which equivilent files to update 

options:
- provide tool to get typesciprt docs and file structure + provide python diffs -> implementation steps 
- provide tool to get repo file structure + tool to get file content from a repo -> agent reads necessary files -> implementation steps 
it gets file structure of both repos, it gets the file content of the typescript repo equivivlent files of the diffs file -> implementation steps 



- no need for vector embeddings, you can just grab the file equivilent form the other project then update each file with the changes (and getting more context by also providing the import tmodules files if context sizes allows it )
