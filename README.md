# Menu Filter

Long right-click menus are slow to scan. Menu Filter adds a filter box to the top of every long menu in Obsidian, so you can type a few letters instead of reading the whole list.

Right-click a folder, type `mov`, and the menu narrows to **Move folder to…**. Press <kbd>Enter</kbd> to run it.

![Typing "open" in a file's right-click menu narrows it to the five Open commands](https://raw.githubusercontent.com/sreenivasanac/menu-filter/main/docs/demo.gif)

## How it works

- The filter box appears on any menu with at least 8 items (configurable). It works on menus from the file explorer, the editor, tabs and other plugins.
- The box is focused as soon as the menu opens. Just start typing.
- Matching items stay visible and the first one is highlighted.
- <kbd>↑</kbd> / <kbd>↓</kbd> move the highlight, <kbd>Enter</kbd> runs it, <kbd>Esc</kbd> closes the menu.
- Short menus are left unchanged.

## Requirements

- **Native menus must be off.** With native menus on, the operating system draws the menus, so plugins can't change them. Turn them off in **Settings → Appearance → Native menus**. On macOS native menus are on by default, and the plugin's settings page warns you when they are.
- Obsidian 1.13 or later.
- Desktop only.

## Settings

| Setting | Default | Description |
| --- | --- | --- |
| Minimum menu size | 8 | Menus with fewer items don't get a filter box. |

## Installation

Once the plugin is approved, install it from **Settings → Community plugins → Browse** and search for "Menu Filter".

To install it manually, copy `main.js`, `manifest.json` and `styles.css` from the [latest release](https://github.com/sreenivasanac/menu-filter/releases/latest) into `<your vault>/.obsidian/plugins/menu-filter/`, then enable the plugin.

## Development

```bash
npm install
npm run dev    # rebuilds main.js on every change
npm run build  # type-check and production build
npm run lint
```

## License

[MIT](LICENSE)
