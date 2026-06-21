---
project: port-fishing
purpose: Shared context for future agents working on this repository
---

# Port Fishing

Port Fishing is a fishing game designed to make SDLC workflows more engaging. The project turns healthy engineering activity inside Port.io into game progress: users earn Fishing Tokens, also called baits, and spend them to "go fish".

The game is primarily delivered through a Chrome extension that runs exclusively on top of Port.io, with an additional Lovable-based site planned for later. The extension reads data from Port.io and uses that data to reward users for meaningful workflow activity.

## Core Idea

- Users perform SDLC-related actions in Port.io.
- The Chrome extension reads relevant Port.io data.
- The system rewards users with Fishing Tokens / baits.
- Users spend baits to go fishing.
- Caught fish are accumulated per user.
- Each user can view their collected fish in an aquarium.
- The aquarium opens from the extension as a side experience inside Port.io.
- Fish are also collected into a larger fish-dex, giving users a long-term collection goal.

The game should feel like a lightweight motivational layer over Port.io, not a replacement for Port.io workflows. Keep Port.io as the source of truth for SDLC activity.

## Product Surfaces

### Chrome Extension

This is the main product surface.

- Runs over Port.io.
- Reads Port.io data to determine rewards.
- Shows the user's baits / Fishing Tokens.
- Lets the user go fish.
- Opens the aquarium as a side panel or side experience on top of Port.io.
- Should feel native, fast, and non-disruptive.

### Aquarium

The aquarium is the user's personal collection view.

- Represents the fish the user has accumulated.
- Should feel rewarding and alive.
- Should make progress visible at a glance.
- Can later support rarity, animations, fish details, or collection milestones.

### Fish-Dex

The fish-dex is the broader collection system.

- Tracks all fish types the user has discovered.
- Encourages repeated engagement.
- Should support rarity and completion-style goals over time.

### Lovable Site

The Lovable-based site is planned but not yet defined.

- Do not over-specify it yet.
- Treat it as a future marketing, landing, dashboard, or companion surface until product decisions are made.
- Keep implementation decisions flexible.

## Design Notes

- The experience should be playful, but it must remain useful and connected to SDLC behavior.
- Reward mechanics should reinforce positive engineering workflows rather than arbitrary clicks.
- Keep the extension lightweight. Avoid blocking or cluttering the Port.io experience.
- Prefer clear, simple game loops over complex mechanics during the hackathon phase.
- Use Port.io data as the behavioral source. Do not invent parallel workflow state unless necessary.
- Design for per-user progress first. Team-wide mechanics can be added later.
- The MVP should make the loop obvious: do useful work in Port.io, earn bait, catch fish, see collection progress.

## Vocabulary

- **Fishing Tokens / Baits**: The spendable reward currency users earn from Port.io activity.
- **Go Fish**: The action where a user spends bait to attempt catching fish.
- **Fish**: Collectible rewards earned through fishing.
- **Aquarium**: Personal display of the user's accumulated fish.
- **Fish-Dex**: Catalog of discovered and undiscovered fish.
- **Port.io**: The SDLC platform the extension runs on and reads from.

## Agent Guidance

- Preserve this project framing unless the user explicitly changes it.
- When making product or technical choices, bias toward the Chrome extension and Port.io integration first.
- Do not treat the Lovable site as the primary app until more details are provided.
- Keep language consistent: use "Fishing Tokens" and "baits" as the same concept unless the user later separates them.
- Ask before adding major gameplay systems such as trading, leaderboards, teams, quests, or marketplaces.
- Keep future implementation aligned with a hackathon-friendly MVP.
