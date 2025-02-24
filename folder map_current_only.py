import os
from datetime import datetime

def create_folder_map():
    # Get current directory
    current_dir = os.getcwd()
    
    # Get current folder name
    current_folder_name = os.path.basename(current_dir)
    
    # Get list of all items in current directory
    items = os.listdir(current_dir)
    
    # Create output filename with current folder name
    output_file = f"{current_folder_name} current map.txt"
    
    # Write items to file
    with open(output_file, 'w', encoding='utf-8') as f:
        f.write(f"{current_folder_name} Folder Map: {current_dir}\n")
        f.write("-" * 50 + "\n\n")
        
        # List folders first
        f.write("Folders:\n")
        for item in sorted(items):
            if os.path.isdir(item):
                f.write(f"📁 {item}\n")
        
        # Then list files
        f.write("\nFiles:\n")
        for item in sorted(items):
            if os.path.isfile(item):
                f.write(f"📄 {item}\n")

if __name__ == "__main__":
    create_folder_map()