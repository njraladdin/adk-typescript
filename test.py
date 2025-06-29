import subprocess

def get_changed_files_from_commit(commit_hash):
    """Returns a list of changed files in the given commit."""
    result = subprocess.run(
        ["git", "diff-tree", "--no-commit-id", "--name-only", "-r", commit_hash],
        capture_output=True,
        text=True,
        check=True,
        encoding="utf-8"
    )
    return result.stdout.strip().split('\n')

def get_file_content(commit_hash, file_path):
    """Gets the full content of the file at the given commit."""
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

def get_file_diff(commit_hash, file_path):
    """Gets the diff for a specific file in a commit."""
    try:
        result = subprocess.run(
            ["git", "show", commit_hash, "--", file_path],
            capture_output=True,
            text=True,
            check=True,
            encoding="utf-8"
        )
        return result.stdout
    except subprocess.CalledProcessError:
        print(f"Skipping file (error diffing): {file_path}")
        return None

def main():
    commit_hash = "ee674ce0efef136a160cb4ed7fc62417aa259380"
    output_file = "test.txt"

    try:
        files = get_changed_files_from_commit(commit_hash)
        with open(output_file, 'w', encoding='utf-8') as f:
            for file_path in files:
                f.write(f"\n\n=== FILE: {file_path} ===\n")

                diff = get_file_diff(commit_hash, file_path)
                if diff:
                    f.write("\n--- DIFF ---\n")
                    f.write(diff)

                content = get_file_content(commit_hash, file_path)
                if content:
                    f.write("\n--- FULL CONTENT ---\n")
                    f.write(content)
        print(f"Diffs and file contents saved to {output_file}")
    except subprocess.CalledProcessError as e:
        print("Error:", e.stderr)

if __name__ == "__main__":
    main()
