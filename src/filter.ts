import type { Menu, MenuItem } from 'obsidian';

/** Menu internals this plugin relies on; they are not part of the public typings. */
type MenuItemInternals = MenuItem & { dom?: HTMLElement; handleEvent?(evt: Event): void };
type MenuInternals = Menu & { dom?: HTMLElement; items?: MenuItemInternals[] };

const FILTER_CLASS = 'menu-filter-row';
const HIDDEN_CLASS = 'menu-filter-hidden';
const NAV_KEYS = new Set(['ArrowDown', 'ArrowUp', 'Enter', 'Escape']);

/**
 * Inserts a filter input at the top of an open menu. Typing hides
 * non-matching items, the arrow keys move the highlight, Enter runs the
 * highlighted (or first) match and Escape closes the menu.
 */
export function attachFilter(menu: Menu, minItems: number): void {
	const internals = menu as MenuInternals;
	const dom = internals.dom;
	if (!dom?.isConnected || dom.querySelector(`.${FILTER_CLASS}`)) return;

	const container = dom.querySelector<HTMLElement>('.menu-scroll') ?? dom;
	const allItems = (): HTMLElement[] => Array.from(container.querySelectorAll<HTMLElement>('.menu-item'));
	if (allItems().length < minItems) return;

	const row = createDiv({ cls: FILTER_CLASS });
	const input = row.createEl('input', {
		type: 'text',
		placeholder: 'Filter…',
		attr: { 'aria-label': 'Filter menu items' },
	});
	container.prepend(row);

	const visibleItems = (): HTMLElement[] => allItems().filter((el) => !el.hasClass(HIDDEN_CLASS));
	// Nothing is highlighted until the user types or presses an arrow key.
	let selected = -1;

	const paint = (): void => {
		const visible = visibleItems();
		for (const el of allItems()) el.removeClass('selected');
		visible[selected]?.addClass('selected');
	};

	const applyFilter = (): void => {
		const query = input.value.trim().toLowerCase();
		for (const el of allItems()) {
			el.toggleClass(HIDDEN_CLASS, query !== '' && !(el.textContent ?? '').toLowerCase().includes(query));
		}
		// Separators are noise once the list is filtered.
		container.querySelectorAll<HTMLElement>('.menu-separator').forEach((sep) => sep.toggleClass(HIDDEN_CLASS, query !== ''));
		selected = query && visibleItems().length ? 0 : -1;
		paint();
	};

	const runItem = (el: HTMLElement | undefined): void => {
		// A synthetic DOM click dispatched from a keydown handler is ignored by
		// the menu, so activate the item through the menu's own handler.
		const item = el && internals.items?.find((candidate) => candidate.dom === el);
		item?.handleEvent?.(new MouseEvent('click'));
	};

	// The menu's own keymap handles navigation keys at the document level
	// before the input sees them, so listen on window in the capture phase.
	const onKeyDown = (evt: KeyboardEvent): void => {
		if (!dom.isConnected) {
			window.removeEventListener('keydown', onKeyDown, true);
			return;
		}
		if (document.activeElement !== input || !NAV_KEYS.has(evt.key)) return;
		evt.preventDefault();
		evt.stopImmediatePropagation();

		const visible = visibleItems();
		if (evt.key === 'ArrowDown') {
			selected = Math.min(selected + 1, visible.length - 1);
			paint();
		} else if (evt.key === 'ArrowUp') {
			selected = Math.max(selected - 1, 0);
			paint();
		} else if (evt.key === 'Escape') {
			menu.hide();
		} else {
			runItem(visible[Math.max(selected, 0)]);
		}
	};

	input.addEventListener('input', applyFilter);
	window.addEventListener('keydown', onKeyDown, true);
	menu.onHide(() => window.removeEventListener('keydown', onKeyDown, true));

	// The extra row can push a menu opened near the bottom off screen.
	const rect = dom.getBoundingClientRect();
	if (rect.bottom > window.innerHeight - 8) {
		dom.setCssStyles({ top: `${Math.max(8, window.innerHeight - 8 - rect.height)}px` });
	}
	input.focus();
}
