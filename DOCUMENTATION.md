# FMV Engine Documentation

## Overview

This project is a browser-based FMV engine designed for interactive video scenes.

It currently includes:

- A web editor in `index.html`
- A runtime player in `player.html`
- Scene-based project data stored in `data.json`
- Multi-layer video playback
- Interactive jumps and automatic triggers
- Import / export of project JSON

The engine is intended to help build interactive FMV experiences quickly, with a workflow centered around scenes, layers, and trigger zones.

## Core Concepts

### Scene

A scene is a full interactive state.

Each scene contains:

- A name
- 3 video layers
- A list of jumps / triggers

Switching to another scene replaces the current scene state.

### Layer

Each scene has 3 layers:

- Layer 0: background
- Layer 1: middle
- Layer 2: foreground

Each layer can contain:

- A playlist of videos
- A start video index
- Volume and mute state

This allows menu overlays, compositing, and alpha-video setups.

### Jump / Trigger

A jump is an interactive or automatic event defined over a frame range.

Each jump contains:

- `in`: start frame
- `out`: end frame
- `btn`: trigger button or `AUTO`
- `sourceLayer`: layer used for frame timing
- `targetLayer`: layer affected by the action
- `loop`: whether the range loops until action
- `sMode`: success action mode
- `sDest`: success destination
- `fMode`: failure action mode
- `fDest`: failure destination

Supported action modes:

- `none`
- `jump`
- `video`
- `scene`

## Current FPS Logic

The engine is currently configured to run at **25 FPS**.

This value is used for:

- Time to frame conversion
- Frame to time conversion
- Trigger timing
- Loop timing
- Seeking logic

Important:

- Your source videos should ideally be encoded in **constant 25 FPS**
- If a video uses another framerate, your frame markers may drift

## Editor

The editor is available in `index.html`.

Main features:

- Create, rename, delete scenes
- Define which scene is the startup scene
- Switch active scene
- Switch active layer
- Add videos to a layer playlist
- Choose the start video for each layer
- Configure per-layer audio
- Create and edit jumps
- Export and import project JSON

### Scene Workflow

Typical workflow:

1. Create a scene
2. Load videos into one or more layers
3. Choose the start video for each layer
4. Add interactive or automatic jumps
5. Repeat for the next scene
6. Set the startup scene
7. Export `data.json`

### Trigger Types

The editor supports:

- Button-based triggers: `A`, `B`, `X`, `Y`, D-pad
- `AUTO` triggers: automatic action when reaching a frame range

For an exact auto scene switch, a common setup is:

- `IN = 185`
- `OUT = 185`
- `Button = AUTO`
- `Success Mode = scene`
- `Success Destination = Scene 1`

For extra robustness near the end of a clip, a small range such as `183 -> 186` is usually safer than a single-frame trigger.

## Player

The runtime player is available in `player.html`.

It loads `data.json` and runs the interactive experience.

Current runtime features:

- Startup scene loading
- 3 layered videos
- Per-layer playback
- Jump handling
- Auto triggers
- Scene switching
- Pause overlay
- Gamepad support

### Gamepad

The runtime supports:

- `A`, `B`, `X`, `Y`
- D-pad directions
- `Start` to toggle pause

If the window loses focus, playback pauses and the overlay appears.

`Start` can also resume playback.

## JSON Project Structure

Current exported format:

```json
{
  "version": 3,
  "currentSceneIdx": 1,
  "startupSceneIdx": 1,
  "scenes": [
    {
      "name": "Scene 1",
      "layers": [
        {
          "playlist": [
            {
              "url": "http://localhost:8000/video.webm",
              "loop": false
            }
          ],
          "startVideoIndex": 0,
          "volume": 1,
          "muted": false
        }
      ],
      "jumps": [
        {
          "in": 100,
          "out": 110,
          "btn": 0,
          "sourceLayer": 0,
          "targetLayer": 0,
          "loop": false,
          "sMode": "scene",
          "sDest": "Scene 2",
          "fMode": "none",
          "fDest": ""
        }
      ]
    }
  ],
  "filters": {
    "sat": "140",
    "con": "110",
    "lum": "105"
  }
}
```

### Notes

- `btn: -1` means `AUTO`
- `startupSceneIdx` defines which scene launches first
- `sourceLayer` is the timing reference layer
- `targetLayer` is the action target layer

## File Structure

Main files:

- [index.html](D:/Projet_Programmation/MoteurFMV/index.html)
- [player.html](D:/Projet_Programmation/MoteurFMV/player.html)
- [data.json](D:/Projet_Programmation/MoteurFMV/data.json)
- [js/state.js](D:/Projet_Programmation/MoteurFMV/js/state.js)
- [js/main.js](D:/Projet_Programmation/MoteurFMV/js/main.js)
- [js/gamepad.js](D:/Projet_Programmation/MoteurFMV/js/gamepad.js)
- [js/scenes.js](D:/Projet_Programmation/MoteurFMV/js/scenes.js)
- [js/jumps.js](D:/Projet_Programmation/MoteurFMV/js/jumps.js)
- [js/video.js](D:/Projet_Programmation/MoteurFMV/js/video.js)
- [js/playlist.js](D:/Projet_Programmation/MoteurFMV/js/playlist.js)
- [js/io.js](D:/Projet_Programmation/MoteurFMV/js/io.js)

## Timing Notes

The engine uses frame-driven logic, but browser video playback still has limits.

The project now uses `requestVideoFrameCallback()` when available to improve timing accuracy.

This helps for:

- Trigger evaluation
- Loop ranges
- Auto scene changes

However:

- Browser video playback is still not a perfect frame-locked cinema pipeline
- Critical triggers should not rely only on the very last frame of a clip

Best practice:

- Use constant 25 FPS source videos
- Use a small trigger window for critical transitions
- Avoid placing important transitions only on the final frame

## Video Format Recommendations

For this project, the preferred direction is:

- `WebM`
- ideally VP9 when alpha is needed
- constant 25 FPS

Why:

- Better fit for alpha video workflows
- More consistent with the engine's artistic direction
- Good for layered FMV composition

## Current Strengths

This engine already supports:

- Scene-based FMV structure
- Layered composition
- Alpha-friendly workflows
- Interactive branching
- Auto triggers
- Startup scene selection
- Web publishing

This makes it suitable for:

- FMV prototypes
- Interactive menus
- Retro-inspired FMV experiences
- AI-generated video interactive projects
- Early web-based authoring workflows

## Current Limitations

Known limits of the current browser-first approach:

- Browser video playback is not perfectly frame-locked
- Exact last-frame transitions can still be fragile
- Hosting and bandwidth matter for large videos
- A fully custom video pipeline would be more accurate, but much more complex

For a practical `v0.1`, the current architecture is a good balance between:

- simplicity
- speed of iteration
- publishability
- creative flexibility

## Recommended v0.1 Workflow

1. Encode videos at constant 25 FPS
2. Use stable hosted URLs
3. Build scenes one by one
4. Add loops and triggers
5. Set startup scene
6. Export `data.json`
7. Test in `player.html`
8. Publish the site and media

## Long-Term Direction

The long-term vision can evolve from:

- a playable FMV prototype

toward:

- a reusable FMV engine
- a creator tool for scene-based interactive video
- a lightweight web-first authoring system

## Summary

This engine is a lightweight browser FMV system built around:

- scenes
- layers
- frame-based triggers
- web deployment

It is already a solid base for a `v0.1` interactive FMV workflow and can grow into a more complete authoring tool over time.
