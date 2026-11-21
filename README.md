# FlashCard App

A simple, effective flashcard web application for focused studying and memorization. Create your own flashcard decks to study any subject with a clean, distraction-free interface.

## Features

- Simple, clean interface for focused studying
- Mobile-friendly design for studying anywhere
- Light/Dark theme with system preference detection
- Card picker with direct navigation by card number, ID, or question preview
- Random and Linear study modes
- Quick web search for more information
- Keyboard navigation (arrow keys, space/enter to flip)
- Track your progress with card counter
- No signup or installation required

## Quick Start

1. **Fork this repository** to your GitHub account
2. **Add your flashcard decks** as JSON files in the `/data` directory (see below for format)
3. **Deploy to GitHub Pages** or any static hosting service

## Creating Flashcard Decks

1. Create a new JSON file in the `/data` directory
2. Use this simple format:
   ```json
   {
     "name": "My Study Deck",
     "description": "Brief description of these flashcards",
     "searchContext": "Optional subject for web searches",
     "cards": [
       {
         "termID": "my-deck-001",
         "term": "Question or term to study",
         "definition": "The answer or definition"
       },
       {
         "term": "Another question",
         "definition": "Another answer"
       }
     ]
   }
   ```

3. Your new deck will automatically appear in the category dropdown

The optional `termID` accepts a string or number and appears in the lower-right
corner of both sides of the card.

A `term` or `definition` can mix text and inline SVG diagrams. Use a
`viewBox` to help each diagram scale and a `title` or `aria-label` to describe
it. Explain More uses the question text and any diagram labels.

```json
{
  "term": "Name this shape: <svg viewBox='0 0 80 40' width='80'><title>Round shape</title><circle cx='40' cy='20' r='15' fill='currentColor'/></svg>",
  "definition": "A shape whose boundary is the same distance from its center."
}
```

Diagrams support static shapes, paths, groups, and text labels. Malformed SVG
and other card text display literally.

### Rich card content

Set `termFormat` or `definitionFormat` to `"rich"` to let that side mix basic
HTML, SVG, and native MathML. Each flag is optional and applies only to its side.

```json
{
  "term": "What is the area of a triangle?",
  "definitionFormat": "rich",
  "definition": "<p>Use the <strong>base</strong> and the perpendicular height.</p><math display='block'><mi>A</mi><mo>=</mo><mfrac><mn>1</mn><mn>2</mn></mfrac><mi>b</mi><mi>h</mi></math>"
}
```

Use basic HTML for paragraphs, emphasis, lists, code, subscripts, and
superscripts. MathML supports common notation such as fractions, roots,
subscripts, superscripts, and matrices. Omit `display='block'` to place a formula
within a sentence. The Geometry deck includes a card with a labeled SVG
triangle and a MathML answer.

## Running Locally

For testing your decks before deploying:

1. Install a simple HTTP server:
   ```bash
   npm install -g http-server
   ```
2. Start the server:
   ```bash
   http-server -p 8080
   ```
3. Open `http://localhost:8080` in your browser

## Deploying Your Study App

### GitHub Pages (Easiest)
1. Push your repository to GitHub
2. Go to Settings > Pages
3. Select the `main` branch and click Save
4. Your study app will be available at `yourusername.github.io/your-repo-name`

### Other Hosting
This is a static web app, so it can be hosted anywhere that serves HTML/CSS/JS:
- Netlify
- Vercel
- Cloudflare Pages
- Any web hosting service

## Tips for Effective Studying

- Keep cards focused on one concept
- Use Random to study a shuffled deck or Linear to follow the deck's original order
- The "Explain More" button opens Bing for additional context
- Study in short, frequent sessions for best retention

## Example Decks

Included example decks:
- Technical Support Fundamentals
- Computer Networking Basics

## License

MIT Licensed. Use this app to create study materials for any subject.
