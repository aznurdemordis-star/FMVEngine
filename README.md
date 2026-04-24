# FMV Engine

A lightweight browser-based FMV engine for building interactive video scenes.

This project is designed as a simple foundation for web FMV experiences with:

- scene-based structure
- 3 video layers
- interactive jumps
- automatic triggers
- scene switching
- JSON import / export

## Current Status

This is an early version of the engine intended for experimentation, prototyping, and building a first playable FMV workflow on the web.

## Features

- Multi-scene projects
- 3-layer video composition
- Scene startup selection
- Per-layer playlists
- Per-layer audio controls
- Button-based triggers
- `AUTO` triggers
- Loop zones
- Scene-to-scene transitions
- Browser player runtime
- JSON import / export
- Gamepad support

## Tech Direction

The engine currently runs in the browser and uses a frame-based logic model at **25 FPS**.

It is aimed at:

- FMV prototypes
- interactive menus
- retro-inspired FMV experiences
- AI-generated video storytelling workflows

## Files

Main files:

- [index.html](D:/Projet_Programmation/MoteurFMV/index.html): editor
- [player.html](D:/Projet_Programmation/MoteurFMV/player.html): runtime player
- [data.json](D:/Projet_Programmation/MoteurFMV/data.json): project data
- [DOCUMENTATION.md](D:/Projet_Programmation/MoteurFMV/DOCUMENTATION.md): technical documentation

Core scripts:

- [js/state.js](D:/Projet_Programmation/MoteurFMV/js/state.js)
- [js/main.js](D:/Projet_Programmation/MoteurFMV/js/main.js)
- [js/gamepad.js](D:/Projet_Programmation/MoteurFMV/js/gamepad.js)
- [js/scenes.js](D:/Projet_Programmation/MoteurFMV/js/scenes.js)
- [js/jumps.js](D:/Projet_Programmation/MoteurFMV/js/jumps.js)
- [js/video.js](D:/Projet_Programmation/MoteurFMV/js/video.js)
- [js/playlist.js](D:/Projet_Programmation/MoteurFMV/js/playlist.js)
- [js/io.js](D:/Projet_Programmation/MoteurFMV/js/io.js)

## How To Run

Serve the project through a local web server.

Example:

1. Start a local server in the project folder
2. Open `index.html` for the editor
3. Open `player.html` for runtime playback

The included [serv.bat](D:/Projet_Programmation/MoteurFMV/serv.bat) can be used as a starting point for local serving if it matches your setup.

## Workflow

Basic workflow:

1. Open the editor
2. Create scenes
3. Add videos to layers
4. Define start videos
5. Create jumps and automatic triggers
6. Set the startup scene
7. Export `data.json`
8. Test in the player

## Notes

- The engine currently assumes **constant 25 FPS** source videos
- `WebM` is the preferred direction, especially when alpha video is needed
- Critical transitions are more reliable when using a small trigger range rather than a single last-frame trigger

## License

Recommended code license: **MIT**

Important:

- this repository's code can be licensed separately from the media content
- videos, images, audio, and other creative assets do not have to be covered by the same license as the engine code

## Vision

The goal of this project is not only to play FMV scenes, but to grow into a simple engine for creating interactive FMV experiences on the web.
