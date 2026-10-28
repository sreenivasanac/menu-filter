import { Menu, Plugin } from 'obsidian';
import { around } from 'monkey-around';
import { attachFilter } from './filter';
import { DEFAULT_SETTINGS, MenuFilterSettingTab, type MenuFilterSettings } from './settings';

export default class MenuFilterPlugin extends Plugin {
	settings: MenuFilterSettings = { ...DEFAULT_SETTINGS };

	async onload(): Promise<void> {
		await this.loadSettings();
		this.addSettingTab(new MenuFilterSettingTab(this.app, this));

		// Items can still be added in the same tick after a menu opens, so count
		// them on the next tick. Both entry points are wrapped because
		// showAtMouseEvent (used by most right-click menus) does not go through
		// showAtPosition.
		const afterShow = (menu: Menu): void => {
			window.setTimeout(() => attachFilter(menu, this.settings.minItems), 0);
		};
		this.register(
			around(Menu.prototype, {
				showAtPosition(next) {
					return function (this: Menu, ...args: Parameters<typeof next>) {
						const result = next.apply(this, args);
						afterShow(this);
						return result;
					};
				},
				showAtMouseEvent(next) {
					return function (this: Menu, ...args: Parameters<typeof next>) {
						const result = next.apply(this, args);
						afterShow(this);
						return result;
					};
				},
			}),
		);
	}

	async loadSettings(): Promise<void> {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, (await this.loadData()) as Partial<MenuFilterSettings>);
	}

	async saveSettings(): Promise<void> {
		await this.saveData(this.settings);
	}
}
