# Astra Music — Download Page

Landing page for Astra Music (premium Android music streaming app).

## Structure
```
astra-music-download/
├── index.html      # Main page (HTML only)
├── css/
│   └── style.css    # All styles
├── js/
│   └── script.js    # Download button logic
└── README.md
```

## Note
`index.html` references `manifest.json` — add your PWA manifest file
in this same folder if you have one, otherwise remove that `<link>` tag.

## Push to GitHub (Termux)

```bash
cd astra-music-download
git init
git add .
git commit -m "Initial commit: split HTML/CSS/JS"
git branch -M main
git remote add origin https://github.com/<your-username>/astra-music-download.git
git push -u origin main
```

Agar repo already GitHub pe bana chuka hai to `git init` ke baad seedha
`remote add` aur `push` kar sakta hai.
