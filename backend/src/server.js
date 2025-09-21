const http = require('http');
const app = require('./app');
const connectDB = require('./config/database');
const { port } = require('./config');

const server = http.createServer(app);

connectDB().then(() => {
  server.listen(port, () => {
    console.log(`Server running on port ${port}`);
  });
});