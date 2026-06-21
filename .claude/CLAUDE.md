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

This is the main product surface. It should feel like a native companion to Port.io: always close to the user's SDLC work, but never in the way.

- Runs over Port.io.
- Reads Port.io data to determine rewards.
- Shows the user's baits / Fishing Tokens.
- Lets the user go fish.
- Opens the aquarium as a side panel or side experience on top of Port.io.
- Should feel native, fast, and non-disruptive.
- Surfaces rewards where users already notice SDLC progress, such as completed actions, merged changes, scorecard improvements, or service updates.
- Makes the next game action obvious: bait earned, cast available, fish caught, aquarium updated.
- Treats the aquarium as the emotional reward surface, not the main work surface.

The extension should not become a generic overlay game. Its reason to exist is that it makes Port.io workflow progress feel more rewarding.

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

## Game Loop

The core loop should be:

1. A user completes a meaningful SDLC action in Port.io.
2. The extension evaluates the action's value, rarity, speed, and context.
3. The user earns Fishing Tokens / baits.
4. The user spends bait to go fish.
5. The fishing result is randomized, but weighted by the bait's source and quality.
6. The caught fish appears in the aquarium and updates the fish-dex.

This should be earned randomness: fishing must include surprise, but the odds should reflect real SDLC outcomes.

## Reward Model

MVP rewards should prioritize completed SDLC outcomes over raw activity. Good reward sources include:

- Merged PRs or completed code changes.
- Resolved incidents or closed operational work.
- Completed scorecards or improved service maturity.
- Service lifecycle events.
- Ownership updates.
- Production readiness improvements.
- Other Port.io-backed actions that represent meaningful workflow progress.

Avoid rewarding page visits, clicks, refreshes, or repeated low-value interactions as primary bait sources. If daily activity rewards exist, they should be small baseline nudges, not the main progression path.

Fishing Tokens / baits should not behave like generic points. They should carry enough context to influence the fishing result: what action earned them, how valuable the action was, which service it affected, and whether the action was unusually fast or rare.

## Rarity Model

Fish rarity should combine chance with SDLC context:

- **Base randomness**: fishing should still feel surprising.
- **Action rarity**: uncommon or high-value Port.io events should improve odds.
- **Action quality**: cleaner or faster workflow completion can slightly improve odds.
- **Service context**: the affected service can change the available fish pool.
- **User history**: repeated identical actions should not endlessly produce high-value outcomes.

For example, if a branch is created and merged unusually quickly, that can slightly improve rarity odds. It should be a modifier, not the whole system. Speed alone should not beat more meaningful engineering outcomes.

Service-based fish pools are important and should stay extensible. Future agents should expect the user to expand on how services map to fish types, habitats, themes, or rarity bands.

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
- Do not make the game reward spammy or low-value actions.
- Do not let randomness fully override meaningful SDLC context.
- Prefer simple configurable formulas over hardcoded one-off reward logic.
- Keep service-based fish pools extensible.
