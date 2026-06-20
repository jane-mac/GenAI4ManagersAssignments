
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

export function removeItem(items, name) {
  console.log(`[engine] removeItem: "${name}"`);
  return items.filter(
    (item) => item.name.toLowerCase() !== name.toLowerCase()
  );
}


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


export function getTotal(items) {
  const total = items.reduce((sum, item) => sum + item.value * item.quantity, 0);
  console.log(`[engine] getTotal: ${total} (across ${items.length} items)`);
  return total;
}


export function getItemCount(items) {
  const count = items.reduce((sum, item) => sum + item.quantity, 0);
  console.log(`[engine] getItemCount: ${count}`);
  return count;
}


export function findItem(items, name) {
  const result = items.find((item) => item.name.toLowerCase() === name.toLowerCase()) || null;
  console.log(`[engine] findItem: "${name}" →`, result ? `found (value=${result.value})` : 'not found');
  return result;
}
