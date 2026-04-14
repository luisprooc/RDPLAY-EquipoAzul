/**
 * Inyecta variables de `.env` en el bundle mediante DefinePlugin
 * para que `process.env.FIREBASE_*` en `environment*.ts` se resuelva en tiempo de compilación.
 */
const path = require('path');
const webpack = require('webpack');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const FIREBASE_KEYS = [
  'FIREBASE_API_KEY',
  'FIREBASE_AUTH_DOMAIN',
  'FIREBASE_PROJECT_ID',
  'FIREBASE_STORAGE_BUCKET',
  'FIREBASE_MESSAGING_SENDER_ID',
  'FIREBASE_APP_ID',
  'FIREBASE_MEASUREMENT_ID',
];

const defs = {};
for (const key of FIREBASE_KEYS) {
  defs[`process.env.${key}`] = JSON.stringify(process.env[key] ?? '');
}

module.exports = {
  plugins: [new webpack.DefinePlugin(defs)],
};
