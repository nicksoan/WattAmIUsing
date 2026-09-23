---
name: Loadprint
description: A household electricity timetable for private, pattern-first analysis.
colors:
  utility-ink: "#132218"
  worksheet-paper: "#f4f7e9"
  worksheet-depth: "#e8edd7"
  signal-lime: "#c8f135"
  signal-lime-dark: "#7ba20b"
  measured-mint: "#9fc8aa"
  rule: "#aeb9a3"
  muted-ink: "#526056"
  clean-paper: "#fbfcf7"
  error: "#a12f2f"
typography:
  display:
    fontFamily: "Aptos Narrow, Bahnschrift Condensed, Franklin Gothic Medium, sans-serif"
    fontSize: "clamp(3.4rem, 7vw, 6rem)"
    fontWeight: 900
    lineHeight: 0.89
    letterSpacing: "-0.035em"
  headline:
    fontFamily: "Aptos Narrow, Bahnschrift Condensed, Franklin Gothic Medium, sans-serif"
    fontSize: "clamp(1.45rem, 2.2vw, 2.1rem)"
    fontWeight: 900
    lineHeight: 1
  body:
    fontFamily: "Aptos Narrow, Bahnschrift Condensed, Franklin Gothic Medium, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.45
  label:
    fontFamily: "Aptos Narrow, Bahnschrift Condensed, Franklin Gothic Medium, sans-serif"
    fontSize: "0.76rem"
    fontWeight: 900
    letterSpacing: "0.08em"
rounded:
  square: "0"
spacing:
  tight: "8px"
  control: "12px"
  section: "34px"
components:
  button-primary:
    backgroundColor: "{colors.signal-lime}"
    textColor: "{colors.utility-ink}"
    rounded: "{rounded.square}"
    padding: "11px 17px"
    height: "44px"
  input:
    backgroundColor: "{colors.clean-paper}"
    textColor: "{colors.utility-ink}"
    rounded: "{rounded.square}"
    padding: "7px 8px"
    height: "42px"
---

# Design System: Loadprint

## Overview

**Creative North Star: "The Household Load Worksheet"**

Loadprint treats energy data like a marked-up utility timetable: compressed, precise, tactile, and immediately useful. Dense evidence sits on pale worksheet surfaces while deep utility ink establishes hierarchy. Signal lime marks queried periods and active decisions rather than decorating neutral space.

The system feels operational rather than financial. Charts, ruled separations, square fields, and measured labels create confidence without imitating a generic business analytics product.

**Key Characteristics:**
- Squared utility controls and hard rules
- Condensed, uppercase display hierarchy
- Signal lime reserved for active windows and primary action
- Dense charts balanced by plain, readable working surfaces
- Flat composition with structural depth only

## Colors

Restrained neutral fields carry most of each screen; signal lime identifies selection and action.

### Primary
- **Signal Lime:** Active query ranges, selected data, and primary controls.
- **Dark Signal Lime:** Small status marks and darker supporting accent.

### Secondary
- **Measured Mint:** Unselected data bars and chart areas.

### Neutral
- **Utility Ink:** Main text, borders, chart lines, and high-contrast regions.
- **Worksheet Paper:** Main canvas.
- **Worksheet Depth:** Query rails and secondary work surfaces.
- **Rule:** Dividers and graph scaffolding.
- **Muted Ink:** Supporting copy and axis labels.
- **Clean Paper:** Inputs and findings surfaces.

**The Signal Means Selection Rule.** Lime indicates an active time window, selected state, or primary action; it does not decorate passive containers.

## Typography

**Display Font:** Aptos Narrow with Bahnschrift Condensed and Franklin Gothic Medium fallbacks  
**Body Font:** Same condensed workhorse stack  
**Label Font:** Same stack in bold uppercase

**Character:** Narrow letterforms preserve chart and control density while oversized uppercase headings resemble utility posters and printed operating sheets.

### Hierarchy
- **Display** (900, responsive 3.4–6rem, 0.89): Single first-view statement.
- **Headline** (900, responsive 1.45–2.1rem, 1): Section names and findings.
- **Body** (400, 1rem, 1.45): Explanations, capped near 65 characters where practical.
- **Label** (900, 0.76rem, 0.08em tracking, uppercase): Controls, statuses, and measurement context.

**The Compression Rule.** Large type may be narrow and tightly set; body copy keeps normal tracking and generous line height.

## Layout

Desktop analysis uses a sticky 310px query rail beside a fluid evidence canvas. Major regions separate with one-pixel ink rules rather than card gaps. Summary measurements form one continuous dark strip. At 980px the query rail becomes a three-column control band; at 680px it becomes one column and summary data becomes a two-column grid.

Section padding scales from 22px to 52px. Tight control groups use 7–12px gaps; evidence sections use 28–34px heading separation.

## Elevation & Depth

System stays flat by default. Borders and tonal fields establish most depth. Offset shadow (`8px 10px 26px rgba(19, 34, 24, 0.12)`) appears only for temporary notices and an actively dragged file target.

**The Flat Worksheet Rule.** Permanent analysis surfaces do not float.

## Shapes

Controls, panels, cells, and notices use square corners. Circular geometry belongs only to chart points and the oversized intake-page crop. One-pixel strokes define interactive boundaries; dashed strokes are reserved for file drop targets.

## Components

### Buttons
- **Shape:** Square with one-pixel utility-ink border.
- **Primary:** Signal lime, bold uppercase label, 11px by 17px padding, offset hard shadow.
- **Hover / Focus:** Primary compresses its hard shadow; focus receives a three-pixel utility-ink outline.
- **Secondary:** Transparent at rest, then inverts to utility ink on hover.

### Chips
- **Style:** Small square text controls with a quiet rule border.
- **State:** Active chips use signal lime and an ink border.

### Cards / Containers
- **Corner Style:** Square.
- **Background:** Worksheet or clean paper according to information density.
- **Shadow Strategy:** None at rest.
- **Border:** Shared one-pixel rules replace isolated card shells.

### Inputs / Fields
- **Style:** Clean paper, one-pixel utility-ink border, 42px height.
- **Focus:** Three-pixel utility-ink outline with offset.
- **Error:** Error notices use deep red and explicit recovery text.

### Navigation
- **Style:** Compact sticky masthead with hand-built load bars, uppercase wordmark, privacy stamp, and one-pixel lower rule.

### Load Profile

Twenty-four bars form a timetable rather than a generic chart. Measured mint shows context; signal lime with an ink stroke shows the queried window.

## Do's and Don'ts

### Do:
- **Do** join related evidence into ruled regions instead of separate floating cards.
- **Do** keep lime meaningful by tying it to selection or action.
- **Do** label charts with units, time context, and non-colour cues.
- **Do** preserve usable density on desktop and deliberate stacking on mobile.

### Don't:
- **Don't** add rounded dashboard tiles or soft ambient shadows.
- **Don't** use lime as an arbitrary highlight on passive copy.
- **Don't** hide the query controls behind a modal.
- **Don't** replace the load profile or heatmap with decorative summary graphics.
