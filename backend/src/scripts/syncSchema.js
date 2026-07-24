const { sequelize } = require('../config/database');

(async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Connected to database');

    // Create missing table
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS custom_study_plan_sabbaticals (
        id              SERIAL PRIMARY KEY,
        id_custom_study_plan INTEGER NOT NULL REFERENCES custom_study_plans(id) ON DELETE CASCADE,
        year            INTEGER NOT NULL,
        term            INTEGER NOT NULL,
        created_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        updated_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        UNIQUE(id_custom_study_plan, year, term)
      );
    `);
    console.log('✅ Table custom_study_plan_sabbaticals ready');

    // Add missing column
    await sequelize.query(`
      ALTER TABLE plan_subjects ADD COLUMN IF NOT EXISTS is_final_project BOOLEAN NOT NULL DEFAULT false;
    `);
    console.log('✅ Column is_final_project added to plan_subjects');

    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
})();
