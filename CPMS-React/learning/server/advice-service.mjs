import express from 'express';

// An independent service with its own process and HTTP contract.
// It returns preparation advice; it does not send email or access student data.
const app = express();
app.get('/advice', (req, res) => res.json({ topic: 'Placement preparation', nextStep: 'Practice one SQL query and one interview question today.' }));
const server = app.listen(5011, '127.0.0.1', () => console.log('Placement advice service: http://127.0.0.1:5011/advice'));
server.on('error', (error) => { console.error(error.message); process.exitCode = 1; });
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => server.close());
