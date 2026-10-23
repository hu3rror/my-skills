---
name: ui-visual-polish
description: Polish UI visual design and hierarchy — color, typography, spacing, alignment, motion, copy, and information order.
disable-model-invocation: true
---

# UI Visual Polish

Apply these rules when refining an interface. Prefer subtraction and restraint. Produce the revised UI (code or description) and list the concrete changes made.

## Color

- Replace every color with the closest match from **Radix UI Colors**.
- Follow Radix's scale and usage conventions (backgrounds, borders, text, accents, contrast).

## Typography

- Use at most three font sizes (never more than four).
- Floor at 12px.
- Prefer weight, color, and spacing over additional sizes to establish hierarchy.

## Alignment & Shape

- Align optically, not just by numbers.
- Prefer concentric radii on nested rounded elements.
- Use 0.5px borders when a line is required.
- Apply radius and shadow only when they serve a clear functional purpose; keep values modest and consistent with the component's role.

## Motion

- Default to no transition.
- When motion is required: `ease-out`, 250ms.

## Copy

- Write for the actual audience of the screen: clear, precise, appropriately formal.
- Keep length matched to the function; avoid filler and invented terms.
- Remove the middle-dot “·” wherever it appears as a separator.

## Hierarchy & Decoration

- Build hierarchy with type scale, weight, color, and whitespace.
- Keep Eyebrow / Overline text only when it adds classification, context, or key information the main heading does not already carry.
- Avoid decorative left-edge accent lines on cards.

## Interaction & Information Architecture

- Minimize interactions that force the user to decide before proceeding.
- Place unavoidable choices where the user already expects to choose.
- Rank information by priority and reorganize for clear order.

## Completion

Every modified surface must satisfy the rules above. Report the changes made.
