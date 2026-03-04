/**
 * Adds an item to the catalog.
 * If an item with the same name already exists (case-insensitive),
 * its quantity is increased rather than creating a duplicate.
 *
 * Optional waist and length fields are included in the item object only when
 * provided, so callers that omit them get a plain { name, value, quantity }
 * object and all existing tests continue to pass.
 */
export function addItem(items, name, value, quantity = 1, waist = null, length = null) {
  const exists = items.some(
    (item) => item.name.toLowerCase() === name.toLowerCase()
  );

  if (exists) {
    return items.map((item) =>
      item.name.toLowerCase() === name.toLowerCase()
        ? { ...item, quantity: item.quantity + quantity }
        : item
    );
  }

  const newItem = { name, value, quantity };
  if (waist  !== null) newItem.waist  = waist;
  if (length !== null) newItem.length = length;
  return [...items, newItem];
}

/**
 * Removes an item from the catalog by name (case-insensitive).
 * If the item is not found, returns the array unchanged.
 */
export function removeItem(items, name) {
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
  return items.reduce((sum, item) => sum + item.value * item.quantity, 0);
}

/**
 * Returns the total number of individual items (sum of all quantities).
 */
export function getItemCount(items) {
  return items.reduce((sum, item) => sum + item.quantity, 0);
}

/**
 * Finds an item by name (case-insensitive).
 * Returns the item object if found, or null if not found.
 */
export function findItem(items, name) {
  return (
    items.find((item) => item.name.toLowerCase() === name.toLowerCase()) || null
  );
}
