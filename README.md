# Agroly Lanka — website

Static marketing site for Agroly Lanka Pvt Ltd, a Sri Lankan sustainable
agriculture company working across greenhouse construction, agricultural
consultancy, hydroponics, and coco peat and coir based growing media.

Plain HTML, CSS and vanilla JavaScript. No build step, no dependencies, no
framework. Open `index.html` in a browser and it works.

---

## Running it locally

Any static file server will do:

```bash
python3 -m http.server 8000
# then open http://localhost:8000
```

Opening `index.html` straight from the filesystem also works — every asset
path is relative and nothing is loaded from a CDN.

---

## Pages

| File | Purpose |
| --- | --- |
| `index.html` | Home |
| `about.html` | About the company |
| `greenhouse-construction.html` | Greenhouse and poly-tunnel systems |
| `agricultural-services.html` | Consultancy, irrigation, hydroponics, seeds, training |
| `growing-media.html` | Coco peat and coir products |
| `gallery.html` | Filterable photo gallery with lightbox |
| `blog.html` | Blog archive |
| `blog-post.html` | Article template — duplicate this per post |
| `contact.html` | Contact details and quotation form |

---

## Structure

```
├── index.html, about.html, …      one file per page
├── css/
│   ├── tokens.css                 design tokens — colours, type, spacing, radii, shadows
│   ├── base.css                   fonts, reset, elements, utilities
│   ├── components.css             buttons, header, footer, shared shapes
│   ├── sections.css               home page sections
│   ├── pages.css                  inner page sections
│   └── blog.css                   blog only, loaded by the two blog pages
├── js/
│   └── main.js                    all behaviour, one file, no dependencies
└── assets/
    ├── fonts/                     Fraunces + Nunito Sans, self-hosted woff2
    ├── icons/                     favicon
    └── images/                    photography, textures, gallery/
```

### Design tokens

Every colour, size, spacing step, radius, shadow and timing lives in
`css/tokens.css`. Nothing else in the CSS contains a raw colour or hard-coded
value — change a token and it changes everywhere.

The brand palette is the seven supplied colours (`--c-forest`, `--c-leaf`,
`--c-sprout`, `--c-clay`, `--c-sand`, `--c-bark`, `--c-paper`), with derived
tints and alpha variants built from them.

---

## Before this goes live

Every unresolved item is marked in the page with a dashed underline
(`class="placeholder"`), and each file has a comment block at the top listing
what it needs. In short:

- **Logo** — a text placeholder sits in the header and footer of every page.
  Search for `LOGO SLOT` and swap the `<span>` for an `<img>`.
- **WhatsApp number** — search for `94XXXXXXXXX` (this is the site's primary
  call to action, so nothing works properly until it is real).
- **Phone** — `tel:+94XXXXXXXXX`
- **Email** — `mailto:hello@example.com`
- **Address and opening hours** — marked with `class="placeholder"`
- **Facebook and Instagram** — `href="#"` in every footer
- **Map** — a marked slot on `contact.html`, waiting on the address

### The quotation form

`contact.html` has a complete, validated quotation form, but no backend. Until
an endpoint is set it validates and then tells the visitor plainly that it is
not connected, pointing them at WhatsApp.

To connect it, set the form's `action` — a form service (Formspree, Basin,
Getform), Netlify Forms, or your own handler. As soon as `action` is not empty
the JavaScript stops intercepting and the browser submits normally. Full
instructions are in the comment block at the top of the file.

### Images

All photography is currently free stock from Unsplash, chosen as visual
direction. Replace with real Agroly Lanka photographs when available.
`gallery.html` has step-by-step instructions for swapping gallery images —
each needs a `-thumb` and a `-full` version.

### Blog

The articles are sample content. They deliberately only restate things already
on the rest of the site, so nothing claims anything new about the business, but
the dates are invented and it should all be replaced. `blog-post.html` explains
how to add a real post.

---

## Notes on the build

- **Accessible by default** — semantic HTML, every form control labelled,
  keyboard support throughout (tabs, accordion, gallery lightbox, carousel),
  visible focus states, and all text verified at WCAG AA contrast or better.
- **Responsive** from 360px up, with no horizontal overflow at any width.
- **Respects `prefers-reduced-motion`** — all animation is disabled when asked.
- **Degrades without JavaScript** — `<noscript>` fallbacks reveal any content
  that would otherwise stay hidden behind an interaction.
- Images are lazy-loaded below the fold and served at responsive sizes.
