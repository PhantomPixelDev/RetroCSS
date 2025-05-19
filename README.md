# RetroCSS

A retro-inspired CSS framework that brings the nostalgic Windows 95/98 aesthetic to modern web applications.

## Features

- **Authentic Retro Look**: Carefully crafted to mimic the classic Windows 95/98 UI
- **Modern CSS**: Built with modern CSS features while maintaining the retro aesthetic
- **Responsive**: Works on all screen sizes while preserving the retro feel
- **Modular JS**: Organized component-based JavaScript architecture using ES modules
- **Dark Mode**: Built-in dark mode support
- **Accessible**: Designed with accessibility in mind
- **Data Attribute API**: Use data attributes for easy component triggers (modals, toasts, tooltips, etc.)
- **Beautiful Examples**: Includes dashboard, blog, login, register, and more, all with retro style

## Installation

### NPM

```bash
npm install retrocss
```

### CDN

```html
<!-- CSS -->
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/retrocss/dist/retro.min.css">

<!-- JavaScript -->
<script src="https://cdn.jsdelivr.net/npm/retrocss/dist/retro.min.js"></script>
```

### Download

Download the latest release from GitHub and include the CSS and JS files in your project:

```html
<link rel="stylesheet" href="path/to/retro.min.css">
<script src="path/to/retro.min.js"></script>
```

## Usage

RetroCSS provides a wide range of components and utilities to build retro-styled interfaces:

```html
<div class="retro-card">
  <div class="retro-card-header">Windows 95</div>
  <div class="retro-card-content">
    <p>Welcome to RetroCSS!</p>
    <button class="retro-btn retro-btn-primary">OK</button>
  </div>
</div>
```

See the [documentation](documentation.html) for detailed usage instructions and examples.

### Example Pages

Check out the beautiful, ready-to-use examples in the `examples/` folder:

- [Dashboard](examples/dashboard.html)
- [Blog](examples/blog.html)
- [Blog Post](examples/blog-post.html)
- [Login](examples/login.html)
- [Register](examples/register.html)

Each page demonstrates best practices, retro layouts, and interactive components.

## JavaScript Architecture & Data Attribute API

RetroCSS uses a modular JavaScript architecture with ES modules. All interactive components can be triggered via JavaScript or data attributes:

```javascript
// Import all components (bundled version)
import RetroCSS from 'retrocss';

// Initialize all components
RetroCSS.init();

// Use individual components
RetroCSS.modal.show('myModal');
RetroCSS.toast.show('Hello World', { type: 'success' });
```

**Data Attribute API Example:**

```html
<!-- Show a toast on click -->
<button data-retro-toast="Hello from RetroCSS!">Show Toast</button>

<!-- Show a modal on click -->
<button data-retro-modal="myModal">Open Modal</button>
```

## HTML Toasts

Show toast notifications with rich HTML content:

```html
<button 
  data-retro-toast="<b>Custom Toast</b><br>With <i>HTML</i> content!" 
  data-retro-toast-html>
  Show Custom Toast
</button>
```

Or via JavaScript:

```javascript
RetroCSS.toast.show('<b>Custom Toast</b><br>With <i>HTML</i> content!', { html: true });
```

> **Note:** Only use trusted HTML for toasts. HTML toasts get a `.retro-toast-html` class for custom styling.

## Customization

RetroCSS can be customized using CSS variables:

```css
:root {
  --retro-primary: #0000aa;
  --retro-success: #008000;
  --retro-danger: #ff0000;
  --retro-body-bg: #c0c0c0;
  /* And many more variables */
}

/* Dark mode customization */
[data-theme="dark"] {
  --retro-body-bg: #3a3a3a;
  --retro-primary: #00aaff;
  /* Override other variables for dark mode */
}
```

## Browser Support

RetroCSS supports all modern browsers:

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Opera (latest)

## Development

Clone the repository:

```bash
git clone https://github.com/phantompixeldev/retrocss.git
cd retrocss
npm install
```

Build the project:

```bash
npm run build
```

Watch for changes:

```bash
npm run watch
```

## License

MIT
