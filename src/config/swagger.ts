import swaggerJsdoc from 'swagger-jsdoc';
import path from 'path';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Comic App API',
      version: '1.0.0',
      description: 'A REST API for a comic reading application, built with Node.js, Express, and Prisma.',
    },
    servers: [
      {
        url: process.env.API_URL || `http://localhost:${process.env.PORT || 3000}`,
        description: process.env.API_URL ? 'Production server' : 'Development server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: [
    path.join(__dirname, '../routes/*.ts'),
    path.join(__dirname, '../routes/*.js'),
  ], // Path to the API docs
};

export const swaggerSpec = swaggerJsdoc(options);
