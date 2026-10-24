// A model owns storage. This teaching model is in memory, not the real CPMS DB.
export function createApplicationModel() {
  const records = new Map();
  let nextId = 1;
  return {
    list: () => [...records.values()],
    find: (id) => records.get(id),
    create(data) { const row = { id: nextId++, ...data }; records.set(row.id, row); return row; },
    update(id, data) { const row = { id, ...data }; records.set(id, row); return row; },
    remove: (id) => records.delete(id),
  };
}
