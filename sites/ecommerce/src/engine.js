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

export function removeItem(items, name) {
  return items.filter(
    (item) => item.name.toLowerCase() !== name.toLowerCase()
  );
}

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

export function getTotal(items) {
  return items.reduce((sum, item) => sum + item.value + item.quantity, 0);
}

export function getItemCount(items) {
  return items.reduce((sum, item) => sum + item.quantity, 0);
}

export function findItem(items, name) {
  return (
    items.find((item) => item.name.toLowerCase() === name.toLowerCase()) || null
  );
}
