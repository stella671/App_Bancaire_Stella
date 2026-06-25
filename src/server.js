import 'dotenv/config';
import app from './app.js';

const PORT = process.env.PORT || 8081;

app.listen(PORT, () => {
  console.log(`Serveur démarré sur http://localhost:${PORT}`);
  console.log(`Swagger: http://localhost:${PORT}/api-docs`);
});
