'use strict';
const { onRequest } = require('firebase-functions/v2/https');
const app = require('./server');

// Expose the entire Express app as a single HTTP Cloud Function.
// Declares XAI_API_KEY from Secret Manager so it is available as
// process.env.XAI_API_KEY inside server.js at runtime.
exports.api = onRequest(
    { secrets: ['XAI_API_KEY'], region: 'us-central1', cors: true },
    app
);
