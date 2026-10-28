import type { Menu, MenuItem } from 'obsidian';

/** Menu internals this plugin relies on; they are not part of the public typings. */
type MenuItemInternals = MenuItem & { dom?: HTMLElement; handleEvent?(evt: Event): void };
type MenuInternals = Menu & { dom?: HTMLElement; items?: MenuItemInternals[] };

const FILTER_CLASS = 'menu-filter-row';
const HIDDEN_CLASS = 'menu-filter-hidden';
const SCREEN_MARGIN = 8;

/**
 * A filter input at the top of an open menu. Typing hides non-matching
 * items and highlights the first match; the arrow keys move the highlight,
 * Enter runs the highlighted item and Escape closes the menu.
 */
export class MenuFilter {
	private readonly input: HTMLInputElement;
	/** Index into the navigable items; -1 until the user types or presses an arrow. */
	private selected = -1;

	/** Adds a filter to `menu` if it is open, unfiltered and has at least `minItems` items. */
	static attach(menu: Menu, minItems: number): void {
		const dom = (menu as MenuInternals).dom;
		if (!dom?.isConnected || dom.querySelector(`.${FILTER_CLASS}`)) return;
		const container = dom.querySelector<HTMLElement>('.menu-scroll') ?? dom;
		if (container.querySelectorAll('.menu-item').length < minItems) return;
		new MenuFilter(menu, dom, container);
	}

	private constructor(
		private readonly menu: MenuInternals,
		private readonly dom: HTMLElement,
		private readonly container: HTMLElement,
	) {
		const row = createDiv({ cls: FILTER_CLASS });
		this.input = row.createEl('input', {
			type: 'text',
			placeholder: 'Filter…',
			attr: { 'aria-label': 'Filter menu items' },
		});
		container.prepend(row);

		this.input.addEventListener('input', this.applyFilter);
		// The menu's own keymap handles navigation keys at the document level
		// before the input sees them, so listen on the window (main or pop-out)
		// in the capture phase.
		this.dom.win.addEventListener('keydown', this.onKeyDown, true);
		menu.onHide(this.detach);

		this.keepOnScreen();
		this.input.focus();
	}

	private items(): HTMLElement[] {
		return Array.from(this.container.querySelectorAll<HTMLElement>('.menu-item'));
	}

	/** Visible, actionable items (not disabled, not labels): the ones the arrow keys and Enter act on. */
	private navigable(): HTMLElement[] {
		return this.items().filter((el) => !el.hasClass(HIDDEN_CLASS) && !el.hasClass('is-disabled') && !el.hasClass('is-label'));
	}

	private readonly applyFilter = (): void => {
		const query = this.input.value.trim().toLowerCase();
		for (const el of this.items()) {
			el.toggleClass(HIDDEN_CLASS, query !== '' && !(el.textContent ?? '').toLowerCase().includes(query));
		}
		// Separators are noise once the list is filtered.
		this.container.querySelectorAll<HTMLElement>('.menu-separator').forEach((sep) => sep.toggleClass(HIDDEN_CLASS, query !== ''));
		this.select(query ? 0 : -1);
	};

	private select(index: number): void {
		const navigable = this.navigable();
		this.selected = Math.min(index, navigable.length - 1);
		for (const el of this.items()) el.removeClass('selected');
		const current = navigable[this.selected];
		current?.addClass('selected');
		current?.scrollIntoView({ block: 'nearest' });
	}

	/** Runs an item through the menu's own handler; a synthetic DOM click from a keydown handler is ignored. */
	private run(el: HTMLElement | undefined): void {
		const item = el && this.menu.items?.find((candidate) => candidate.dom === el);
		item?.handleEvent?.(new MouseEvent('click'));
	}

	private readonly onKeyDown = (evt: KeyboardEvent): void => {
		if (!this.dom.isConnected) return this.detach();
		if (this.dom.doc.activeElement !== this.input) return;

		if (evt.key === 'ArrowDown') this.select(this.selected + 1);
		else if (evt.key === 'ArrowUp') this.select(Math.max(this.selected - 1, 0));
		else if (evt.key === 'Enter') this.run(this.navigable()[this.selected]);
		else if (evt.key === 'Escape') this.menu.hide();
		else return;
		evt.preventDefault();
		evt.stopImmediatePropagation();
	};

	private readonly detach = (): void => {
		this.dom.win.removeEventListener('keydown', this.onKeyDown, true);
	};

	/** The extra row can push a menu opened near the bottom off screen. */
	private keepOnScreen(): void {
		const rect = this.dom.getBoundingClientRect();
		const maxBottom = this.dom.win.innerHeight - SCREEN_MARGIN;
		if (rect.bottom > maxBottom) {
			this.dom.setCssStyles({ top: `${Math.max(SCREEN_MARGIN, maxBottom - rect.height)}px` });
		}
	}
}
