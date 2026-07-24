const { sequelize } = require('../config/database');

(async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Connected to database');

    // Table: custom_study_plan_sabbaticals
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

    // Column: subjects.weekly_hours
    const [colResult] = await sequelize.query(`
      SELECT column_name FROM information_schema.columns WHERE table_name = 'subjects' AND column_name = 'weekly_hours'
    `);
    if (colResult.length === 0) {
      await sequelize.query(`ALTER TABLE subjects ADD COLUMN weekly_hours INTEGER DEFAULT 4`);
      console.log('✅ Column subjects.weekly_hours added');
    } else {
      console.log('⏭️  Column subjects.weekly_hours already exists');
    }

    // Column: plan_subjects.is_final_project
    const [colResult2] = await sequelize.query(`
      SELECT column_name FROM information_schema.columns WHERE table_name = 'plan_subjects' AND column_name = 'is_final_project'
    `);
    if (colResult2.length === 0) {
      await sequelize.query(`ALTER TABLE plan_subjects ADD COLUMN is_final_project BOOLEAN NOT NULL DEFAULT false`);
      console.log('✅ Column plan_subjects.is_final_project added');
    } else {
      console.log('⏭️  Column plan_subjects.is_final_project already exists');
    }

    // Fix null weekly_hours in subjects (so future sync doesn't fail)
    const [updateResult] = await sequelize.query(`UPDATE subjects SET weekly_hours = 4 WHERE weekly_hours IS NULL`);
    console.log(`✅ Updated ${updateResult.rowCount || updateResult[1]?.rowCount || 0} subjects with null weekly_hours`);

    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
})();
