---
name: line-flex-message
description: LINE Flex Message comprehensive guide — container/block/component architecture, CSS Flexbox mapping, device support matrix, 12 production templates, Simulator workflow, Thai language rendering, gradient overlays, absolute positioning, and Firebase generation patterns.
---

# LINE Flex Messages

## When to Activate

- Creating or editing Flex Message JSON
- Building rich card UI (product cards, receipts, booking confirmations, menu interfaces)
- Code contains `type: "flex"`, `type: "bubble"`, or `type: "carousel"`
- Troubleshooting rendering issues on iOS vs Android
- Generating Flex Messages dynamically from databases

---

## Why Flex Messages Matter

Bot messages with plain text only look "boring" — users want:
- Visually appealing card layouts with images
- Clickable buttons integrated into messages (save quota vs multiple messages)
- Professional receipt/ID card formats
- Customizable colors and spacing per brand
- Multi-item carousels for product browsing

**Real benefits:**
- Product carousel: let users swipe through items without 3 separate API calls
- Receipt/invoice: display as formal document with itemized list, totals, VAT
- Multiple buttons in one message: save quota (1 message = 1 quota point, not 1 button = 1 point)
- Full layout control: match brand colors, fonts, spacing exactly like web design

---

## Architecture (3 Levels)

```
Flex Message
  └── Container (Bubble | Carousel)
       └── Block (Header | Hero | Body | Footer | Styles)
            └── Component (Box | Text | Image | Video | Button | Icon | Span | Separator)
```

**Mental model:** Flex Message = envelope → Container = box inside → Block = section of box (top/middle/bottom) → Component = small piece in section

---

## Containers

### Bubble — Single Card

- Blocks appear in order: header → hero → body → footer (each used **max once**)
- Bubble sizes: `nano` (smallest, rarely used) → `micro` → `kilo` → `mega` (default) → `giga` → `deca` → `hecto` (largest)
- Max **30KB** per bubble

**Version support:**
- `deca` and `hecto` sizes: LINE 13.6.0+ (iOS/Android) or 7.17.0+ (PC)
- Older LINE versions: silently downgrade to `kilo` instead

### Carousel — Scrollable Bubbles

- Horizontally swipeable, multiple bubbles
- Max **12 bubbles** per carousel
- Max **50KB** total carousel size

---

## Blocks (Inside Bubble)

Each block is **optional** but appears in strict order:

| Block | Purpose | Max Once |
|-------|---------|----------|
| `header` | Title/subject — appears first | Yes |
| `hero` | Main image or video — high visual impact | Yes |
| `body` | Main content (text, details, items list) | Yes |
| `footer` | Buttons, supplementary info — appears last | Yes |
| `styles` | Global bubble styling (border, footer separator) | Yes |

---

## Components Reference

| Component | Purpose | Only in | Key Properties |
|-----------|---------|---------|---------------|
| **Box** | Layout container | Vertical/Horizontal blocks | `layout` (vertical/horizontal/baseline), `spacing`, `padding`, `margin`, `position` (relative/absolute), `offsets`, `backgroundColor`, `cornerRadius`, `borderWidth` |
| **Text** | Display text with optional Span children | Any block | `text`, `size`, `color`, `weight` (bold/regular), `wrap` (true=multiline), `maxLines`, `align`, `decoration` (line-through/underline), `lineSpacing`, `scaling` |
| **Span** | Styled text within Text component | Inside Text `contents` array | `text`, `size`, `color`, `weight`, `decoration` |
| **Image** | Display image (HTTPS only) | Blocks directly, or inside Box | `url` (HTTPS, JPG/PNG, max 1024x1024px, 10MB), `size`, `aspectRatio`, `aspectMode` (cover/fit), `cornerRadius` |
| **Video** | Display video in hero (LINE 11.22.0+) | `hero` block (hero box) | `url` (mp4, HTTPS, max 200MB), `previewUrl`, `altContent` (fallback for old versions), `aspectRatio`, `action` |
| **Button** | Tappable button with action | Box only | `style` (primary/secondary/link), `action`, `color`, `height` (sm/md), `adjustMode` |
| **Icon** | Small icon (no text) | Baseline box only | `url` (HTTPS, JPG/PNG, max 240x240px, 1MB), `size`, `aspectRatio` |
| **Separator** | Horizontal divider line | Vertical/Horizontal boxes | `margin` |

### Component Restrictions by Box Type

| Component | Baseline Box | Horizontal/Vertical Box |
|-----------|:---:|:---:|
| Box | ❌ | ✅ |
| Button | ❌ | ✅ |
| Image | ❌ | ✅ |
| Icon | ✅ | ❌ |
| Text | ✅ | ✅ |
| Span (child of Text) | ✅ | ✅ |
| Separator | ❌ | ✅ |

---

## Box Layout Properties

### Layout Types

- **`vertical`** — children arranged top-to-bottom (default in most contexts)
- **`horizontal`** — children arranged left-to-right
- **`baseline`** — children vertically aligned by text baseline (useful for icons next to text)

### Flex Property (Proportional Width/Height)

- `flex: 0` — component occupies content width only, no growth
- `flex: 1+` — component shares remaining space proportionally (1:2:3 ratio for three children)
- Default in horizontal box: `flex: 1` (grows)
- Default in vertical box: `flex: 0` (content size)

### justifyContent (Horizontal Distribution)

Only works if **all children have `flex: 0`**:
- `flex-start` — push all to left
- `center` — center horizontally
- `flex-end` — push all to right
- `space-between` — first left, last right, gap in middle
- `space-around` — equal gap around each child
- `space-evenly` — equal gap everywhere

### alignItems (Cross-Axis Alignment)

Controls alignment perpendicular to main axis:
- `flex-start` — top (vertical box) or left (horizontal box)
- `center` — middle
- `flex-end` — bottom (vertical box) or right (horizontal box)

### Spacing & Padding

**`spacing`** — gap between children (keywords or pixels):
- Keywords: `none` | `xs` | `sm` | `md` | `lg` | `xl` | `xxl` | or `px` values

**`padding`** — internal padding:
- `paddingAll` — all sides
- `paddingTop`, `paddingBottom`, `paddingStart`, `paddingEnd` — individual sides
- Units: keywords or pixel values

**`margin`** — external margin on component:
- Same keywords + pixel values

### Position & Offsets

- `position: "relative"` — normal document flow (default)
- `position: "absolute"` — overlay on top, removed from flow
- Offsets for absolute positioning:
  - `offsetTop`, `offsetBottom`, `offsetStart` (left), `offsetEnd` (right)
  - Units: keywords, pixels, or percentages

### Size Properties

- `width`, `height`, `maxWidth`, `maxHeight` — pixels, percentages, or keywords
- `cornerRadius` — rounded corners in pixels
- `borderWidth` — border thickness (Line 11.22.0+)

---

## CSS Flexbox Relationship

Flex Message Box + Component map directly to **CSS Flexible Box** specs. If you know CSS Flexbox, you already understand Flex Message layout:

### Horizontal Box Child

| `flex` value | CSS equivalent |
|---|---|
| `0` | `flex: 0 0 auto;` |
| `> 0` | `flex: X 0 0;` (X = the flex value) |

### Vertical Box Child

| `flex` value | CSS equivalent |
|---|---|
| `0` | `flex: 0 0 auto;` |
| `> 0` | `flex: X 0 auto;` (X = the flex value) |

**Example:** Three children with `flex: 1, 2, 1` in horizontal box → widths are 25%, 50%, 25%

---

## Size Keywords Reference

### Image Sizes

`xxs` | `xs` | `sm` | `md` | `lg` | `xl` | `xxl` | `3xl` | `4xl` | `5xl` | `full` (100% width)

Pixel equivalents vary by bubble size and device.

### Text & Icon Sizes

`xxs` | `xs` | `sm` | `md` | `lg` | `xl` | `xxl` | `3xl` | `4xl` | `5xl` — or pixel values (1-500px)

### Alignment Keywords

- `align` (text/image): `start` | `center` | `end`
- `gravity` (text/image/button): `top` | `center` | `bottom` (only works with `position: relative`)
- `adjustMode`: `"shrink-to-fit"` — auto-shrink text to fit container

---

## Sending Flex Messages

```json
{
  "type": "flex",
  "altText": "Notification text (required, max 400 chars) — shown when Flex cannot render",
  "contents": {
    "type": "bubble",
    "hero": { ... },
    "body": { ... },
    "footer": { ... }
  }
}
```

**Always include `altText`** — shown in notifications and when Flex cannot render on old LINE versions.

---

## Device & VERSION Support Matrix

| Feature | iOS/Android | PC | Required Version |
|---------|---|---|---|
| Basic components (Box, Text, Button, Image) | ✅ | ✅ | All |
| `maxWidth`, `maxHeight` on Box | ✅ | ✅ | 11.22.0+ / 7.7.0+ |
| `lineSpacing` on Text | ✅ | ✅ | 11.22.0+ / 7.7.0+ |
| Video component | ✅ | ✅ | 11.22.0+ / 7.7.0+ |
| `borderWidth` on Box | ✅ | ✅ | 12.10.0+ / 7.10.0+ |
| Bubble sizes `deca`, `hecto` | ✅ | ✅ | 13.6.0+ / 7.17.0+ |
| `scaling` property (responsive font) | ✅ | ✅ | 13.6.0+ / 7.17.0+ |

**Older LINE versions automatically degrade gracefully** (e.g., `deca` → `kilo`). Use `altText` and `altContent` as fallbacks.

---

## Rendering Variations (Important!)

The same Flex Message may render differently depending on:
- **OS**: iOS, Android, macOS, Windows
- **LINE version**: Users on older versions miss newer features
- **Device screen resolution**: Phone, tablet, PC
- **User language settings**: Thai, Japanese, English affect text sizing
- **Font**: Different fonts on different devices
- **Dark mode**: Colors may look different on dark background

**Action:** Always test on multiple devices + multiple LINE versions before shipping.

---

## Flex Message Simulator

Official tool: https://developers.line.biz/flex-simulator/

**Workflow:**
1. Go to Simulator link
2. Click "New" → select a template or paste JSON
3. Edit JSON or use visual designer
4. Toggle between JSON editor and visual preview
5. Test on "New message" to see mobile view

**Tips:**
- Simulator shows rendering on mobile dimensions
- Copy final JSON to your code
- Always validate with `/v2/bot/message/validate/flex` before sending

---

## ChatGPT + Simulator Workflow (Real-World Pattern)

### Step 1: Write Clear Prompt

```
Create a LINE Flex Message JSON for a restaurant receipt with:
- Restaurant name and address in header
- Logo image in hero (use url: https://example.com/logo.png)
- 3 food items with prices in body (left-align name, right-align price)
- Subtotal, tax (7%), total in footer
- Use bubble size: giga
- Include altText
```

### Step 2: Get JSON from ChatGPT

ChatGPT generates JSON structure (it usually works, but may have bugs).

### Step 3: Validate in Simulator

1. Paste JSON into https://developers.line.biz/flex-simulator/
2. Review visual output
3. **Common bugs to fix:**
   - Missing/wrong `altText`
   - Image URLs not HTTPS
   - Wrong property names (ChatGPT invents properties LINE doesn't support)
   - `flex` values as strings ("1") instead of numbers (1)
   - Trailing commas in JSON

### Step 4: Send via Messaging API

Once Simulator passes, validate with LINE API:

```bash
curl -X POST https://api.line.me/v2/bot/message/validate/flex \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer {token}' \
  -d '{
    "type": "flex",
    "altText": "Receipt",
    "contents": { ... }
  }'
```

Response: `200` = valid, `400` = invalid (shows which properties are wrong).

---

## Linear Gradient

```json
{
  "type": "linearGradient",
  "angle": "180deg",
  "startColor": "#00000000",
  "centerColor": "#00000080",
  "endColor": "#000000CC",
  "centerPosition": "30%"
}
```

**Properties:**
- `angle`: 0-360 degrees (0°=bottom-to-top, 90°=left-to-right, 180°=top-to-bottom, 270°=right-to-left)
- `startColor`, `endColor`: hex colors with alpha (CC = opaque, 00 = transparent)
- `centerColor`, `centerPosition`: optional middle color stop (useful for fading)

**Example: Overlay fade on hero image**
```json
{
  "type": "box",
  "position": "absolute",
  "offsetBottom": "0px",
  "offsetStart": "0px",
  "offsetEnd": "0px",
  "background": {
    "type": "linearGradient",
    "angle": "0deg",
    "startColor": "#00000000",
    "endColor": "#000000CC"
  }
}
```

---

## Advanced Patterns

### Absolute Positioning (Overlays)

Layer components on top of each other:

```json
{
  "type": "box",
  "layout": "vertical",
  "contents": [
    { "type": "image", "url": "...", "size": "full", "aspectRatio": "20:13" },
    {
      "type": "box",
      "layout": "vertical",
      "position": "absolute",
      "offsetTop": "10px",
      "offsetEnd": "10px",
      "backgroundColor": "#FF0000CC",
      "cornerRadius": "4px",
      "paddingAll": "4px",
      "contents": [
        { "type": "text", "text": "SALE", "color": "#FFFFFF", "size": "xs", "weight": "bold" }
      ]
    }
  ]
}
```

### Price with Strikethrough

```json
[
  { "type": "text", "text": "฿1,500", "decoration": "line-through", "size": "sm", "color": "#999999", "flex": 0 },
  { "type": "text", "text": "฿990", "weight": "bold", "size": "lg", "color": "#FF5551", "margin": "sm", "flex": 0 }
]
```

### Icon + Text in Baseline Box (Rating Stars)

```json
{
  "type": "box",
  "layout": "baseline",
  "margin": "md",
  "contents": [
    { "type": "icon", "url": "https://example.com/star.png", "size": "sm" },
    { "type": "icon", "url": "https://example.com/star.png", "size": "sm" },
    { "type": "icon", "url": "https://example.com/star-half.png", "size": "sm" },
    { "type": "text", "text": "4.5", "size": "sm", "color": "#999999", "margin": "md", "flex": 0 }
  ]
}
```

---

## Common Recipes (Production-Ready)

### Product Card with Price & CTA

```json
{
  "type": "bubble",
  "hero": {
    "type": "image",
    "url": "https://example.com/product.jpg",
    "size": "full",
    "aspectRatio": "20:13",
    "aspectMode": "cover",
    "action": { "type": "uri", "label": "View", "uri": "https://example.com/product/1" }
  },
  "body": {
    "type": "box",
    "layout": "vertical",
    "contents": [
      { "type": "text", "text": "Product Name", "weight": "bold", "size": "xl" },
      {
        "type": "box",
        "layout": "baseline",
        "margin": "md",
        "contents": [
          { "type": "icon", "url": "https://example.com/star.png", "size": "sm" },
          { "type": "icon", "url": "https://example.com/star.png", "size": "sm" },
          { "type": "icon", "url": "https://example.com/star.png", "size": "sm" },
          { "type": "icon", "url": "https://example.com/star.png", "size": "sm" },
          { "type": "icon", "url": "https://example.com/star-half.png", "size": "sm" },
          { "type": "text", "text": "4.5", "size": "sm", "color": "#999999", "margin": "md", "flex": 0 }
        ]
      },
      {
        "type": "box",
        "layout": "horizontal",
        "margin": "lg",
        "contents": [
          { "type": "text", "text": "฿1,500", "decoration": "line-through", "size": "sm", "color": "#999999", "flex": 0 },
          { "type": "text", "text": "฿990", "weight": "bold", "size": "lg", "color": "#FF5551", "margin": "sm", "flex": 0 }
        ]
      },
      { "type": "text", "text": "Description text wrapping to multiple lines.", "size": "sm", "color": "#666666", "wrap": true, "margin": "md" }
    ]
  },
  "footer": {
    "type": "box",
    "layout": "vertical",
    "spacing": "sm",
    "contents": [
      { "type": "button", "style": "primary", "color": "#06C755", "action": { "type": "postback", "label": "Add to Cart", "data": "action=addcart&productId=1" } },
      { "type": "button", "style": "secondary", "action": { "type": "uri", "label": "More Details", "uri": "https://example.com/product/1" } }
    ]
  }
}
```

### Receipt / Order Confirmation

```json
{
  "type": "bubble",
  "body": {
    "type": "box",
    "layout": "vertical",
    "contents": [
      { "type": "text", "text": "RECEIPT", "weight": "bold", "color": "#1DB446", "size": "sm" },
      { "type": "text", "text": "Shop Name", "weight": "bold", "size": "xxl", "margin": "md" },
      { "type": "text", "text": "Order #12345", "size": "xs", "color": "#aaaaaa", "wrap": true },
      { "type": "separator", "margin": "xxl" },
      {
        "type": "box",
        "layout": "vertical",
        "margin": "xxl",
        "spacing": "sm",
        "contents": [
          {
            "type": "box",
            "layout": "horizontal",
            "contents": [
              { "type": "text", "text": "Item A x2", "size": "sm", "color": "#555555", "flex": 0 },
              { "type": "text", "text": "฿500", "size": "sm", "color": "#111111", "align": "end" }
            ]
          },
          {
            "type": "box",
            "layout": "horizontal",
            "contents": [
              { "type": "text", "text": "Item B x1", "size": "sm", "color": "#555555", "flex": 0 },
              { "type": "text", "text": "฿300", "size": "sm", "color": "#111111", "align": "end" }
            ]
          }
        ]
      },
      { "type": "separator", "margin": "xxl" },
      {
        "type": "box",
        "layout": "horizontal",
        "margin": "xxl",
        "contents": [
          { "type": "text", "text": "TOTAL", "size": "sm", "color": "#555555" },
          { "type": "text", "text": "฿800", "size": "sm", "color": "#111111", "align": "end", "weight": "bold" }
        ]
      }
    ]
  },
  "styles": { "footer": { "separator": true } }
}
```

### Booking Confirmation

```json
{
  "type": "bubble",
  "body": {
    "type": "box",
    "layout": "vertical",
    "contents": [
      { "type": "text", "text": "Booking Confirmed", "weight": "bold", "size": "xl", "color": "#1DB446" },
      { "type": "separator", "margin": "lg" },
      {
        "type": "box",
        "layout": "vertical",
        "margin": "lg",
        "spacing": "sm",
        "contents": [
          { "type": "box", "layout": "horizontal", "contents": [ { "type": "text", "text": "Date", "size": "sm", "color": "#999999", "flex": 2 }, { "type": "text", "text": "2025-03-15", "size": "sm", "color": "#333333", "flex": 3 } ] },
          { "type": "box", "layout": "horizontal", "contents": [ { "type": "text", "text": "Time", "size": "sm", "color": "#999999", "flex": 2 }, { "type": "text", "text": "14:00–15:00", "size": "sm", "color": "#333333", "flex": 3 } ] },
          { "type": "box", "layout": "horizontal", "contents": [ { "type": "text", "text": "Location", "size": "sm", "color": "#999999", "flex": 2 }, { "type": "text", "text": "Meeting Room A", "size": "sm", "color": "#333333", "flex": 3, "wrap": true } ] }
        ]
      }
    ]
  },
  "footer": {
    "type": "box",
    "layout": "vertical",
    "spacing": "sm",
    "contents": [
      { "type": "button", "style": "primary", "action": { "type": "uri", "label": "View Details", "uri": "https://example.com/booking/123" } },
      { "type": "button", "style": "link", "color": "#FF5551", "action": { "type": "postback", "label": "Cancel Booking", "data": "action=cancel&bookingId=123" } }
    ]
  }
}
```

### Product Carousel (Max 12 Bubbles)

```json
{
  "type": "carousel",
  "contents": [
    {
      "type": "bubble",
      "size": "micro",
      "hero": { "type": "image", "url": "https://example.com/item1.jpg", "size": "full", "aspectRatio": "1:1", "aspectMode": "cover" },
      "body": { "type": "box", "layout": "vertical", "contents": [ { "type": "text", "text": "Item 1", "weight": "bold", "size": "sm" }, { "type": "text", "text": "฿990", "size": "xs", "color": "#FF5551" } ] }
    },
    {
      "type": "bubble",
      "size": "micro",
      "hero": { "type": "image", "url": "https://example.com/item2.jpg", "size": "full", "aspectRatio": "1:1", "aspectMode": "cover" },
      "body": { "type": "box", "layout": "vertical", "contents": [ { "type": "text", "text": "Item 2", "weight": "bold", "size": "sm" }, { "type": "text", "text": "฿1,290", "size": "xs", "color": "#FF5551" } ] }
    }
  ]
}
```

---

## Thai Language Rendering Tips

### Common Issues

1. **Tone marks (่, ้, ๋, ์) overlapping or floating** — use `size: "sm"` or larger, never `xxs` for Thai
2. **Text overflowing** — add `wrap: true` to all Thai text, check `maxLines`
3. **Color contrast** — light gray (#ccc) on white fails in dark mode; use darker colors (#666+)
4. **Font variation** — different devices may render Thai fonts differently; test on real device

### Best Practices

- **Minimum size: `sm`** for Thai text (sizes below `sm` have rendering issues)
- **Always `wrap: true`** for Thai > 1 line to avoid truncation
- **Use contrast colors** — avoid very light gray on light backgrounds
- **Line spacing:** add `lineSpacing: "lg"` for better readability in Thai
- **Test on device:** iOS and Android render Thai differently; always verify on real phone

### Example: Thai Receipt

```json
{
  "type": "text",
  "text": "ร้านอาหารไทย สี่เหลี่ยม",
  "size": "sm",
  "weight": "bold",
  "wrap": true,
  "lineSpacing": "lg",
  "color": "#333333"
}
```

---

## Constraints

- Single Flex Message: max **50KB** (carousel); **30KB** per bubble
- Carousel: max **12 bubbles**
- Image URLs: must be **HTTPS only** (TLS 1.2+)
- `altText`: required, max 400 characters
- `flex` property: integer 0-3 (proportional width)
- Rendering varies by: device OS, LINE version, screen resolution, language, fonts
- **Deprecated:** Filler component (use component properties like `spacing`, `margin`, `flex` instead)

---

## Validation Before Sending

```typescript
async function validateFlexMessage(flexMessage: any, token: string) {
  const { data } = await axios.post(
    'https://api.line.me/v2/bot/message/validate/flex',
    flexMessage,
    { headers: { Authorization: `Bearer ${token}` } }
  )
  return data  // { } on success, or { message, details } on error
}
```

**Note:** Validation catches JSON structure bugs but **not** runtime issues like:
- Bad image URLs (404)
- Image URL exceeds size (>10MB)
- Total size exceeds 50KB after emoji expansion
- Rendering differences across LINE versions

**Action:** Always test in real app after validation passes.

---

## Layout Debug Checklist

| Symptom | Likely Fix |
|---------|-----------|
| Text cut off | Add `wrap: true`, increase `maxLines` or remove it |
| Elements overlap | Check `position: "absolute"` + offset values |
| Columns uneven widths | Set `flex: 1, 2, 3...` to control proportion |
| Buttons look tiny | Add `height: "sm"` or `"md"` |
| Image stretched | Change `aspectMode: "fit"` instead of `"cover"` |
| Icons not inline with text | Use `baseline` layout Box |
| Card cramped | Add `spacing: "md"` on parent Box, `margin` on children |
| Footer buttons too close | Add `spacing: "sm"` on footer Box |
| Gradient not showing | Ensure `background` is inside Box, not Image |
| Renders different Android/iOS | Check LINE version requirement; some properties need 11.22.0+ |
| Thai text tiny/floating | Use `size: "sm"+`, add `wrap: true`, add `lineSpacing` |

---

## Responsive Design Pattern

### Use `scaling: true` (LINE 13.6.0+)

Text respects user's font size setting:

```json
{
  "type": "text",
  "text": "Accessible text",
  "size": "md",
  "scaling": true
}
```

### Responsive Bubble Layout

Combine:
- `size: "giga"` (wider on big screens, max width device-dependent)
- `maxWidth: "100%"` on hero images
- `aspectMode: "cover"` with conservative `aspectRatio` like `"20:13"`
- Use percentages instead of pixels for `width`, offsets when possible
- Test on multiple screen sizes

---

## Dynamic Flex Generation Example (Node.js)

```typescript
import axios from 'axios';

interface Product {
  name: string;
  imageUrl: string;
  originalPrice: number;
  salePrice: number;
  description: string;
}

function buildProductFlex(productId: string, product: Product) {
  return {
    type: 'flex',
    altText: `Product: ${product.name}`,
    contents: {
      type: 'bubble',
      hero: {
        type: 'image',
        url: product.imageUrl,
        size: 'full',
        aspectRatio: '20:13',
        aspectMode: 'cover'
      },
      body: {
        type: 'box',
        layout: 'vertical',
        contents: [
          { type: 'text', text: product.name, weight: 'bold', size: 'xl' },
          {
            type: 'box',
            layout: 'horizontal',
            margin: 'lg',
            contents: [
              { type: 'text', text: `฿${product.originalPrice}`, decoration: 'line-through', size: 'sm', color: '#999999', flex: 0 },
              { type: 'text', text: `฿${product.salePrice}`, weight: 'bold', size: 'lg', color: '#FF5551', margin: 'sm', flex: 0 }
            ]
          },
          { type: 'text', text: product.description, size: 'sm', color: '#666666', wrap: true, margin: 'md' }
        ]
      },
      footer: {
        type: 'box',
        layout: 'vertical',
        spacing: 'sm',
        contents: [
          {
            type: 'button',
            style: 'primary',
            color: '#06C755',
            action: { type: 'postback', label: 'Add to Cart', data: `action=addcart&productId=${productId}` }
          }
        ]
      }
    }
  };
}

async function validateFlexMessage(flexMessage: any, token: string) {
  const res = await axios.post(
    'https://api.line.me/v2/bot/message/validate/flex',
    flexMessage,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  if (res.status !== 200) {
    throw new Error('Flex validation failed: ' + JSON.stringify(res.data));
  }
}
```

---

## Production Checklist

- [ ] Always set `altText` (required, max 400 chars)
- [ ] All image URLs are **HTTPS** (no HTTP, no data:// URIs)
- [ ] Validate with `/v2/bot/message/validate/flex` before sending
- [ ] Test on real devices (iOS, Android, PC) not just Simulator
- [ ] Thai text: use `size: "sm"+`, `wrap: true`, `lineSpacing`
- [ ] Bubble size matches content (nano/micro for thumbnails, giga for detailed)
- [ ] `flex: 0` on all children if using `justifyContent`
- [ ] Image aspect ratios are sensible (20:13 for wide, 1:1 for square)
- [ ] Total JSON size < 50KB (carousel) or 30KB (bubble)
- [ ] Test gradient/overlay rendering on both light/dark mode
- [ ] Buttons have meaningful `label` and `data` (for postback)
- [ ] Monitor delivery via `X-Line-Request-Id` header

---

## Common Gotchas

1. **"Flex doesn't render"** — Missing or empty `altText`. Always include it.
2. **"Image not showing"** — URL is HTTP (not HTTPS). LINE requires TLS 1.2+.
3. **"Button looks wrong"** — Forgot to set `height: "sm"` or `"md"` for smaller buttons.
4. **"Text overflows"** — Missing `wrap: true`. Add it for any text that might overflow.
5. **"Elements overlap unexpectedly"** — `position: "absolute"` was set unintentionally. Check offsets.
6. **"Thai looks terrible"** — Text size too small. Use `size: "sm"+` minimum for Thai.
7. **"Validation passes but still wrong"** — Image URL is 404 or exceeds size. Test in real app.
8. **"Different on Android vs iOS"** — Version-specific feature used. Check LINE version requirement.
9. **"Card color washed out"** — Using very light color (#ddd+). Increase contrast.

---

## See Also

- `line-messaging.md` — Send Flex Messages via Reply/Push/Multicast/Broadcast
- `line-rich-menu.md` — Create persistent bottom menu with Flex options
- `line-api-common.md` — API endpoints, error codes, rate limits
- [LINE Flex Message Simulator](https://developers.line.biz/flex-simulator/) — Official design tool
- [LINE Flex Message Reference](https://developers.line.biz/en/reference/messaging-api/#flex-message) — Complete official specs
