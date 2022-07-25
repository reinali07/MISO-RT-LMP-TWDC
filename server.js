const express = require('express');
const path = require('path');
const cors_proxy = require('cors-anywhere');
const app = express();

// Listen on a specific host via the HOST environment variable
var host = process.env.HOST || '0.0.0.0';
// Listen on a specific port via the PORT environment variable
var port = process.env.PORT || 8080;



app.use(express.static(path.join(__dirname, 'public')))
app.set('views', path.join(__dirname, 'views'))
app.set('view engine', 'html')
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'views/index.html')));
app.listen(port, () => console.log(`Listening on ${ port }`));