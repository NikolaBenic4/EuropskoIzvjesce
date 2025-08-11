const express = require('express');
const { createNesreca } = require('../nesreca');
const nesrecaRoutes = require('./routes/nesreca');
const router = express.Router;
const server = express();
const PORT = 3001;
const { Pool } = require('pg');

const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'Diplomski rad',
    password: 'diplomski',
    port: 5432,
});

server.use('/nesreca', nesrecaRoutes);

module.exports = pool;
module.exports = router;

server.use(express.json());

//Unos podataka u tablicu nesreca
router.post('/', async (req, res) => {
    try{
        //Prikupljanje podataka iz body-a
        const nesrecaData = req.body;

        //Pozivanje funkcije za kreiranje
        const newNesreca = await createNesreca(nesrecaData);

        //Slanje pozitivnog odgovora
        res.status(201).josn({
            success: true,
            data: newNesreca
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
})

server.get('/', (req, res) => {
    res.json({ message: 'API za izvješćivanje o prometnim nesrećama'});
});


server.listen(PORT, () => {
    console.log(`Server je pokrenut na http://localhost:${PORT}`);
});