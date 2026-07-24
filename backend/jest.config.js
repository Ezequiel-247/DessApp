'use strict';

module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/tests/**/*.test.js'],
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
  testTimeout: 10000,
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/index.js',
    '!src/seeders/**',
    '!src/academicRecordService.js',
    '!src/courseService.js',
    '!src/middlewares/SubjectMiddleware.js',
  ],
  coverageReporters: ['text', 'lcov', 'html'],
};
