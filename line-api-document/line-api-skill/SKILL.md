---
name: line-api-skill
description: LINE Messaging API comprehensive cookbook — production-ready recipes, decision trees, and full-flow implementations for Messaging, Webhooks, Flex Messages, Rich Menus, and API commons. Covers Node.js/TypeScript patterns. No LIFF, Mini App, or Firebase required.
---

# LINE Messaging API Cookbook

This skill consolidates official LINE Developers docs into **5 organized skills**. Each skill contains:
- **Reference tables** — endpoints, rate limits, specifications
- **Decision flowcharts** — "when to use X vs Y"
- **Production recipes** — copy-paste-ready code with error handling
- **Gotchas & troubleshooting** — common mistakes with fixes

---

## Skills & Topics

| Skill | Topics | When to Use |
|------|--------|------------|
| **line-api-common** | API domains, rate limits, HTTP codes, token rotation, profile endpoints, groups, audiences | Setting up LINE API, managing tokens, debugging errors |
| **line-messaging** | Reply/Push/Multicast/Broadcast/Narrowcast, message types, quick reply, templates, quota | Sending any kind of message, choosing the right method |
| **line-webhook** | Webhook events, signature verification, Express handler, idempotency, redelivery | Processing LINE events, validating signatures, setting up webhook |
| **line-flex-message** | Flex structure, components, layouts, 6+ recipes (product card, receipt, booking, carousel) | Building rich card messages with layout |
| **line-rich-menu** | Rich menu creation, image specs, area mapping, tab switching via aliases, rollout patterns | Creating persistent bottom menu, switching menus dynamically |

---

## Decision Guide: Which Skill for Your Task?

```mermaid
flowchart TD
    Start["What are you building?"] --> Q1{Receiving from LINE?}
    Q1 -->|Yes| Webhook["📋 line-webhook<br/>Process events, verify signatures<br/>Set up webhook endpoint"]
    Q1 -->|No| Q2{Sending to LINE?}
    Q2 -->|Yes| Q3{What kind of message?}
    Q3 -->|Simple text/image<br/>Quick reply/Template| Messaging["📨 line-messaging<br/>Reply vs Push vs Multicast<br/>vs Broadcast vs Narrowcast"]
    Q3 -->|Rich card with layout| Flex["🎨 line-flex-message<br/>Bubble / Carousel<br/>Components & styling"]
    Q3 -->|Bottom menu| RichMenu["📱 line-rich-menu<br/>Create menu, switch via alias<br/>Per-user menu rollout"]
    Q2 -->|No| Q4{API setup or debug?}
    Q4 -->|Token/Error/RateLimit| Common["🔑 line-api-common<br/>Token rotation, rate limits<br/>Error codes, domains"]

    Webhook -.→ Common
    Messaging -.→ Common
    Flex -.→ Common
    RichMenu -.→ Common
```

---

## Common Workflows

### Workflow 1: Simple Chatbot (Starter)

1. **line-api-common** — Set up channel, get access token
2. **line-webhook** — Create webhook handler to receive messages
3. **line-messaging** — Reply to messages

### Workflow 2: Customer Support Bot

1. **line-webhook** — Receive customer messages
2. **line-flex-message** — Send rich formatted responses (cards, receipts)
3. **line-messaging** — Manage quota and delivery

### Workflow 3: Marketing Campaign Bot

1. **line-webhook** — Handle follow/unfollow events, store user IDs
2. **line-messaging** — Broadcast / Narrowcast campaigns
3. **line-api-common** — Audience management, quota tracking
4. **line-flex-message** — Rich campaign cards

### Workflow 4: Rich Menu with Tab Switching

1. **line-rich-menu** — Create multiple rich menus (Home, Category, Account)
2. **line-api-common** — Manage rich menu alias lifecycle
3. **line-messaging** — Send messages with rich menu switch action

---

## Reading Recommendations

**Complete Beginner → Start here:**
1. line-api-common (understand domains, tokens, rate limits)
2. line-webhook (set up webhook)
3. line-messaging (send first message)

**Already have a bot → Jump to:**
1. line-flex-message (upgrade to rich cards)
2. line-rich-menu (add persistent menu)

**Production readiness → Review:**
1. line-api-common → Token rotation section
2. line-webhook → Idempotency & error handling
3. line-messaging → Batch patterns & quota management

---

## When to Activate Each Skill

### line-api-common
- Setting up LINE Messaging API integration
- Managing channel access tokens (rotation, revocation)
- Debugging API errors (401, 404, 429)
- Understanding rate limits per endpoint
- Checking user profiles, groups, audiences

### line-messaging
- Choosing between Reply vs Push vs Multicast vs Broadcast
- Building message payloads (text, image, video, sticker, template)
- Managing quota and delivery statistics
- Sending messages with quick reply buttons

### line-webhook
- Handling LINE webhook events
- Implementing HMAC-SHA256 signature verification
- Processing message, follow, postback, join events
- Handling message content retrieval
- Setting up idempotent event handlers
- Redelivery and error handling

### line-flex-message
- Building rich card messages (product cards, receipts, bookings)
- Understanding Flex layout (Bubble, Carousel)
- Using components (Box, Button, Image, Text, Separator)
- Creating carousel with multiple products
- Adding overlays and badges
- Modifying a template for custom needs

### line-rich-menu
- Creating rich menu (persistent bottom menu)
- Uploading rich menu images
- Mapping areas to actions
- Implementing tab switching via aliases
- Rolling out per-user rich menus
- Cleanup (delete aliases, menus)

---

## Production Checklist

Before deploying to production:

- [ ] **Token Management** (line-api-common)
  - [ ] Set up token rotation (v2.1 or short-lived)
  - [ ] Implement in env vars or Secret Manager
  - [ ] Have emergency revocation plan

- [ ] **Webhook** (line-webhook)
  - [ ] Verify X-Line-Signature on every request
  - [ ] Return 200 within 2 seconds
  - [ ] Process events asynchronously
  - [ ] Handle redelivery (idempotency key or dedup)
  - [ ] Log X-Line-Request-Id for debugging

- [ ] **Messaging** (line-messaging)
  - [ ] Always use Reply when replyToken available (free!)
  - [ ] Batch users into Multicast (≤500 per call)
  - [ ] Never loop Broadcast — all messages in one call
  - [ ] Check quota before sending
  - [ ] Implement retry logic (exponential backoff)

- [ ] **Flex Messages** (line-flex-message)
  - [ ] Always set altText field
  - [ ] Test on iOS and Android
  - [ ] Use Flex Simulator during development
  - [ ] Optimize image sizes (HTTPS only)

- [ ] **Rich Menu** (line-rich-menu)
  - [ ] Image dimensions correct (2500×1686 or 2500×843)
  - [ ] Test on mobile (not visible on PC)
  - [ ] Cleanup aliases before deleting menus

- [ ] **Error Handling**
  - [ ] Handle 404 (user blocked, not friend, doesn't exist)
  - [ ] Handle 429 (rate limit) — exponential backoff
  - [ ] Handle 500 (LINE server error) — retry later
  - [ ] Handle network timeouts gracefully

---

## Unified Skill Index by Topic

**API Basics & Configuration**
→ line-api-common

**Receiving Messages & Events**
→ line-webhook

**Sending Messages (All Methods)**
→ line-messaging

**Rich Content**
→ line-flex-message (cards with layout)
→ line-rich-menu (persistent bottom menu)
→ line-messaging (templates, quick reply)

**Patterns & Best Practices**
→ line-api-common (token rotation, auth)
→ line-webhook (signature verification, idempotency)
→ line-messaging (batching, quota)

---

## Source Materials

This skill compiles:
- **Official LINE Developers docs** — specifications and guides
- **Production-tested Node.js/TypeScript patterns**

### Official LINE Developers Docs

- [Messaging API](https://developers.line.biz/en/reference/messaging-api/)
- [Webhook](https://developers.line.biz/en/docs/messaging-api/using-webhooks/)
- [Flex Message Reference](https://developers.line.biz/en/reference/messaging-api/#flex-message)
- [Rich Menu](https://developers.line.biz/en/docs/messaging-api/using-rich-menus/)

---

## Usage Tips for Claude / AI Assistants

When helping a developer:

1. **Identify the task** using the Decision Guide flowchart
2. **Load 1–2 skill files** most relevant — don't load all 5 at once
3. **Point to a recipe first** if one matches exactly
4. **Always include error handling** — never give happy-path code only
5. **Warn about gotchas proactively** (reply token expiry, 500-user limit, 1MB image cap, no PC rich menu)
6. **Link to official docs** for deep dives and breaking changes
