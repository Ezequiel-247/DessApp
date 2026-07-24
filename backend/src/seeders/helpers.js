function buildWhere(row, uniqueKeys) {
  return uniqueKeys.reduce((where, key) => {
    where[key] = row[key];
    return where;
  }, {});
}

async function seedRows(Model, rows, uniqueKeys, transaction) {
  const instances = [];

  for (const row of rows) {
    const [instance] = await Model.findOrCreate({
      where: buildWhere(row, uniqueKeys),
      defaults: row,
      transaction,
    });

    instances.push(instance);
  }

  return instances;
}

module.exports = {
  seedRows,
};