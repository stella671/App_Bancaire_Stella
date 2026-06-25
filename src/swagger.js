import swaggerJsdoc from 'swagger-jsdoc';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Banking App Stella - API',
      version: '1.0.0',
      description: 'API REST pour le système de transactions bancaires multi-banques',
    },
    servers: [
      { url: 'http://localhost:8081', description: 'Développement' },
    ],
  },
  apis: ['./src/routes/*.js'],
};

export default swaggerJsdoc(options);
