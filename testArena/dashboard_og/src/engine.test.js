import { describe, it, expect } from 'vitest';
import {
  addItem,
  removeItem,
  updateQuantity,
  getTotal,
  getItemCount,
  findItem,
} from './engine';

// ─── addItem ────────────────────────────────────────────────────────────────

describe('addItem', () => {
  it('adds a new item to an empty catalog', () => {
    const result = addItem([], 'Sword', 150, 1);
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({ name: 'Sword', value: 150, quantity: 1 });
  });

  it('adds a new item alongside existing items', () => {
    const items = [{ name: 'Sword', value: 150, quantity: 1 }];
    const result = addItem(items, 'Shield', 80, 2);
    expect(result).toHaveLength(2);
    expect(result[1]).toEqual({ name: 'Shield', value: 80, quantity: 2 });
  });

  it('increases quantity when adding an item that already exists', () => {
    const items = [{ name: 'Potion', value: 50, quantity: 3 }];
    const result = addItem(items, 'Potion', 50, 2);
    expect(result).toHaveLength(1);
    expect(result[0].quantity).toBe(5);
  });

  it('matches existing items case-insensitively', () => {
    const items = [{ name: 'Potion', value: 50, quantity: 1 }];
    const result = addItem(items, 'potion', 50, 1);
    expect(result).toHaveLength(1);
    expect(result[0].quantity).toBe(2);
  });

  it('defaults quantity to 1 if not provided', () => {
    const result = addItem([], 'Arrow', 5);
    expect(result[0].quantity).toBe(1);
  });

  it('does not mutate the original array', () => {
    const items = [{ name: 'Sword', value: 150, quantity: 1 }];
    addItem(items, 'Shield', 80, 1);
    expect(items).toHaveLength(1);
  });
});

// ─── removeItem ─────────────────────────────────────────────────────────────

describe('removeItem', () => {
  it('removes an item by name', () => {
    const items = [
      { name: 'Sword', value: 150, quantity: 1 },
      { name: 'Shield', value: 80, quantity: 1 },
    ];
    const result = removeItem(items, 'Sword');
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Shield');
  });

  it('returns the array unchanged if the item is not found', () => {
    const items = [{ name: 'Sword', value: 150, quantity: 1 }];
    const result = removeItem(items, 'Bow');
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Sword');
  });

  it('removes items case-insensitively', () => {
    const items = [{ name: 'Sword', value: 150, quantity: 1 }];
    const result = removeItem(items, 'sword');
    expect(result).toHaveLength(0);
  });

  it('does not mutate the original array', () => {
    const items = [{ name: 'Sword', value: 150, quantity: 1 }];
    removeItem(items, 'Sword');
    expect(items).toHaveLength(1);
  });
});

// ─── updateQuantity ──────────────────────────────────────────────────────────

describe('updateQuantity', () => {
  it('updates the quantity of an existing item', () => {
    const items = [{ name: 'Potion', value: 50, quantity: 3 }];
    const result = updateQuantity(items, 'Potion', 10);
    expect(result[0].quantity).toBe(10);
  });

  it('returns the array unchanged if the item is not found', () => {
    const items = [{ name: 'Potion', value: 50, quantity: 3 }];
    const result = updateQuantity(items, 'Bow', 5);
    expect(result).toEqual(items);
  });

  it('removes the item when quantity is set to 0', () => {
    const items = [{ name: 'Potion', value: 50, quantity: 3 }];
    const result = updateQuantity(items, 'Potion', 0);
    expect(result).toHaveLength(0);
  });

  it('removes the item when quantity is negative', () => {
    const items = [{ name: 'Potion', value: 50, quantity: 3 }];
    const result = updateQuantity(items, 'Potion', -1);
    expect(result).toHaveLength(0);
  });

  it('does not mutate the original array', () => {
    const items = [{ name: 'Potion', value: 50, quantity: 3 }];
    updateQuantity(items, 'Potion', 10);
    expect(items[0].quantity).toBe(3);
  });
});

// ─── getTotal ────────────────────────────────────────────────────────────────

describe('getTotal', () => {
  it('returns 0 for an empty catalog', () => {
    expect(getTotal([])).toBe(0);
  });

  it('returns value × quantity for a single item', () => {
    const items = [{ name: 'Sword', value: 150, quantity: 2 }];
    expect(getTotal(items)).toBe(300);
  });

  it('sums value × quantity across all items', () => {
    const items = [
      { name: 'Sword', value: 150, quantity: 2 },
      { name: 'Potion', value: 50, quantity: 4 },
    ];
    expect(getTotal(items)).toBe(500);
  });
});

// ─── getItemCount ────────────────────────────────────────────────────────────

describe('getItemCount', () => {
  it('returns 0 for an empty catalog', () => {
    expect(getItemCount([])).toBe(0);
  });

  it('returns the sum of all quantities', () => {
    const items = [
      { name: 'Sword', value: 150, quantity: 2 },
      { name: 'Potion', value: 50, quantity: 4 },
    ];
    expect(getItemCount(items)).toBe(6);
  });
});

// ─── findItem ────────────────────────────────────────────────────────────────

describe('findItem', () => {
  it('finds an item by name', () => {
    const items = [{ name: 'Sword', value: 150, quantity: 1 }];
    const result = findItem(items, 'Sword');
    expect(result).toEqual({ name: 'Sword', value: 150, quantity: 1 });
  });

  it('finds an item case-insensitively', () => {
    const items = [{ name: 'Sword', value: 150, quantity: 1 }];
    const result = findItem(items, 'sword');
    expect(result.name).toBe('Sword');
  });

  it('returns null when the item is not found', () => {
    const items = [{ name: 'Sword', value: 150, quantity: 1 }];
    const result = findItem(items, 'Bow');
    expect(result).toBeNull();
  });
});
