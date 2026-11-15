# BOUNCEBACK: THE GREAT ROAD ADVENTURE (Godot Engine 4.x)

**One Man. Countless Roads. Unlimited Bounces.**

This is the complete Godot Engine 4.x (`GDScript`, `3D GL Compatibility`) migration of **BOUNCEBACK: THE GREAT ROAD ADVENTURE**, preserving the full 3D gameplay, physics, sculpted character rig & 15 procedural animations, 10 worlds, 50 stages, traffic & bosses, collectibles, challenges, achievements, FAHH audio signature, keyboard + mobile touch controls, and persistent saving.

---

## Requirements

- **Godot Engine 4.3 or 4.4** (Standard GDScript version — no .NET/Mono required).
- For building exports (**itch.io Web HTML5**, Windows `.exe`, Android `.apk/.aab`): install the official **Godot Export Templates** matching your installed Godot version (`Editor -> Manage Export Templates... -> Download and Install`).

---

## Opening & Testing Locally in Godot Editor

1. Open **Godot Engine 4.x**.
2. Click **Import**, browse into the `BOUNCEBACK/` folder, and select `project.godot`.
3. Click **Import & Edit**, then press **F5** (or click **Run Project**) to play immediately.

---

## Exporting for itch.io (`BOUNCEBACK-ITCH-IO.zip`)

The `Web` preset in `export_presets.cfg` is already preconfigured for itch.io compatibility:
- `variant/thread_support=false` (Single-threaded WebAssembly — works in itch.io iframes without needing Cross-Origin Isolation / `SharedArrayBuffer` headers).
- `html/canvas_resize_policy=2` (Adaptive viewport & canvas resizing).
- `html/focus_canvas_on_start=true` (Keyboard input captures immediately on start).
- Single-click AudioContext unlock via Godot's Web Audio driver when the player presses **PLAY**.
- Automatic desktop keyboard + mobile virtual joystick/buttons (`touchControlsMode = "auto"`).

### Option A — Export Inside Godot Editor (Recommended)

1. Open `BOUNCEBACK/project.godot` in Godot 4.3+.
2. Click `Project -> Export...`.
3. Select the **`Web`** preset (`builds/web/index.html`).
4. Click **`Export Project...`**, make sure the filename is `index.html` inside `builds/web/`, and disable `Export With Debug` for a smaller release `.wasm` / `.pck`.
5. Godot outputs `index.html`, `index.js`, `index.wasm`, `index.pck`, `index.audio.worklet.js`, and icons inside `builds/web/`.
6. Select **all files inside `builds/web/`** (not the outer folder!) and compress them into `BOUNCEBACK-ITCH-IO.zip` so **`index.html` sits directly at the ZIP root**.

### Option B — Automated CLI Script

If Godot 4 is in your `PATH` (or `GODOT_BIN` points to it):
- **Windows**: Double-click or run `export_itch_io.bat`
- **macOS / Linux**: Run `chmod +x export_itch_io.sh && ./export_itch_io.sh`

### Testing the Web Export Before Uploading

Browsers block `WebAssembly` (`fetch` on `.wasm` / `.pck`) over raw `file://` URLs. To test the exported `builds/web/` folder locally:
- Click Godot Editor's top-right **Remote Debug / Run in Browser** button, **or**
- Run `python -m http.server 8080` inside `builds/web/` and open `http://localhost:8080`.

### itch.io Upload Settings

1. **Kind of project**: `HTML`
2. Upload **`BOUNCEBACK-ITCH-IO.zip`**
3. Check **`This file will be played in the browser`**
4. **Viewport dimensions**: `1280 x 720` (enable **Fullscreen button** and **Mobile friendly**)
5. Leave *SharedArrayBuffer support* unchecked (since `thread_support=false` works universally across desktop & mobile browsers).

---

## Controls

| Action | Default Key / Input |
| :--- | :--- |
| Move | `W A S D` or `Arrow Keys` (Virtual Joystick on Mobile) |
| Camera Orbit / Zoom | Drag Left Mouse Button / Scroll Wheel |
| Jump / Double Jump | `Space` |
| Super Bounce | `Q` |
| Road Dash | `V` |
| Slide / Duck | `Ctrl` or `C` |
| Sprint | `Shift` |
| Highway Surge (Slow-Mo Special) | `F` |
| Activate Bridge Switch | `E` |
| Respawn at Checkpoint | `R` |
| Mute All Audio | `M` |
| Pause Menu | `Esc` or `P` |

---

## Project Architecture

```text
BOUNCEBACK/
├── project.godot                   # Godot 4 project config (GL Compatibility, Autoloads, 1280x720 canvas_items)
├── export_presets.cfg              # Preconfigured presets for Windows Desktop, Android, and Web (itch.io ready)
├── export_itch_io.bat / .sh        # One-step Godot CLI Web export + BOUNCEBACK-ITCH-IO.zip packager
├── icon.svg                        # Vector launcher icon
├── scenes/                         # Main.tscn, Player.tscn, Road.tscn, Obstacle.tscn, Coin.tscn, PowerUp.tscn, UI scenes
├── scripts/
│   ├── autoload/                   # SaveManager, AudioManager, GameManager
│   └── ...                         # main.gd, player.gd, road.gd, obstacle.gd, coin.gd, powerup.gd, scenery_builder.gd, UI scripts
└── assets/
    ├── data/game_data.json         # Complete 10 worlds, 50 stages, cosmetics, challenges & achievements dataset
    ├── sounds/fahhh.mp3            # Original FAHH sound effect
    ├── fonts/                      # Chakra Petch, Plus Jakarta Sans, JetBrains Mono (.ttf)
    ├── animations/character_poses.tres
    ├── characters/hero_rig_palette.json
    └── images/                     # SVG emblems & coin icons
```
