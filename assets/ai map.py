import os
import json

RESTRICTED_FOLDERS = {'.devcontainer', '.github', '.vscode', 'content', 'images', 'public', 'temp', 'exampleSite', 'hextra-starter-template', 'i18n'}

def map_directory(path='.', top_level=True):
    """Create minimal directory map."""
    try:
        files = []
        folders = []
        
        for item in sorted(os.listdir(path)):
            if os.path.isfile(os.path.join(path, item)):
                files.append(item)
            elif os.path.isdir(os.path.join(path, item)):
                if item in RESTRICTED_FOLDERS:
                    if top_level:
                        folders.append(item)
                else:
                    sub_items = map_directory(os.path.join(path, item), False)
                    if sub_items:
                        folders.append([item, sub_items])
        
        return [files, folders] if files or folders else None
        
    except PermissionError:
        return None

def main():
    name = os.path.basename(os.path.abspath('.'))
    result = map_directory()
    if result:
        with open(f"{name}_full_map_AI.json", 'w') as f:
            json.dump([name, result], f)

if __name__ == "__main__":
    main()