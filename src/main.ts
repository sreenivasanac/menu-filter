import { Menu, Plugin } from 'obsidian';
import { around } from 'monkey-around';
import { MenuFilter } from './filter';
import { DEFAULT_SETTINGS, MenuFilterSettingTab, type MenuFilterSettings } from './settings';

type ShowMethod = (this: Menu, ...args: never[]) => Menu;

export default class MenuFilterPlugin extends Plugin {
	settings: MenuFilterSettings = { ...DEFAULT_SETTINGS };

	async onload(): Promise<void> {
		await this.loadSettings();
		this.addSettingTab(new MenuFilterSettingTab(this.app, this));

		// Both entry points are wrapped because showAtMouseEvent (used by most
		// right-click menus) does not go through showAtPosition.
		const minItems = (): number => this.settings.minItems;
		const afterShow = (next: ShowMethod): ShowMethod => {
			return function (this: Menu, ...args) {
				const result = next.apply(this, args);
				// Items can still be added in the same tick after a menu opens,
				// so count them on the next tick.
				window.setTimeout(() => MenuFilter.attach(this, minItems()), 0);
				return result;
			};
		};
		this.register(around(Menu.prototype, { showAtPosition: afterShow, showAtMouseEvent: afterShow }));
	}

	async loadSettings(): Promise<void> {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, (await this.loadData()) as Partial<MenuFilterSettings>);
	}
}
