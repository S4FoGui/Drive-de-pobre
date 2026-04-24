const express = require('express');
const app = express();
app.get('/test', (req, res) => res.json({msg: 'ok'}));
app.listen(3002);
