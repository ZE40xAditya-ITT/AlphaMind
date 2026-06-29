import os

replacements = {
    'bg-[#0F172A]': 'bg-slate-50 dark:bg-slate-950',
    'bg-slate-900': 'bg-white dark:bg-slate-900',
    'bg-slate-800': 'bg-slate-100 dark:bg-slate-800',
    'border-slate-800': 'border-slate-200 dark:border-slate-800',
    'border-slate-700': 'border-slate-300 dark:border-slate-700',
    'text-slate-100': 'text-slate-900 dark:text-slate-100',
    'text-slate-200': 'text-slate-800 dark:text-slate-200',
    'text-slate-300': 'text-slate-700 dark:text-slate-300',
    'text-slate-400': 'text-slate-600 dark:text-slate-400',
    'text-slate-500': 'text-slate-500 dark:text-slate-500',
    'text-white': 'text-slate-900 dark:text-white',
    'bg-white': 'bg-slate-900 dark:bg-white',
    'glass ': 'glass dark:glass ',
}

count = 0
for root, dirs, files in os.walk('c:/Users/adityachaturvedi/Desktop/alphamind-ai/frontend/src'):
    for name in files:
        if name.endswith('.tsx'):
            f = os.path.join(root, name)
            with open(f, 'r', encoding='utf-8') as file:
                content = file.read()
            
            original = content
            for old, new in replacements.items():
                if old in content:
                    content = content.replace(old, new)
                
            if content != original:
                with open(f, 'w', encoding='utf-8') as file:
                    file.write(content)
                print(f'Updated {f}')
                count += 1
print(f'Refactored {count} TSX files!')
