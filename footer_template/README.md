# Footer template

A reusable, framework-free footer based on the FE Studios footer. Plain HTML, CSS,
and a 3-line JS snippet — works in any site (static HTML, WordPress, React, etc.).

## Files

- **`footer_template.html`** — open this in a browser to preview. It contains
  three clearly marked copy blocks: the `<style>`, the `<footer>`, and the
  `<script>`.

## Drop it into another site (e.g. MunchSprouts)

1. Copy the `<footer class="site-footer"> … </footer>` block into your page, just
   before `</body>`.
2. Copy the `<style> … </style>` block into your stylesheet or page `<head>`.
   Every class is prefixed `site-footer`, so it won't clash with existing styles.
3. Copy the `<script>` block so the copyright year updates itself.
4. Edit the parts marked `<!-- EDIT -->`: brand name, tagline, links, and email.

## Use your logo instead of the text wordmark

In the brand block, replace the `<span class="site-footer__wordmark">` with:

```html
<img src="assets/logo.png" alt="MunchSprouts" width="160" height="40" />
```

## Re-theme it

Change the CSS variables at the top of the `.site-footer` rule:

| Variable       | Controls                  |
| -------------- | ------------------------- |
| `--sf-bg`      | Background colour         |
| `--sf-fg`      | Primary text / headings   |
| `--sf-muted`   | Secondary text            |
| `--sf-faint`   | Labels and fine print     |
| `--sf-border`  | Hairline dividers         |
| `--sf-accent`  | Link hover colour         |
| `--sf-max`     | Content max width         |

### Dark version

Add the dark modifier class to the footer:

```html
<footer class="site-footer site-footer--dark">
```

The dark theme tokens are already defined in the stylesheet.
