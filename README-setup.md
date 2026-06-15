# Setup Instructions for Local Development

## ⚠️ Important: Use a Local Server

The chess piece images will **only load when using a local server**. Opening `index.html` directly in your browser (using `file://` protocol) will block the images due to browser security restrictions.

## How to Run Locally

### Option 1: Python (Recommended if you have Python installed)

```bash
# Python 3
python -m http.server 8000

# Python 2
python -m SimpleHTTPServer 8000
```

Then open: **http://localhost:8000** in your browser

### Option 2: Node.js

```bash
# Install http-server globally (one-time setup)
npm install -g http-server

# Run from the project directory
http-server .
```

Then open: **http://localhost:8080** in your browser (or whatever port is shown)

### Option 3: VS Code Live Server Extension

1. Install the "Live Server" extension in VS Code
2. Right-click `index.html` and select "Open with Live Server"
3. Your browser will open automatically

### Option 4: GitHub Pages (Production)

If you have GitHub Pages enabled on your repository, the site will work automatically at:
```
https://aaravhig2.github.io/max-stockfish
```

## Troubleshooting

- **Images still not showing?** Make sure you're accessing via `http://localhost` or `https://` (GitHub Pages), NOT `file://`
- **Port already in use?** Try a different port: `python -m http.server 9000`
- **Browser cache?** Hard refresh with `Ctrl+Shift+R` (or `Cmd+Shift+R` on Mac)

## File Structure

```
max-stockfish/
├── index.html
├── app.js
├── style.css
├── stockfish.js
├── stockfish.wasm
└── img/
    └── chesspeices/
        └── wikipedia/
            ├── wK.png (White King)
            ├── wQ.png (White Queen)
            ├── wR.png (White Rook)
            ├── wB.png (White Bishop)
            ├── wN.png (White Knight)
            ├── wP.png (White Pawn)
            ├── bK.png (Black King)
            ├── bQ.png (Black Queen)
            ├── bR.png (Black Rook)
            ├── bB.png (Black Bishop)
            ├── bN.png (Black Knight)
            └── bP.png (Black Pawn)
```

## Now You're Ready!

Run your local server and enjoy playing chess against Stockfish! 🎯
