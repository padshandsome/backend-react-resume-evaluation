require('dotenv').config();

const express = require('express');


// const session = require('express-session');
// const redis = require('redis');
// const RedisStore = require('connect-redis').default;
// const redisClient = redis.createClient({
//   password: 'VoJddtV9mixKurvhEF715aKThfNEB0jZ',
//     socket: {
//         host: 'redis-17702.c282.east-us-mz.azure.cloud.redislabs.com',
//         port: 17702
//     }
// });
// redisClient.connect().catch(console.error);
// app.use(session({
//   store: new RedisStore({ client: redisClient }),
//   secret: 'VoJddtV9mixKurvhEF715aKThfNEB0jZ',
//   resave: false,
//   saveUninitialized: true,
//   cookie: {secure: false}
// }));

// console.log("Sucessfully connect to redis cloud");


const cors = require('cors');
const multer = require('multer');
const { BlobServiceClient, BlobSASPermissions, generateBlobSASQueryParameters, StorageSharedKeyCredential } = require('@azure/storage-blob');

const app = express();
app.use(cors());

const inMemoryStorage = multer.memoryStorage();
const uploadStrategy = multer({ storage: inMemoryStorage }).single('file');
const azureContainerName = 'pdfs';
const azureStorageConnectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;

async function generateSasUrl(containerName, blobName) {
  const blobServiceClient = BlobServiceClient.fromConnectionString(azureStorageConnectionString);
  const containerClient = blobServiceClient.getContainerClient(containerName);
  const blockBlobClient = containerClient.getBlockBlobClient(blobName);


  const sasPermissions = new BlobSASPermissions();
  sasPermissions.read = true; // Grant read access 

  // Assuming your azureStorageConnectionString includes the account name and key
  const sharedKeyCredential = new StorageSharedKeyCredential(blobServiceClient.accountName, blobServiceClient.credential.accountKey);

  const sasOptions = {
    containerName,
    blobName,
    permissions: sasPermissions.toString(),
    startsOn: new Date(),
    expiresOn: new Date(new Date().valueOf() + 3600 * 1000), // 1 hour from now 
  };

  const sasToken = generateBlobSASQueryParameters(sasOptions, sharedKeyCredential).toString();
  return `${blockBlobClient.url}?${sasToken}`;
}

app.post('/upload', uploadStrategy, async (req, res) => {
    if (!req.file) {
      return res.status(400).send('No file uploaded.');
    }
  
    try {
      const blobServiceClient = BlobServiceClient.fromConnectionString(azureStorageConnectionString);
      const containerClient = blobServiceClient.getContainerClient(azureContainerName);
      // const blobName = `${Date.now()}-${req.file.originalname}`;
      const blobName = 'current_session_pdf.pdf';
      const blockBlobClient = containerClient.getBlockBlobClient(blobName);

      // Specify blob HTTP headers 
      const options = {
        blobHTTPHeaders: {
          blobContentDisposition: 'inline; filename="current_session_pdf.pdf"',
          blobContentType: 'application/pdf'
        }
      };
      
      await blockBlobClient.upload(req.file.buffer, req.file.size, options);
  
      res.status(200).send("File uploaded to Azure Blob Storage.");

    } catch (error) {
      console.error(error);
      res.status(500).send(error.message);
    }
  });
  

  app.get('/get-pdf-url', async (req, res) => {
    const containerName = azureContainerName;
    const blobName = 'current_session_pdf.pdf';

    
    try {
      const url = await generateSasUrl(containerName, blobName);
      res.json({url});
    } catch (error) {
      console.error(error);
      res.status(500).send('Error generating SAS url');
  }}
  
  );

  module.exports = app;