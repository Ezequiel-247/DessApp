const { sequelize } = require('../src/config/database');

(async () => {
  try {
    await sequelize.authenticate();
    console.log('Connected to DB');

    // Check if column 'adress' exists
    const [result] = await sequelize.query(
      `SELECT column_name FROM information_schema.columns WHERE table_name='institutes' AND column_name='adress'`
    );
    if (result.length > 0) {
      await sequelize.query(`ALTER TABLE institutes RENAME COLUMN adress TO address;`);
      console.log('Column renamed: adress -> address');
    } else {
      console.log('Column adress does not exist — already renamed or never had typo');
    }

    await sequelize.close();
    console.log('Done');
    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
})();
