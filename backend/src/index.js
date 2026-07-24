require('dotenv').config();
require('./models');
const express = require('express');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const swaggerUi = require('swagger-ui-express');
const { sequelize } = require('./config/database');
const { getOpenApiSpec } = require('./docs');

let runSeeders;
try {
  // Intentamos cargar los seeders. 
  // Ajustado a la ruta real src/seeders/seedDatabase.js
  const seedersModule = require('./seeders/seedDatabase');
  runSeeders = seedersModule.seedDatabase;
} catch (error) {
  console.warn('⚠️  No se pudieron cargar los seeders:', error.message);
  runSeeders = null;
}

// Importación de Rutas
const authRoutes = require('./routes/authRoutes');
const careerRoutes = require('./routes/careerRoutes');
const instituteRoutes = require('./routes/instituteRoutes');
const academicRecordRoutes = require('./routes/academicRecordRoutes');
const subjectRoutes = require('./routes/subjectRoutes');
const studyPlanRoutes = require('./routes/studyPlanRoutes');

const planSubjectRoutes = require('./routes/planSubjectRoutes');
const adminRoutes = require('./routes/adminRoutes');
const customStudyPlanRoutes = require('./routes/customStudyPlanRoutes');
const customStudyPlanSabbaticalRoutes = require('./routes/customStudyPlanSabbaticalRoutes');
const customStudyPlanElectiveChoiceRoutes = require('./routes/customStudyPlanElectiveChoiceRoutes');
const customStudyPlanUnahurChoiceRoutes = require('./routes/customStudyPlanUnahurChoiceRoutes');
const instanceSubjectRoutes = require('./routes/instanceSubjectRoutes');
const connectionRoutes = require('./routes/connectionRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const sessionRoutes = require('./routes/sessionRoutes');
const reportRoutes = require('./routes/reportRoutes');
const reportReasonRoutes = require('./routes/reportReasonRoutes');
const postRoutes = require('./routes/postRoutes');
const commentRoutes = require('./routes/commentRoutes');
const studentRoutes = require('./routes/studentRoutes');
const finalExamRoutes = require('./routes/finalExamRoutes');
const correlativityRoutes = require('./routes/correlativityRoutes');
const systemConfigRoutes = require('./routes/systemConfigRoutes');
const materialRoutes = require('./routes/materialRoutes');
const voteRoutes = require('./routes/voteRoutes');
const userRoutes = require('./routes/userRoutes');
const noveltyRoutes = require('./routes/noveltyRoutes');
const studySessionRoutes = require('./routes/studySessionRoutes');
const uploadRoutes = require('./routes/uploadRoutes');
const planUnahurBlockRoutes = require('./routes/planUnahurBlockRoutes');
const planElectiveBlockRoutes = require('./routes/planElectiveBlockRoutes');
const planCreditBlockRoutes = require('./routes/planCreditBlockRoutes');
const activityRoutes = require('./routes/activityRoutes');
const activityRecordRoutes = require('./routes/activityRecordRoutes');
const planCreditBlockItemRoutes = require('./routes/planCreditBlockItemRoutes');

const app = express();

// Middleware
app.use(helmet({
  // Needed so frontend (localhost:3000) can render avatars served by backend (localhost:3001).
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));
// En producción restringimos a FRONTEND_URL (puede ser una lista separada por comas).
// En desarrollo dejamos abierto para no trabar el trabajo local con distintos puertos.
const corsOrigin =
  process.env.NODE_ENV === 'production' && process.env.FRONTEND_URL
    ? process.env.FRONTEND_URL.split(',').map((origin) => origin.trim())
    : true;

app.use(cors({ origin: corsOrigin }));
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Test route
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running' });
});

// API docs
app.get('/api/openapi.json', (req, res) => {
  res.status(200).json(getOpenApiSpec());
});

app.use(
  '/api/docs',
  swaggerUi.serve,
  swaggerUi.setup(null, {
    swaggerOptions: {
      url: '/api/openapi.json',
    },
  })
);

// Registro de Rutas
app.use('/api/auth', authRoutes);
app.use('/api/careers', careerRoutes);
app.use('/api/institutes', instituteRoutes);
app.use('/api/academic-records', academicRecordRoutes);
app.use('/api/subjects', subjectRoutes);
app.use('/api/plans', studyPlanRoutes);

app.use('/api/plan-subjects', planSubjectRoutes);
app.use('/api/material', materialRoutes);
app.use('/api/votes', voteRoutes);
app.use('/api/admins', adminRoutes);
app.use('/api/custom-study-plans', customStudyPlanRoutes);
app.use('/api/custom-study-plans/:planId/sabbaticals', customStudyPlanSabbaticalRoutes);
app.use('/api/custom-study-plans/:planId/elective-choices', customStudyPlanElectiveChoiceRoutes);
app.use('/api/custom-study-plans/:planId/unahur-choices', customStudyPlanUnahurChoiceRoutes);
app.use('/api/instance-subjects', instanceSubjectRoutes);
app.use('/api/connections', connectionRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/report-reasons', reportReasonRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/final-exams', finalExamRoutes);
app.use('/api/correlativities', correlativityRoutes);
app.use('/api/system-config', systemConfigRoutes);
app.use('/api/users', userRoutes);
app.use('/api/novelties', noveltyRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/study-sessions', studySessionRoutes);
app.use('/api/plans/:planId/unahur-blocks', planUnahurBlockRoutes);
app.use('/api/plans/:planId/elective-blocks', planElectiveBlockRoutes);
app.use('/api/plans/:planId/credit-blocks', planCreditBlockRoutes);
app.use('/api/activities', activityRoutes);
app.use('/api/activity-records', activityRecordRoutes);
app.use('/api/plan-credit-block-items', planCreditBlockItemRoutes);

// Database connection and server start
const PORT = process.env.PORT || 3001;
const schedulerService = require('./services/schedulerService');

async function startServer() {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connection has been established successfully.');

    // Sincronizacion opcional para evitar fallos por ALTER en cada arranque.
    const shouldSync = process.env.DB_SYNC === 'true';
    const forceSync = process.env.DB_FORCE === 'true';
    const alterSync = process.env.DB_ALTER === 'true';

    if (shouldSync) {
      try {
        await sequelize.sync({ force: forceSync, alter: alterSync && !forceSync });
        console.log(`✅ Database models synchronized (force: ${forceSync}, alter: ${alterSync && !forceSync}).`);
      } catch (syncError) {
        console.warn('⚠️  Database models sync failed:', syncError.message);
        console.log('💡 Continuing without schema sync. Use DB_SYNC=true only when needed.');
      }
    }

    // Start background scheduler
    schedulerService.start();

    // Solo ejecutamos si se cargaron correctamente y no estamos en producción
    if (process.env.NODE_ENV !== 'production' && typeof runSeeders === 'function') {
      console.log('🌱 Running seeders...');
      // Pasamos closeConnection: false para no cerrar la conexión del servidor
      await runSeeders({ closeConnection: false });
      console.log('🌱 Seeders executed successfully.');
    }
  } catch (error) {
    console.warn('⚠️  Database connection failed:', error.message);
    console.log('💡 Server will start anyway. Configure .env to connect to PostgreSQL.');
  }

  app.listen(PORT, () => {
    console.log(`✅ Server is running on port ${PORT}`);
    console.log(`📍 Health check: http://localhost:${PORT}/api/health`);
  });
}

startServer();

module.exports = app;
