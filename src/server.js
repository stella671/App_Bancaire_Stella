import 'dotenv/config';
import app from './app.js';
import { migrate } from '../db/migrate.mjs';

const PORT = process.env.PORT || 8081;

migrate().then(() => {
  app.listen(PORT, () => {
    console.log(`Serveur démarré sur http://localhost:${PORT}`);
    console.log(`Swagger: http://localhost:${PORT}/api-docs`);
  });
});
