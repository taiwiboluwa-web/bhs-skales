Pet Widget (Standalone embeddable)

This repository contains a single-file, dependency-free JavaScript widget that can be embedded on any website to render a lightweight 2.5D pet overlay.

Features
- Single-file script: pet-widget.js
- Easy embed via <script> tag
- Finite state machine: Idle, Walk, Sit, Talk
- Screen-boundary aware walking and simple collision limits
- Dynamic skin tint via setColor
- Extracts basic page metadata (title, meta description, first h1) and summarizes it in the pet's speech bubble
- Pointer-events disabled for the overlay so it won't block host page interactions

Quick start
1) Host pet-widget.js on your server (or copy the file into your project)
2) Add this to the host page's HTML (at the end of <body>):

<script src="/pet-widget.js"></script>
<script>
  // Initialize with optional config
  PetWidget.init({ color: '#d5a74a', scale: 1 })
</script>

API
- PetWidget.init(opts) => returns API instance
  - opts.color: hex string (default '#d5a74a')
  - opts.scale: numeric scale (default 1)
- api.setColor(hex) => change pet color
- api.start() / api.stop() => control animation
- api.destroy() => remove widget and cleanup
- api.getMetadata() => returns { title, description, h1 }

Notes
- The widget is designed to be lightweight and avoid external dependencies. It draws the pet using canvas and positions a non-interactive speech bubble.
- If you want the bubble to accept pointer events (links, dismiss), alter pet-widget.js and change bubble style pointerEvents.

License
- Use and adapt as you like; add license file if required.
