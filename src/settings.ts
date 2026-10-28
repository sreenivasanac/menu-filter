import { App, Platform, PluginSettingTab, type SettingDefinitionItem } from 'obsidian';
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
function nativeMenusEnabled(app: App): boolean {
	const vault = app.vault as unknown as { getConfig?(key: string): unknown };
	const value = vault.getConfig?.('nativeMenus');
	return value === true || (value == null && Platform.isMacOS);
}

/** Declarative settings: PluginSettingTab reads and saves `plugin.settings[key]` itself. */
export class MenuFilterSettingTab extends PluginSettingTab {
	constructor(app: App, plugin: MenuFilterPlugin) {
		super(app, plugin);
	}

	getSettingDefinitions(): SettingDefinitionItem[] {
		return [
			{
				type: 'group',
				cls: 'menu-filter-warning',
				visible: () => nativeMenusEnabled(this.app),
				items: [
					{
						name: 'Native menus are turned on',
						desc: 'Menus are drawn by the operating system and cannot be filtered. Turn off native menus in Settings → Appearance to use this plugin.',
						searchable: false,
					},
				],
			},
			{
				name: 'Minimum menu size',
				desc: 'Show the filter box only on menus with at least this many items.',
				control: { type: 'slider', key: 'minItems', min: 2, max: 20, step: 1, defaultValue: DEFAULT_SETTINGS.minItems },
			},
		];
	}
}
