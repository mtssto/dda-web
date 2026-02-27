import os
import glob
import re

target_dir = r"c:\Users\PC\Documents\whitewidow.github.io\portfolio\sections"
html_files = glob.glob(os.path.join(target_dir, "*.html"))

skip_files = ["obras.html", "videos.html", "tutorialModerno.html"]

# Regex pattern for the navbar header and side drawer. Note the dotall usage.
pattern_header = re.compile(r'<header class="navbar">.*?</aside>', re.DOTALL)
pattern_body = re.compile(r'<body class="has-navbar">')
pattern_css = re.compile(r'<link rel="stylesheet" href="artist-gallery.css">')
pattern_script = re.compile(r'<!-- Global Navigation Logic -->\s*<script src="../../navbar.js"></script>')

replacement_header = '<div class="close-container"><a href="../../muestras/muestras.html" class="close-btn">CLOSE</a></div>'

for fpath in html_files:
    filename = os.path.basename(fpath)
    if filename in skip_files:
        continue
        
    print(f"Processing {filename}...")
    
    with open(fpath, 'r', encoding='utf-8') as f:
        content = f.read()
        
    new_content = pattern_header.sub(replacement_header, content)
    new_content = pattern_body.sub('<body class="minimal-gallery">', new_content)
    
    if pattern_css.search(new_content):
        new_content = pattern_css.sub('<link rel="stylesheet" href="muestras-gallery.css">', new_content)
    # Ensure css gets added if not replacing old one.
    if '<link rel="stylesheet" href="muestras-gallery.css">' not in new_content:
        new_content = new_content.replace('</head>', '    <link rel="stylesheet" href="muestras-gallery.css">\n</head>')
        
    new_content = pattern_script.sub('', new_content)
    
    with open(fpath, 'w', encoding='utf-8') as f:
        f.write(new_content)
        
print("Successfully processed the gallery pages.")
