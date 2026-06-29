import os

directory = r'c:\Users\adityachaturvedi\Desktop\alphamind-ai\frontend\src'

count = 0
for root, _, files in os.walk(directory):
    for file in files:
        if file.endswith('.tsx') or file.endswith('.ts'):
            path = os.path.join(root, file)
            with open(path, 'r', encoding='utf-8') as f:
                content = f.read()
            
            new_content = content.replace('bg-slate-900 dark:bg-white dark:bg-slate-900', 'bg-white dark:bg-slate-900')
            new_content = new_content.replace('bg-slate-900 dark:bg-white', 'bg-white')
            new_content = new_content.replace('hover:bg-slate-900 dark:hover:bg-white dark:hover:bg-slate-900', 'hover:bg-slate-100 dark:hover:bg-slate-900')
            new_content = new_content.replace('hover:bg-slate-900 dark:bg-white', 'hover:bg-slate-100')
            
            if new_content != content:
                with open(path, 'w', encoding='utf-8') as f:
                    f.write(new_content)
                count += 1
                print(f'Fixed {file}')

print(f"Total files fixed: {count}")
