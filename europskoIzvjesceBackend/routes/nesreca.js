const pool = require('./Server.js');

// Definiramo koje stupce želimo unijeti
async function createNesreca(nesrecaData) {
    try {
    const columns = [
        'datum_nesrece',
        'vrijeme_nesrece',
        'mjesto_nesrece',
        'geolokacija_nesrece',
        'ozlijedeneosobe',
        'stetanavozilima',
        'stetanastvarima'
    ];

    //Extract vrijednosti iz inputa
    const values = columns.map(col => nesrecaData[col] || null);
    //Kreiranje rezervnih mjesta za SQL upit
    const placeholders = columns.map((_, index) => `$${index + 1}`).join(', ');

    //Kreiranje upita
    const insertQuery = `
    INSERT INTO nesreca(${columns.join(', ')})
    VALUES(${placeholders})
    RETURNING *
    `;

    //Izvršavanje upita
    const result = await pool.query(insertQuery, values);

    //Return novih vrijednosti
    return result.rows[0];

} catch (error) {
    console.error('Greška u kreiranju nesreca:', error);
    throw error;
}
}

module.exports = { createNesreca };