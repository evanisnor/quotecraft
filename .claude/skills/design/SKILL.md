# Design, UX & UI Skills

This skill provides knowledge for creating effective user interfaces and experiences using modern design principles and Tailwind CSS.

## UX Fundamentals

### Seven Pillars of User Experience
1. **Useful** - Serve the user's actual needs (the "jobs to be done")
2. **Desirable** - Improve quality of life; overcome inertia and anxiety of switching
3. **Accessible** - Work for users with varying abilities, devices, and contexts
4. **Credible** - Deliver consistently on promises to build trust
5. **Findable** - Organize information logically; enable easy navigation
6. **Usable** - Design for human cognitive capacity (progressive disclosure, familiarity)
7. **Valuable** - Provide benefits that exceed the effort required to use

### Visual Design Principles
- **Visual Hierarchy**: Size, color, spacing to establish importance order
- **Contrast**: Create distinction through color, size, shape (ensure sufficient contrast for accessibility)
- **Balance**: Symmetrical (tranquil) vs asymmetrical (dynamic) element distribution
- **Emphasis**: Direct attention to key elements via size, color, positioning
- **White Space**: Provide breathing room; reduce clutter; improve readability
- **Typography**: Select legible, scalable fonts; establish clear hierarchy
- **Color**: Use for emotion, differentiation, visual interest; consider cultural context
- **Repetition**: Create unity through consistent patterns
- **Alignment**: Use grids to create order and structure
- **Scale**: Signal importance through relative size
- **Rhythm**: Create visual flow through spacing patterns

### Page Structure Patterns
- **F-Pattern**: Text-heavy content (top-left to bottom)
- **Z-Pattern**: Minimal content with visual elements
- **Single Column**: Mobile-first, simple layouts
- **Two/Three Column**: Content with sidebars or navigation
- **Grid Layout**: Flexibility and consistency (images, products)
- **Card Layout**: Scannable, modular content units
- **Asymmetrical Layout**: Dynamic, modern designs (use carefully)

### Gestalt Principles
Apply grouping, proximity, continuation, and closure to help users understand relationships between elements.

## Responsive Design Principles

### Mobile-First Approach
1. Start with smallest screens
2. Design for essential content in limited space
3. Progressively enhance for larger screens
4. Use relative units (rem, em) over absolute pixels

### Key Considerations
- **Content-Centric Breakpoints**: Base breakpoints on when content needs to change, not device sizes
- **Fluid Grids & Flexible Images**: Use relative sizing (`max-width: 100%`)
- **Don't Hide Content**: Make all content accessible across devices; adapt presentation instead
- **Touch-Friendly**: Minimum 48px targets; adequate spacing
- **Test Responsively**: Verify across devices and screen sizes
- **Performance**: Optimize images; minimize load times

### Media Queries & Breakpoints
Use min-width queries (mobile-first) and test with real content. Common breakpoints: 40rem (sm), 48rem (md), 64rem (lg), 80rem (xl), 96rem (2xl).

## Design Tokens

**Design tokens** are named variables that store design decisions (colors, spacing, typography, etc.) in a centralized, reusable format. They create a single source of truth across design and development.

### Benefits
- **Consistency**: Same values referenced by name everywhere
- **Scalability**: Tokens can reference other tokens; manageable complexity
- **Efficiency**: Update once, apply everywhere
- **Collaboration**: Shared language between designers and developers

### Common Token Types
- **Colors**: Brand palette, semantic colors
- **Typography**: Font families, sizes, weights, line heights
- **Spacing**: Margins, padding, gaps (use consistent scale)
- **Sizing**: Width, height constraints
- **Border Radius**: Corner styles
- **Shadows**: Elevation and depth
- **Component Tokens**: Specific to buttons, cards, etc.

### Best Practices
- Use descriptive, hierarchical names (e.g., `color.button.background.hover`)
- Store tokens centrally; sync across tools
- Document usage and context
- Version control token changes

## Tailwind CSS

Tailwind is a utility-first CSS framework that uses design tokens to generate consistent, maintainable styles.

### Core Concepts

#### Utility-First Approach
- Apply multiple single-purpose classes directly in markup
- Avoids context-switching between HTML and CSS
- Changes are localized and safe
- Code is portable and reusable

#### Theme Variables
Define custom design tokens using `@theme`:
```css
@theme {
  --color-brand-primary: oklch(0.627 0.265 303.9);
  --spacing: 0.25rem;
  --font-display: "Satoshi", sans-serif;
  --breakpoint-3xl: 120rem;
}
```

These generate both utility classes (`bg-brand-primary`) and CSS variables (`var(--color-brand-primary)`).

#### Responsive Design
Apply utilities at specific breakpoints by prefixing with breakpoint name:
```html
<img class="w-16 md:w-32 lg:w-48" src="..." />
```

Mobile-first: unprefixed utilities apply to all sizes; prefixed utilities apply at breakpoint and above.

#### State Variants
Style hover, focus, active, and other states:
```html
<button class="bg-sky-500 hover:bg-sky-700 focus:ring-2">
  Save
</button>
```

#### Dark Mode
Style for dark mode using the `dark:` variant:
```html
<div class="bg-white dark:bg-gray-800 text-gray-900 dark:text-white">
  Content
</div>
```

#### Container Queries
Style based on parent container size:
```html
<div class="@container">
  <div class="flex flex-col @md:flex-row">
    <!-- Content adapts to container width -->
  </div>
</div>
```

### Color System
- Use semantic color names: `bg-blue-500`, `text-gray-700`
- Adjust opacity: `bg-sky-500/75` (75% opacity)
- Reference in CSS: `var(--color-blue-500)`
- Color scales: 50 (lightest) to 950 (darkest)

### Common Patterns

#### Layout
- Flexbox: `flex`, `flex-col`, `items-center`, `justify-between`
- Grid: `grid`, `grid-cols-3`, `gap-4`
- Spacing: `p-4`, `m-2`, `space-x-2`, `gap-6`

#### Typography
- Sizes: `text-xs` through `text-9xl`
- Weight: `font-thin` through `font-black`
- Color: `text-gray-900`, `text-blue-600`

#### Sizing
- Fixed: `w-64`, `h-32`
- Responsive: `w-full`, `h-screen`
- Min/max: `min-w-0`, `max-h-screen`

#### Visual Effects
- Shadows: `shadow-sm` through `shadow-2xl`
- Borders: `border`, `border-2`, `border-gray-300`, `rounded-lg`
- Opacity: `opacity-75`, `bg-opacity-50`

### Arbitrary Values
Use one-off values with square brackets:
```html
<div class="bg-[#bada55] top-[117px] grid-cols-[1fr_500px_2fr]">
```

### Custom CSS Integration
When needed, write custom CSS and reference theme variables:
```css
@layer components {
  .card {
    background-color: var(--color-white);
    border-radius: var(--radius-lg);
    padding: --spacing(6);
    box-shadow: var(--shadow-xl);
  }
}
```

### Best Practices
1. **Use theme variables** for design tokens
2. **Start mobile-first**, enhance for larger screens
3. **Leverage variants** for interactive states
4. **Prefer utilities** over custom CSS
5. **Extract components** for repeated patterns
6. **Use arbitrary values** sparingly for one-offs
7. **Consider performance**: optimize images, minimize classes
8. **Test accessibility**: color contrast, keyboard navigation, screen readers
9. **Document patterns**: maintain design system consistency
10. **Version control**: track theme changes and custom styles

## Accessibility

- Use sufficient color contrast (WCAG AA: 4.5:1 text, 3:1 UI)
- Provide keyboard navigation and visible focus states
- Use semantic HTML and ARIA attributes
- Support screen readers with appropriate labels
- Test with actual assistive technologies
- Design for various cognitive abilities (clear hierarchy, simple language)

## Resources

### MDN Web Development
- Responsive design fundamentals
- CSS layout techniques (flexbox, grid)
- Media queries and breakpoints
- Viewport meta tag usage

### Interaction Design Foundation
- Page structure and visual hierarchy
- F-pattern and Z-pattern layouts
- Navigation best practices
- Titled sections for scannable content

### Design Principles Sources
- Seven pillars of UX
- 13 visual design principles
- Gestalt principles
- Component design patterns

### Tailwind Documentation
- Theme variables and customization
- Utility classes and variants
- Responsive design and container queries
- Dark mode and custom styles
- Design tokens integration
