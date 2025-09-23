// Integra s vanjskim servisom za 3D generiranje
const axios = require('axios');

const generate3DModel = async (req, res) => {
  try {
    const { images } = req.body;
    
    if (!images || images.length < 3) {
      return res.status(400).json({ 
        error: 'Potrebno je minimum 3 slike za 3D model' 
      });
    }

    // Pozovi vanjski servis za 3D generiranje (primjer)
    const response = await axios.post('https://api.3d-service.com/generate', {
      images: images,
      format: 'obj',
      quality: 'medium'
    }, {
      headers: {
        'Authorization': `Bearer ${process.env.API_3D_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    const modelUrl = response.data.modelUrl;
    
    res.json({ modelUrl });
  } catch (error) {
    console.error('Greška pri generiranju 3D modela:', error);
    res.status(500).json({ error: 'Greška pri generiranju 3D modela' });
  }
};

module.exports = { generate3DModel };