import os
import glob

directory = 'c:/Users/PC/Documents/whitewidow.github.io/portfolio/sections'
files = glob.glob(os.path.join(directory, '*.html'))

for filepath in files:
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    modified = False
    
    # Add gallery navigation buttons
    if 'gallery-nav-btn' not in content and '<div class="gallery-grid">' in content:
        content = content.replace('<div class="gallery-grid">', '<button class="gallery-nav-btn gallery-prev" aria-label="Previous image"></button>\n        <button class="gallery-nav-btn gallery-next" aria-label="Next image"></button>\n\n        <div class="gallery-grid">')
        modified = True
        
    # Add javascript if missing
    if 'muestras-gallery.js' not in content and '</body>' in content:
        content = content.replace('</body>', '    <script src="muestras-gallery.js"></script>\n</body>')
        modified = True
        
    if modified:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f'Fixed {os.path.basename(filepath)}')
