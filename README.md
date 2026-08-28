# Icarus Talent Planner

A modern, accurate, and fully interactive character and creature talent planner for **Icarus: Dangerous Horizons**.

**Current Version:** 1.1.0
**Live Planner:** [IcarusPlanner.app](https://icarusplanner.app)

Runs entirely in your browser. No account, installation, or backend service is required.

---

## Key Features

### Talent Guidance

Click a locked talent to:

- Highlight valid prerequisite routes
- See the talents required along each route
- See how many additional points are needed
- Compare alternative paths without treating one as the recommended route

### Complete Point-System Support

- General and Solo point pools
- Character-level scaling
- Mission-derived bonus talents
- Independent Mount, Pet, and Livestock point pools
- Correct rank gates, prerequisites, and refund validation
- Live point totals on General talent-tree headers

### Character and Creature Trees

- Fourteen General player talent trees
- Dedicated Solo tree
- Mount, Pet, and Livestock talent trees
- Independent progression for every creature
- Automatically owned creature baseline talents
- Creature layouts modeled after their in-game talent trees

### Creature Bloodline Tracking

- Live Bloodline statistics for creature builds
- Values update dynamically as talent points are spent or refunded
- Updates correctly after loading, importing, or resetting builds
- Bloodline panels aligned with the creature talent panels

### Effects Tracking

- Displays active player, Solo, and creature effects
- Updates immediately as the current build changes
- Optional inclusion of Solo effects

### Save and Manage Builds

- Save named builds in the browser
- Pin favorite builds
- Save player-only, creature-only, or complete builds
- Green indicator for the currently loaded, unchanged build
- Yellow indicator when the loaded build has unsaved changes
- Load, overwrite, delete, import, and export builds

### Share Builds

- Share builds through compressed URLs
- Import and export build data
- Support for player-only, creature-only, and complete builds
- Compatibility with legacy shared links

Large complete builds containing many creature allocations may still produce long URLs.

### Responsive UI Scaling

- Automatically scales between 50% and 100%
- Adapts when moving the browser between different displays
- Supports ultrawide, 1080p, and mobile viewports
- Preserves single-row player talent-tree layouts
- Keeps all talents reachable on narrow screens

### What's New Announcements

- Displays the latest feature announcement
- Can be dismissed for the current visit
- Optional "Do not show this message again" acknowledgment
- Can be reopened from the About panel

---

## How to Use

- **Left-click** a talent to spend a point
- **Right-click** a talent to refund a point
- Click a locked talent to preview its unlock paths
- Adjust **Character Level** and **Bonus Talents** to match your character
- Use **Reset Tree** to clear one talent tree
- Use **Reset All** to clear the complete planner state
- Use the **Save Build Manager** to store and organize builds
- Use **Import**, **Export**, or **Copy URL** to share builds

The active planner state is encoded in the page URL. Named saved builds are stored locally in the current browser and browser profile.

---

## Local Development

Install the locked dependencies:

```powershell
npm ci
```

Start the development server:

```powershell
npm run dev
```

Run the test suite:

```powershell
npm test
```

Create a production build:

```powershell
npm run build
```

---

## Project Goals

This project aims to:

- Match in-game talent behavior as closely as possible
- Provide clear visual guidance for build planning
- Support player and creature builds in one planner
- Preserve compatibility with previously shared builds
- Remain easy to update as Icarus receives new content

---

## Attribution

Based on the original **Icarus Talent Calculator** by **PanoramicPanda**.

This version includes substantial redesigns and improvements across talent logic, guidance, saves, sharing, creature support, Bloodline tracking, and responsive layout.

---

## Disclaimer

This is a fan-made, unofficial tool for *Icarus: Dangerous Horizons*.

All game content, names, and assets belong to **RocketWerkz** and their respective owners.

---

## License

Distributed under the MIT License. See the `LICENSE` file for details.
