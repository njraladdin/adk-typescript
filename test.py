import subprocess

def get_changed_files_from_commit(commit_hash):
    """Returns a list of files changed in the given commit."""
    result = subprocess.run(
        ["git", "diff-tree", "--no-commit-id", "--name-only", "-r", commit_hash],
        capture_output=True,
        text=True,
        check=True,
        encoding="utf-8"
    )
    return result.stdout.strip().split('\n')

def get_file_content(commit_hash, file_path):
    """Returns the content of the file at the given commit or None if it fails."""
    try:
        result = subprocess.run(
            ["git", "show", f"{commit_hash}:{file_path}"],
            capture_output=True,
            check=True
        )
        return result.stdout.decode("utf-8", errors="replace")
    except subprocess.CalledProcessError:
        print(f"Skipping file (error reading): {file_path}")
        return None

def main():
    commit_hash = "4c4cfb74ae1066c4920f599b03b6cccae8d4c069"
    output_file = "test.txt"

    try:
        files = get_changed_files_from_commit(commit_hash)
        with open(output_file, 'w', encoding='utf-8') as f:
            for file_path in files:
                content = get_file_content(commit_hash, file_path)
                if content is not None:
                    f.write(f"=== {file_path} ===\n")
                    f.write(content)
                    f.write("\n\n")
        print(f"Only changed files saved to {output_file}")
    except subprocess.CalledProcessError as e:
        print("Error:", e.stderr)

if __name__ == "__main__":
    main()
