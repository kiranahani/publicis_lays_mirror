const express = require('express');
const axios = require('axios');
const Replicate = require('replicate');
const cloudinary = require('cloudinary').v2;
const fileUpload = require('express-fileupload');
const { Readable } = require('stream');
const fs = require('fs/promises');
const path = require('path');
const dotenv = require('dotenv');

/** Initialization */
dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

const apiToken = process.env.REPLICATE_API_TOKEN;
if (!apiToken) {
    console.error('API token is not set in the environment variables.');
    process.exit(1);
}

const replicate = new Replicate({ auth: apiToken });

app.use(fileUpload());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static('public'));

const allowedPacks = [
    'Prawn-Seafood',
    'MK',
    'Original-Rock',
    'Nori-Seaweed',
    'Hot-Chilli-Squid',
    'Sour-Cream',
    'Original',
    'Extra-BBQ',
];

/** Functions */

async function uploadToCloudinary(image, type = 'source') {
    const { upload_stream } = cloudinary.uploader

    return new Promise((resolve, reject) => {
        const stream = upload_stream(
            { folder: 'face-swap-app' }, 
            (error, result) => {
                if (error) {
                    return reject(`Failed to upload ${type} image`)
                }

                return resolve(result)
            }
        )
        Readable.from(image).pipe(stream)
    })
}

async function getImage(url) {
    const response = await axios.get(url, { responseType: 'arraybuffer' })
    return response.data
}



/** Route handler */

app.post('/upload', async (req, res) => {
    if (!req.files || Object.keys(req.files).length === 0) {
        return res.status(400).json({ error: 'No files were uploaded.' });
    }

    const { sourceImage } = req.files;
    const { gender } = req.body;

    try {
        const packDirectory = path.join(__dirname, 'public', 'img', gender);
        const files = await fs.readdir(packDirectory);

        const randomFile = files[Math.floor(Math.random() * files.length)];
        const targetImagePath = path.join(packDirectory, randomFile);

        const targetImage = await fs.readFile(targetImagePath);

        const [sourceCloudinary, targetCloudinary] = await Promise.all([
            uploadToCloudinary(sourceImage.data, 'source'),
            uploadToCloudinary(targetImage, 'target')
        ])

        const model = "yan-ops/face_swap:ad0fd4f8b7eb5654a6954ce36634665a8f5ff124065c71c3ac85a48c5d2e2d38"
        const input = {
            source_image: sourceCloudinary.secure_url,
            target_image: targetCloudinary.secure_url,
        }

        const output = await replicate.run(model, { input })
        if (output.status != 'succeed') {
            return res.status(500).json({ error: 'Failed to retrieve the image.' })
        }

        const imageUrl = output.image
        return res.send(await getImage(imageUrl))
    
    } catch (error) {
        console.error(error);
        res.status(500).json({ error : error })
    }
});

app.get('/fetch-and-print-image', async (req, res) => {
    try {
        const imageUrl = req.query.imageUrl;

        if (!imageUrl) {
            return res.status(400).json({ error: 'Image URL is required.' });
        }

        const imageBuffer = await getImageBufferFromUrl(imageUrl);

        if (!imageBuffer) {
            return res.status(500).json({ error: 'Failed to retrieve the result image.' });
        }

        res.setHeader('Content-Type', 'image/png');
        res.send(imageBuffer);
    } catch (error) {
        console.error('Error fetching and sending result image:', error);
        res.status(500).json({ error: 'Internal server error.' });
    }
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});

// Add this route to serve the pack image
app.get('/get-pack-image', async (req, res) => {
    try {
        const { packName } = req.query;

        // Validate the packName against allowed values
        if (!allowedPacks.includes(packName)) {
            return res.status(404).send('Pack not found');
        }

        // Construct the path to the pack image file for the specified pack
        const packImagePath = path.join(__dirname, 'public', 'img', 'pack', packName, 'Pack1.png');

        // Read the content of the pack image file
        const packImage = await fs.readFile(packImagePath);

        // Send the pack image as the response
        res.contentType('image/png').end(packImage, 'binary');
    } catch (error) {
        console.error('Error serving pack image:', error);
        res.status(500).send('Internal server error');
    }
});

// Keep your existing /pack/:packName route
app.get('/pack/:packName', async (req, res) => {
    try {
        const { packName } = req.params;

        // Validate the packName against allowed values
        if (!allowedPacks.includes(packName)) {
            return res.status(404).send('Pack not found');
        }

        // Construct the path to the index.html file for the specified pack
        const indexPath = path.join(__dirname, 'public', 'index.html');

        // Read the content of the index.html file
        let data = await fs.readFile(indexPath, 'utf8');

        // Replace a placeholder in the HTML with the actual packName
        data = data.replace('{{packName}}', packName);

        // Send the modified HTML as the response
        res.send(data);
    } catch (error) {
        console.error('Error processing pack:', error);
        res.status(500).send('Internal server error');
    }
});


async function getImageBufferFromUrl(imageUrl) {
    try {
        const response = await fetch(imageUrl);
        const arrayBuffer = await response.arrayBuffer();
        return Buffer.from(arrayBuffer);
    } catch (error) {
        console.error('Error fetching image from URL:', error);
        return null;
    }
}
