# Vibe Design Talk — Fix Hack Learn

> **Working title:** "Design Is Not Decoration: How to Vibe Design (and Actually Communicate)"
> **Speaker:** Nick McVeigh
> **Collaborator:** Greg Gonyea
> **Event:** Fix Hack Learn
> **Format:** ~30 min, half lecture / half interactive walkthrough
> **Medium:** Vibe-coded web presentation (the presentation IS the demo)

---

## The Big Idea

Design isn't about making things look pretty. It's about **visual communication** — making ideas legible, reactive, and dynamic. With AI tools, this skill is now accessible to everyone: PMs, engineers, anyone with an idea worth showing.

This talk teaches people how to **vibe design** — not vibe code an app, but use AI to illustrate, communicate, and prototype ideas at a level of fidelity that used to require a design team. The presentation itself is the first lesson: everything the audience sees has been vibe coded.

### The Bret Victor Thread

The computer is a **dynamic medium** — it can simulate, respond, and reveal things that static media can't (ref: Bret Victor, "The Dynamic Medium"). This presentation embodies that argument. We're not *talking about* the dynamic medium — we're *delivering the talk inside one.*

---

## What This IS / What This ISN'T

| What This IS | What This ISN'T |
|---|---|
| How to use design as a communication tool | A tutorial on XDS (Xbox Design System) |
| How to illustrate ideas and prototype visuals | A guide to vibe-coding production features |
| How to speak the language of design | A way to replace designers |
| How to convey ideas people can react to | Specific to any one design system or framework |

---

## Goals

**For the audience:**
- They leave understanding that visual communication is a skill they can learn, not a talent they lack
- They have a working vocabulary of ~10-15 design concepts they can use immediately
- They have tools to start (design partner skill, Figma MCP, terminology reference)
- They see their own work differently — specs, pitches, prototypes all become opportunities for visual communication

**For Nick:**
- Establish as the person at Xbox who understands design + AI intersection
- Share the design partner skill and Figma MCP workflow with a broader audience
- Career-positioning talk as much as educational

**For the org:**
- People communicate ideas better — better pitches, better specs, better prototypes
- Shared vocabulary for talking about design across disciplines

---

## Themes

1. **The medium is the message.** The presentation itself is the first lesson.
2. **Vocabulary unlocks quality.** The difference between AI slop and good output is knowing what to ask for.
3. **Design is communication, not decoration.** You're not making things pretty — you're making ideas legible.
4. **Ideas are cheap. Illustration is the new literacy.** The people who can SHOW their ideas have a massive advantage.
5. **The dynamic medium.** The computer enables new forms of communication that static documents can't match. Embrace it.

---

## Narrative Arc (5 Beats)

### Beat 1 — The Hook (2-3 min)
> "Everything you're seeing right now was vibe coded."

Let the presentation land. 3D objects, smooth transitions, interactive elements. The audience absorbs the experience before any teaching happens. Then: *"This is what we're going to learn how to do."*

### Beat 2 — The Reframe (5 min)
> "Vibe design ≠ vibe coding."

Open with the dynamic medium concept (Bret Victor). Include the 2023 illustrations Nick created. Reframe the conversation: this isn't about building apps with AI. It's about **visual communication** — making ideas legible, dynamic, reactive. A PM doesn't need to prototype an app. They need to communicate a *vision* that people can react to.

**What this IS / What this ISN'T** goes here.

### Beat 3 — The Vocabulary (7-8 min)
> "You need to speak the language."

Teach design concepts THROUGH the presentation, not as a lecture. As the audience moves through sections:
- Tooltips highlight hierarchy in the layout
- Animations demonstrate spacing and rhythm
- Component breakdowns show how a card is composed
- Each concept appears in context, not in a bullet list

Key vocabulary to cover: hierarchy, spacing, typography, components, layout, composition, states, interaction patterns, content structure, visual weight.

### Beat 4 — The Workflow (10 min)
> "Here's how it actually works."

Walk through the actual process:
- Figma MCP connection
- The design partner skill
- How vocabulary transforms prompts (before/after examples)
- **The toggle mechanic:** Show the same information as a vibe-coded UI AND as a mermaid diagram / architecture doc. Let the audience see the connection. Animate between views.
- Maybe show a real example: "A PM wants to communicate a publishing portal concept" → here's the mermaid doc → here's the visual prototype → toggle between them

### Beat 5 — The Takeaway (3-5 min)
> "What you're leaving with."

Not a list of tools — a mindset shift. Design is communication. You now have the words to participate. Resources:
- Design partner skill files
- Figma MCP setup guide
- Terminology cheat sheet / reference card
- Key design vocabulary (~10-15 terms)

---

## Presentation Design System

### Layout
- **50/50 split:** Content (left) + Illustration/Interactive (right)
- Content side: text, explanations, key points
- Display side: the thing being discussed — UI components, diagrams, interactive demos, 3D objects

### Navigation
- **Arrow key pagination** — press right/left to advance through states
- Each "page" is a **state transition**, not a new frame — things animate in/out, zoom, morph
- States are segmented (clear chapters) but transitions feel fluid and continuous

### Global UI
- **Header:** Persistent, minimal
- **Page indicator (top right):** Subtle — current page number + next topic preview
- **Consistent animation language:** All transitions use the same easing/timing family to feel cohesive

### Animation Style
- **Text:** Floaty, gentle. Softly appears on screen. Not snappy or mechanical.
- **Transitions:** Smooth tweens between states. Elements morph, zoom, slide — not cut.
- **Interactive elements:** Tooltips on hover, toggleable views (UI ↔ diagram)
- **3D objects:** Floating in background, subtle dynamic behavior (maybe scroll-reactive or gyroscope-tied)
- **Overall feel:** Gentle, confident, polished. Not flashy for flash's sake — every animation serves the teaching.

### Visual Identity
- Clean, generous white space (ref: halfof8.com aesthetic)
- Bold typography
- Restrained color palette — let the content breathe
- 3D accents, not 3D overload
- No logos or branding clutter — this is about the ideas

---

## Assets Needed

- [ ] Nick's 2023 Bret Victor / dynamic medium illustrations (to be exported as PDF and shared)
- [ ] Design partner skill files (for audience distribution)
- [ ] Figma MCP setup guide (written or linked)
- [ ] UI component examples for the vocabulary section
- [ ] Mermaid diagram examples for the toggle mechanic
- [ ] 3D objects / models for background elements
- [ ] Terminology cheat sheet / reference card for takeaway

---

## Technical Stack (Actual)

This presentation is a single `index.html` file — no build tools, no bundler, no framework. Pure web.

| Layer | Technology | Purpose |
|---|---|---|
| **Structure** | Vanilla HTML | Semantic sections per slide |
| **Styling** | CSS custom properties | Design system tokens (colors, spacing, type, timing) |
| **Animation** | CSS transitions + keyframes | 6 transition types, per-slide theming, weather effects |
| **Navigation** | Vanilla JS state machine | Arrow key pagination, touch/swipe, Home/End |
| **3D** | Three.js + OBJLoader + MTLLoader | Voxel apartment scene, floating objects |
| **3D Assets** | MagicaVoxel → OBJ export | apt-11 (apartment), sputnik (satellite) |
| **Live Data** | wttr.in API | Real-time Seattle weather driving CSS animations |
| **Video** | YouTube iframe | Bret Victor embed with theatrical CSS reflection |
| **Theming** | CSS class toggle (html.light) | Dark/light mode with sun/moon toggle |
| **Color Themes** | data-theme attributes | Per-slide palette overrides (blue, teal, purple, warm) |
| **Dev Server** | `python -m http.server 3000` | Local preview at localhost:3000 |

### How It Was Built

1. **Brainstorm** — Talked through the concept, themes, narrative arc, and design principles in conversation
2. **Brief** — Captured everything in README.md before writing any code
3. **Source material** — Extracted content + illustrations from a 2024 PowerPoint talk
4. **Scaffold** — Generated the initial 15-slide HTML with all content, navigation, and design tokens
5. **Enhance** — Layered in weather effects, video embed, varied transitions, color themes
6. **3D** — Added Three.js scene with MagicaVoxel voxel art models
7. **Iterate** — Continuous refinement through conversation

The entire process — from "I want to give a talk" to a working interactive presentation with 3D, live weather, and 18 slides — happened in a single evening session.

---

## Status

- [x] Concept brainstorm
- [x] Narrative arc defined
- [x] Design system principles defined
- [ ] Detailed content outline per beat
- [ ] Asset collection (2023 illustrations, component examples)
- [ ] Build scaffolding (React project setup)
- [ ] Build Beat 1 (Hook)
- [ ] Build Beat 2 (Reframe)
- [ ] Build Beat 3 (Vocabulary)
- [ ] Build Beat 4 (Workflow)
- [ ] Build Beat 5 (Takeaway)
- [ ] Polish, animation pass, 3D integration
- [ ] Test run with Greg
- [ ] Deliver at Fix Hack Learn
