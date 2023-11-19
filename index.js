import express from 'express';
import { PORT, mongoDBURL } from './config.js';
import mongoose from 'mongoose';
import booksRoute from './routes/booksRoute.js';
import * as prometheus from 'prom-client';
import cors from 'cors';

const app = express();
const register = new prometheus.Registry();

// Initialize Prometheus metrics
prometheus.collectDefaultMetrics();

// Prometheus
const httpRequestDurationMicroseconds = new prometheus.Histogram({
    name: 'http_request_duration_seconds',
    help: 'Duration of HTTP requests in seconds',
    labelNames: ['method', 'route'],
    buckets: [0.1, 0.5, 1, 1.5, 2, 2.5, 3],
});


// Middleware for parsing request body
app.use(express.json());

// Middleware for handling CORS POLICY
// Option 1: Allow All Origins with Default of cors(*)
app.use(cors());
// Option 2: Allow Custom Origins
// app.use(
//   cors({
//     origin: 'http://localhost:3000',
//     methods: ['GET', 'POST', 'PUT', 'DELETE'],
//     allowedHeaders: ['Content-Type'],
//   })
// );

app.get('/', (request, response) => {
  console.log(request);
  return response.status(234).send('Welcome To MERN Stack Tutorial');
});

// Expose metrics endpoint
app.get('/metrics', (req,res) => {
  res.setHeader('Content-Type', register.contentType)
  register.metrics().then(data => res.send(data));
})

app.use('/books', booksRoute);

// Middleware to measure HTTP request duration
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
      const duration = Date.now() - start;
      httpRequestDurationMicroseconds
          .labels(req.method, req.route.path)
          .observe(duration / 1000);
  });
  next();
});

mongoose
  .connect(mongoDBURL)
  .then(() => {
    console.log('App connected to database');
    app.listen(PORT, () => {
      console.log(`App is listening to port: ${PORT}`);
    });
  })
  .catch((error) => {
    console.log(error);
  });
