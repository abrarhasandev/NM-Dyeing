import os
import re

ICON_MAP = {
    "FaEdit": "Pencil",
    "FaUser": "User",
    "FaFillDrip": "Droplet",
    "FaCalendarAlt": "Calendar",
    "MdDeleteForever": "Trash2",
    "MdDelete": "Trash2",
    "FaArrowLeft": "ArrowLeft",
    "FaChevronDown": "ChevronDown",
    "FaChevronUp": "ChevronUp",
    "FaLock": "Lock",
    "FaTimes": "X",
    "FaCheckCircle": "CheckCircle",
    "FaPrint": "Printer",
    "FaPencilAlt": "Pencil",
    "LuTrash2": "Trash2",
    "IoClose": "X",
    "IoChevronDown": "ChevronDown",
    "IoChevronUp": "ChevronUp",
    "CiGrid41": "LayoutGrid",
    "FaTrash": "Trash2",
    "FaPlus": "Plus",
    "IoLogoWhatsapp": "Phone",
    "FaEye": "Eye",
    "FaFileInvoiceDollar": "FileText",
    "FaRegEdit": "Pencil",
    "FaSave": "Save",
    "FaSearch": "Search",
    "TiTick": "Check",
    "FaCheckSquare": "CheckSquare",
    "FaRegSquare": "Square"
}

def process_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Find all react-icons imports
    # Example: import { FaEdit, FaUser } from "react-icons/fa";
    # Sometimes it spans multiple lines.
    import_pattern = re.compile(r'import\s+\{([^}]+)\}\s+from\s+["\']react-icons/[a-z0-9]+["\'];?', re.MULTILINE)
    
    matches = import_pattern.findall(content)
    if not matches:
        return False
        
    icons_to_add = set()
    icons_to_replace = []

    for match in matches:
        icons = [i.strip() for i in match.split(',')]
        for icon in icons:
            if not icon: continue
            if icon in ICON_MAP:
                icons_to_add.add(ICON_MAP[icon])
                icons_to_replace.append((icon, ICON_MAP[icon]))
            else:
                # Fallback to just using the name without prefix if not in map (risky, but we mapped all above)
                print(f"Warning: {icon} not in map, skipping.")

    if not icons_to_replace:
        return False

    # Remove the old imports
    content = import_pattern.sub('', content)

    # Check if lucide-react is already imported
    lucide_import_pattern = re.compile(r'import\s+\{([^}]+)\}\s+from\s+["\']lucide-react["\'];?', re.MULTILINE)
    lucide_match = lucide_import_pattern.search(content)

    if lucide_match:
        existing_icons = set([i.strip() for i in lucide_match.group(1).split(',') if i.strip()])
        existing_icons.update(icons_to_add)
        new_import = f'import {{ {", ".join(sorted(existing_icons))} }} from "lucide-react";'
        content = lucide_import_pattern.sub(new_import, content)
    else:
        new_import = f'import {{ {", ".join(sorted(icons_to_add))} }} from "lucide-react";\n'
        # Add it after the last import or at the top
        last_import = content.rfind("import ")
        if last_import != -1:
            end_of_line = content.find("\n", last_import)
            content = content[:end_of_line+1] + new_import + content[end_of_line+1:]
        else:
            content = new_import + content

    # Replace JSX tags
    for old_icon, new_icon in icons_to_replace:
        # Replace <FaEdit ... /> or <FaEdit>
        content = re.sub(rf'<{old_icon}\b', f'<{new_icon}', content)
        content = re.sub(rf'</{old_icon}>', f'</{new_icon}>', content)

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)
    
    print(f"Updated {filepath}")
    return True

if __name__ == "__main__":
    for root, dirs, files in os.walk('src'):
        for file in files:
            if file.endswith(('.js', '.jsx', '.ts', '.tsx')):
                filepath = os.path.join(root, file)
                process_file(filepath)
