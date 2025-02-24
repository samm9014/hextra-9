import os
import time

def add_file_path_comments():
    print(f"[DEBUG] Starting script execution")
    current_dir = os.getcwd()
    parent_folder = os.path.basename(current_dir)
    print(f"[DEBUG] Current directory: {current_dir}")
    print(f"[DEBUG] Parent folder name: {parent_folder}")
    print("-" * 50)
    
    files_modified = 0
    
    # Define comment styles for each file type
    comment_styles = {
        '.html': lambda path: f'{{{{/* {path} */}}}}\n',
        '.js': lambda path: f'// {path}\n',
        '.css': lambda path: f'/* {path} */\n'
    }
    
    # Function to check if file has a valid path comment with correct extension
    def has_valid_path_comment(content, ext):
        first_line = content.split('\n')[0].strip() if content else ''
        # Remove the extension's dot for checking
        ext_check = ext[1:]  # converts '.html' to 'html'
        
        if ext == '.html':
            return (first_line.startswith('{{/*') and 
                   first_line.endswith('*/}}') and 
                   '/' in first_line and 
                   ext_check in first_line)
        elif ext == '.js':
            return (first_line.startswith('//') and 
                   '/' in first_line[2:] and 
                   ext_check in first_line)
        elif ext == '.css':
            return (first_line.startswith('/*') and 
                   first_line.endswith('*/') and 
                   '/' in first_line and 
                   ext_check in first_line)
        return False
    
    def format_path(rel_path, parent_folder):
        # Split the path into parts
        path_parts = rel_path.split('/')
        
        # Check if 'layouts' or 'assets' is in the path
        for special_dir in ['layouts', 'assets']:
            if special_dir in path_parts:
                # Find the index of the special directory
                special_dir_index = path_parts.index(special_dir)
                # Return path starting from the special directory
                return '/'.join(path_parts[special_dir_index:])
        
        # If no special directories found, return the path with parent folder
        return f"{parent_folder}/{rel_path}"
    
    # Walk through current directory and subdirectories
    for root, dirs, files in os.walk('.'):
        print(f"\n[DEBUG] Checking directory: {root}")
        print(f"[DEBUG] Found {len(files)} files in this directory")
        
        for file in files:
            file_ext = os.path.splitext(file)[1].lower()
            
            if file_ext in comment_styles:
                file_path = os.path.join(root, file)
                print(f"[DEBUG] Found {file_ext} file: {file_path}")
                
                # Get relative path and ensure it uses forward slashes
                rel_path = os.path.relpath(file_path, '.')
                rel_path = rel_path.replace('\\', '/')
                
                # Format the path according to the new rules
                formatted_path = format_path(rel_path, parent_folder)
                
                try:
                    print(f"[DEBUG] Reading file content...")
                    # Read the current content of the file
                    with open(file_path, 'r', encoding='utf-8') as f:
                        content = f.read()
                    
                    # Check for valid path comment with correct extension
                    if not has_valid_path_comment(content, file_ext):
                        print(f"[DEBUG] Adding path comment to file...")
                        comment = comment_styles[file_ext](formatted_path)
                        
                        # Write the comment and original content back to the file
                        with open(file_path, 'w', encoding='utf-8') as f:
                            f.write(comment + content)
                        print(f"[SUCCESS] Added path comment to: {formatted_path}")
                        files_modified += 1
                    else:
                        print(f"[SKIP] File already has a valid path comment: {formatted_path}")
                except Exception as e:
                    print(f"[ERROR] Failed processing {formatted_path}: {str(e)}")
            else:
                print(f"[DEBUG] Skipping unsupported file: {file}")
    
    print("\n" + "=" * 50)
    print(f"[SUMMARY] Total files modified: {files_modified}")
    print(f"[SUMMARY] Script execution completed")
    print("=" * 50)

# Run the main function
print("\n=== File Path Comment Adder ===")
print("Supports HTML, JS, and CSS files")
print("[DEBUG] Script started at:", time.strftime("%Y-%m-%d %H:%M:%S"))
print("-" * 50)
add_file_path_comments()
print("\n[INFO] Press Enter to close this window...")
input()