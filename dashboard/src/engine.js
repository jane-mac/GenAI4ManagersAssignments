/**
 * Adds an item to the catalog.
 * If an item with the same name already exists (case-insensitive),
 * its quantity is increased rather than creating a duplicate.
 */
export function addItem(items, name, value, quantity = 1) {
  const exists = items.some(
    (item) => item.name.toLowerCase() === name.toLowerCase()
  );
  if (exists) {
    console.log(`[engine] addItem: "${name}" already exists — increasing quantity by ${quantity}`);
    return items.map((item) =>
      item.name.toLowerCase() === name.toLowerCase()
        ? { ...item, quantity: item.quantity + quantity }
        : item
    );
  }
  console.log(`[engine] addItem: adding "${name}" (value=${value}, quantity=${quantity})`);
  return [...items, { name, value, quantity }];
}

/**
 * Removes an item from the catalog by name (case-insensitive).
 * If the item is not found, returns the array unchanged.
 */
export function removeItem(items, name) {
  console.log(`[engine] removeItem: "${name}"`);
  return items.filter(
    (item) => item.name.toLowerCase() !== name.toLowerCase()
  );
}

/**
 * Updates the quantity of an existing item.
 * If quantity is 0 or less, the item is removed.
 * If the item is not found, returns the array unchanged.
 */
export function updateQuantity(items, name, quantity) {
  console.log(`[engine] updateQuantity: "${name}" → ${quantity}`);
  if (quantity <= 0) return removeItem(items, name);
  const exists = items.some(
    (item) => item.name.toLowerCase() === name.toLowerCase()
  );
  if (!exists) return items;
  return items.map((item) =>
    item.name.toLowerCase() === name.toLowerCase()
      ? { ...item, quantity }
      : item
  );
}

/**
 * Returns the total value of all items (value × quantity, summed).
 */
export function getTotal(items) {
  const total = items.reduce((sum, item) => sum + item.value * item.quantity, 0);
  console.log(`[engine] getTotal: ${total} (across ${items.length} items)`);
  return total;
}

/**
 * Returns the total number of individual items (sum of all quantities).
 */
export function getItemCount(items) {
  const count = items.reduce((sum, item) => sum + item.quantity, 0);
  console.log(`[engine] getItemCount: ${count}`);
  return count;
}

/**
 * Finds an item by name (case-insensitive).
 * Returns the item object if found, or null if not found.
 */
export function findItem(items, name) {
  const result = items.find((item) => item.name.toLowerCase() === name.toLowerCase()) || null;
  console.log(`[engine] findItem: "${name}" →`, result ? `found (value=${result.value})` : 'not found');
  return result;
}
