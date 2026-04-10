# Unload Decision Matrix

How TabRest decides when to unload tabs.

## Triggers

| Trigger          | Frequency   | Purpose                                                      |
| ---------------- | ----------- | ------------------------------------------------------------ |
| **Timer**        | Every 1 min | Unload tabs inactive beyond `unloadDelayMinutes`             |
| **Memory**       | Every 30s   | Unload LRU tabs when RAM exceeds `memoryThresholdPercent`    |
| **Per-tab Heap** | Every 30s   | Unload tabs with JS heap exceeding `perTabJsHeapThresholdMB` |
| **Blacklist**    | With Timer  | Immediately unload tabs matching blacklisted domains         |

## Protection Matrix

| Protection          | Timer | Memory | Per-tab Heap | Blacklist |
| ------------------- | :---: | :----: | :----------: | :-------: |
| Active tab          |  Yes  |  Yes   |     Yes      |    Yes    |
| Already discarded   |  Yes  |  Yes   |     Yes      |    Yes    |
| Snoozed             |  Yes  |  Yes   |     Yes      |    Yes    |
| Pinned (if enabled) |  Yes  |  Yes   |     Yes      |    Yes    |
| Whitelist           |  Yes  |  Yes   |     Yes      |    Yes    |
| Audio playing       |  Yes  |  Yes   |     Yes      |    Yes    |
| Unsaved form        |  Yes  |  Yes   |     Yes      |    Yes    |
| Offline skip        |  Yes  |  Yes   |     Yes      |    Yes    |
| Idle-only           |  Yes  |   No   |      No      |    No     |
| Min tabs threshold  |  Yes  |   No   |      No      |    No     |

**Note:** Idle-only and Min tabs threshold only apply to Timer:

| Protection    | Why Timer only?                                                                 |
| ------------- | ------------------------------------------------------------------------------- |
| **Idle-only** | Memory is emergency - waiting for idle could cause system freeze if RAM is full |
| **Min tabs**  | Memory pressure needs immediate relief regardless of tab count                  |

Timer = convenience (non-urgent), Memory/Heap = emergency (must act immediately to prevent crash).

## Protection Priority

```
1. ABSOLUTE (never unload)
   - Active tab
   - Already discarded

2. EXPLICIT USER PROTECTION
   - Snoozed tabs/domains

3. DATA PROTECTION
   - Unsaved form data
   - Offline mode (tab can't reload)

4. EXPERIENCE PROTECTION
   - Audio playing
   - Whitelist domains
   - Pinned tabs

5. CONDITIONAL (Timer only)
   - Idle-only check
   - Min tabs threshold
```

## Decision Flow

```
Trigger arrives (Timer/Memory/Heap/Blacklist)
                │
                ▼
┌───────────────────────────────┐
│ ABSOLUTE CHECKS (all)         │
│ • Active? → SKIP              │
│ • Discarded? → SKIP           │
│ • Snoozed? → SKIP             │
└───────────────────────────────┘
                │
                ▼
┌───────────────────────────────┐
│ DATA PROTECTION (all)         │
│ • Unsaved form? → SKIP        │
│ • Offline? → SKIP             │
└───────────────────────────────┘
                │
                ▼
┌───────────────────────────────┐
│ EXPERIENCE (all)              │
│ • Audio playing? → SKIP       │
│ • Whitelisted? → SKIP         │
│ • Pinned (protected)? → SKIP  │
└───────────────────────────────┘
                │
                ▼
┌───────────────────────────────┐
│ CONDITIONAL (Timer only)      │
│ • User not idle? → SKIP       │
│ • Below minTabs? → SKIP       │
└───────────────────────────────┘
                │
                ▼
          ✓ UNLOAD TAB
```

## Power Modes

| Mode          | Delay Multiplier       | Memory Threshold Offset |
| ------------- | ---------------------- | ----------------------- |
| Battery Saver | 0.5x (more aggressive) | -10% (lower threshold)  |
| Normal        | 1.0x                   | 0%                      |
| Performance   | 2.0x (less aggressive) | +10% (higher threshold) |
