import { App, Platform, PluginSettingTab, Setting } from 'obsidian';
import type MenuFilterPlugin from './main';

export interface MenuFilterSettings {
	/** Menus with fewer items than this are left alone. */
	minItems: number;
}

export const DEFAULT_SETTINGS: MenuFilterSettings = {
	minItems: 8,
};

/**
 * With "Native menus" on, menus are drawn by the operating system and never
 * reach the DOM, so they can't be filtered. The setting is unset by default,
 * which means native menus on macOS and DOM menus elsewhere.
 */
export function nativeMenusEnabled(app: App): boolean {
	const vault = app.vault as unknown as { getConfig?(key: string): unknown };
	const value = vault.getConfig?.('nativeMenus');
	return value === true || (value == null && Platform.isMacOS);
}

export class MenuFilterSettingTab extends PluginSettingTab {
	constructor(
		app: App,
		private readonly plugin: MenuFilterPlugin,
	) {
		super(app, plugin);
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();

		if (nativeMenusEnabled(this.app)) {
			new Setting(containerEl)
				.setName('Native menus are turned on')
				.setDesc(
					'Menus are drawn by the operating system and cannot be filtered. ' +
						'Turn off native menus in Settings → Appearance to use this plugin.',
				)
				.setClass('menu-filter-warning');
		}

		new Setting(containerEl)
			.setName('Minimum menu size')
			.setDesc('Show the filter box only on menus with at least this many items.')
			.addSlider((slider) =>
				slider
					.setLimits(2, 20, 1)
					.setValue(this.plugin.settings.minItems)
					.onChange(async (value) => {
						this.plugin.settings.minItems = value;
						await this.plugin.saveSettings();
					}),
			);
	}
}
