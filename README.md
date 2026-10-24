# Amar Goswami

Single-page portfolio for Amar Goswami, Science educator. Plain HTML, CSS and JavaScript with no build step.

```
index.html          page content
css/styles.css      styles
js/main.js          background doodles, animations, email buttons, custom course builder
assets/             portrait and favicon
```

Run locally: `python -m http.server 5173`, then open http://localhost:5173.

## Contact

Every booking and contact button opens a pre-filled Gmail message to **shaanamar107@gmail.com** in a new tab.
A small link under "Send a Mail" opens the visitor's default mail app instead.
To change the address, edit `CONFIG.email` at the top of `js/main.js` and the address shown in `index.html`.

## Before going live

1. **Placeholders**: search `index.html` for `[` and fill in the verified 99%+ metric, maximum batch size,
   curricula covered, and consultation duration and fee.
2. **Photos**: two study photos load from Unsplash (free licence). Swap in Amar sir's own photos when available.
