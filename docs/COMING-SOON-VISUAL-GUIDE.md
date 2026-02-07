# Coming Soon Pages - Visual Design Guide

## Design Overview

The Coming Soon component creates a beautiful, professional overlay that communicates upcoming features while maintaining the Alpha Star Aviation brand aesthetic.

## Visual Layout

```
┌─────────────────────────────────────────────────────────────┐
│                                                               │
│                    [Gradient Background]                      │
│                                                               │
│                  ╔═══════════════════╗                       │
│                  ║   [Glowing Icon]  ║  ← Animated pulse     │
│                  ╚═══════════════════╝                       │
│                                                               │
│                    Feature Title                              │
│                  Brief description text                       │
│                                                               │
│              ┌─────────────────────┐                         │
│              │ ● Coming Soon       │  ← Animated dot         │
│              └─────────────────────┘                         │
│                                                               │
│              Planned Features                                 │
│         ┌──────────────────────────┐                         │
│         │ ● Feature 1              │  ← Hover effect         │
│         └──────────────────────────┘                         │
│         ┌──────────────────────────┐                         │
│         │ ● Feature 2              │                         │
│         └──────────────────────────┘                         │
│         ┌──────────────────────────┐                         │
│         │ ● Feature 3              │                         │
│         └──────────────────────────┘                         │
│                                                               │
│         Estimated Release: Q2 2026                            │
│                                                               │
│                  ● ● ●  ← Decorative dots                    │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

## Color Scheme

### Light Mode
- **Background Gradient:** Primary/5% → Transparent → Accent/5%
- **Card Background:** White with subtle shadow
- **Icon Container:** Primary/10% with Primary/20% border
- **Icon Color:** Primary
- **Text Primary:** Foreground (dark)
- **Text Secondary:** Muted-foreground (gray)
- **Badge Background:** Primary/10% with Primary/20% border
- **Badge Text:** Primary
- **Feature Cards:** Muted/50% background, hover to Muted

### Dark Mode
- **Background Gradient:** Primary/5% → Transparent → Accent/5%
- **Card Background:** Dark card with border
- **Icon Container:** Primary/10% with Primary/20% border
- **Icon Color:** Primary (adjusted for dark mode)
- **Text Primary:** Foreground (light)
- **Text Secondary:** Muted-foreground (light gray)
- **Badge Background:** Primary/10% with Primary/20% border
- **Badge Text:** Primary
- **Feature Cards:** Muted/50% background, hover to Muted

## Animation Details

### Icon Glow Animation
```css
/* Pulse effect on the background blur */
animation: pulse 2s ease-in-out infinite;

/* Creates a soft, breathing glow effect */
- Scale: 1 → 1.05 → 1
- Opacity: 0.5 → 0.7 → 0.5
```

### Badge Dot Animation
```css
/* Pulsing dot indicator */
animation: pulse 2s ease-in-out infinite;

/* Simulates "active" or "in progress" status */
- Opacity: 1 → 0.5 → 1
```

### Decorative Dots Animation
```css
/* Staggered pulse for visual interest */
animation: pulse 2s ease-in-out infinite;
animation-delay: 0s, 0.2s, 0.4s;

/* Creates a wave-like effect */
```

### Feature Card Hover
```css
/* Smooth transition on hover */
transition: all 150ms ease-in-out;

/* Changes background and border on hover */
background: muted/50% → muted
border: border/50% → border
```

## Typography

### Title
- **Font Size:** 3xl (mobile) → 4xl (desktop)
- **Font Weight:** Bold (700)
- **Color:** Foreground
- **Line Height:** Tight

### Description
- **Font Size:** lg (18px)
- **Font Weight:** Normal (400)
- **Color:** Muted-foreground
- **Max Width:** md (28rem)
- **Alignment:** Center

### Badge Text
- **Font Size:** sm (14px)
- **Font Weight:** Medium (500)
- **Color:** Primary

### Feature Text
- **Font Size:** sm (14px)
- **Font Weight:** Normal (400)
- **Color:** Foreground
- **Alignment:** Left

### Release Date
- **Font Size:** sm (14px)
- **Font Weight:** Normal (400) with Medium (500) highlight
- **Color:** Muted-foreground with Foreground highlight

## Spacing & Layout

### Container
- **Max Width:** 2xl (42rem)
- **Padding:** 8 (mobile) → 12 (desktop)
- **Min Height:** calc(100vh - 200px)
- **Alignment:** Center (vertical & horizontal)

### Icon Container
- **Size:** 16 (64px icon)
- **Padding:** 6 (24px)
- **Border Radius:** Full (circle)
- **Border Width:** 2px

### Badge
- **Padding:** 4 horizontal, 2 vertical
- **Border Radius:** Full (pill shape)
- **Gap:** 2 (8px between dot and text)

### Feature Cards
- **Padding:** 3 (12px)
- **Gap:** 3 (12px between icon and text)
- **Border Radius:** lg (8px)
- **Max Width:** md (28rem)

### Section Spacing
- **Between sections:** 6 (24px)
- **Between features:** 3 (12px)
- **Between decorative dots:** 2 (8px)

## Responsive Behavior

### Mobile (< 640px)
- Title: 3xl font size
- Padding: 8 (32px)
- Feature cards: Full width
- Icon: Slightly smaller glow effect

### Tablet (640px - 1024px)
- Title: 3xl font size
- Padding: 10 (40px)
- Feature cards: Max width maintained
- Icon: Full glow effect

### Desktop (> 1024px)
- Title: 4xl font size
- Padding: 12 (48px)
- Feature cards: Max width maintained
- Icon: Full glow effect with enhanced shadow

## Accessibility Features

### Semantic HTML
- Proper heading hierarchy (h1, h3)
- Descriptive text for screen readers
- Semantic list structure for features

### Color Contrast
- All text meets WCAG AA standards
- Primary colors have sufficient contrast
- Muted text maintains readability

### Keyboard Navigation
- All interactive elements are focusable
- Focus indicators visible
- Logical tab order

### Screen Reader Support
- Descriptive labels
- Proper ARIA attributes where needed
- Meaningful content structure

## Implementation Examples

### Vacation Plan Page
```tsx
<ComingSoon
  icon={CalendarDays}
  title="Vacation Plan Management"
  description="Comprehensive team vacation scheduling and overlap detection system"
  features={[
    '48-week vacation grid for Engineering and TPL teams',
    'Real-time overlap detection and conflict alerts',
    'Excel import/export for easy data management',
    'Employee vacation balance tracking',
    'Team coverage analytics and reports',
  ]}
  estimatedRelease="Q2 2026"
/>
```

### Fleet at MRO Page
```tsx
<ComingSoon
  icon={Wrench}
  title="Fleet at MRO"
  description="Comprehensive tracking and management of aircraft undergoing maintenance, repair, and overhaul"
  features={[
    'Real-time MRO status tracking for all aircraft',
    'Detailed work scope and progress monitoring',
    'Estimated return-to-service dates and alerts',
    'MRO vendor performance analytics',
    'Cost tracking and budget management',
    'Historical MRO records and trend analysis',
  ]}
  estimatedRelease="Q2 2026"
/>
```

## Browser Compatibility

### Supported Browsers
- Chrome/Edge: 90+
- Firefox: 88+
- Safari: 14+
- Opera: 76+

### CSS Features Used
- CSS Grid
- Flexbox
- CSS Animations
- CSS Gradients
- CSS Blur filters
- CSS Transitions

### Fallbacks
- Gradient backgrounds degrade gracefully
- Animations can be disabled via `prefers-reduced-motion`
- Blur effects have solid color fallbacks

---

**Design System:** Alpha Star Aviation  
**Component Version:** 1.0  
**Last Updated:** January 31, 2026
