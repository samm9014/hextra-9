import os

# Define folders to ignore
IGNORED_FOLDERS = {".git", "archetypes", "data", "i18n", "node_modules", "public", "resources"}

def create_partial_map(start_path):
    """Creates a partial map of the directory (just names of files and folders)."""
    folders = []
    files = []
    for item in sorted(os.listdir(start_path)):
        full_path = os.path.join(start_path, item)
        if os.path.isdir(full_path) and item not in IGNORED_FOLDERS:
            folders.append(f"📁 {item}")
        elif os.path.isfile(full_path):
            files.append(f"📄 {item}")
    return folders, files

def create_directory_map(start_path, root_path):
    """Creates a structured map of the directory structure without extra separations."""
    output = []
    items = list(os.walk(start_path))
    
    for i, (root, dirs, files) in enumerate(items):
        folder_name = os.path.basename(root)
        # Skip ignored folders and empty folders
        if folder_name in IGNORED_FOLDERS or (not files and not dirs):
            continue
            
        # Compute indentation level
        level = root.replace(start_path, '').count(os.sep)
        
        # For each level, check if it's the last item at that level
        parts = root.replace(start_path, '').split(os.sep)[1:]
        indent = ''
        for j, part in enumerate(parts[:-1]):
            # Check if this is the last directory at this level
            parent_path = os.path.join(start_path, *parts[:j])
            siblings = [d for d in os.listdir(parent_path) if os.path.isdir(os.path.join(parent_path, d)) and d not in IGNORED_FOLDERS]
            is_last = part == sorted(siblings)[-1]
            indent += '    ' if is_last else '│   '
        
        # Add files
        for file in sorted(files):
            output.append(f"{indent}{'└── ' if file == sorted(files)[-1] and not dirs else '├── '}📄 {file}")
            
        # Append subdirectories
        sorted_dirs = sorted([d for d in dirs if d not in IGNORED_FOLDERS])
        for d in sorted_dirs:
            output.append(f"{indent}{'└── ' if d == sorted_dirs[-1] else '├── '}📁 {d}")
    
    return '\n'.join(output)

def main():
    current_dir = os.getcwd()
    dir_name = os.path.basename(current_dir)
    output_file = f"{dir_name} full map.txt"
    
    try:
        with open(output_file, 'w', encoding='utf-8') as f:
            # Write header with the proper format
            f.write(f"-------------------------\n")
            f.write(f"{dir_name} Folder Map: {current_dir}\n")
            f.write(f"-------------------------\n")
            
            # Generate and write partial map
            folders, files = create_partial_map(current_dir)
            f.write("Folders:\n")
            for folder in folders:
                f.write(f"{folder}\n")
            f.write("\nFiles:\n")
            for file in files:
                f.write(f"{file}\n")
            
            # Generate and write full directory map only for top-level folders
            for folder in folders:
                folder_path = os.path.join(current_dir, folder[2:])  # Remove "📁 " prefix
                f.write(f"\n-------------------------\n")
                f.write(f"{folder[2:]} Directory full Map: {folder_path}\n")
                f.write(f"-------------------------\n")
                folder_map = create_directory_map(folder_path, current_dir)
                f.write(folder_map + "\n")
                
        print(f"✅ Directory map has been successfully created: {output_file}")
    except Exception as e:
        print(f"❌ An error occurred: {e}")

if __name__ == "__main__":
    main()