const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();

// This function acts as a bridge between your Domain and your Storage Bucket
exports.serveImage = functions.https.onRequest(async (req, res) => {
  // 1. Get the filename from the URL (e.g., /SKU123.jpg -> SKU123.jpg)
  // We handle cases where the URL might have a leading slash
  const path = req.path.startsWith('/') ? req.path.substring(1) : req.path;
  
  // 2. Define your bucket
  // Ensure this matches your actual bucket name
  const bucketName = 'image-database-37308.firebasestorage.app'; 
  const bucket = admin.storage().bucket(bucketName);
  const file = bucket.file(path);

  try {
    // 3. Check if file exists
    const [exists] = await file.exists();
    if (!exists) {
      res.status(404).send('Image not found');
      return;
    }

    // 4. FIX: Fetch Metadata to set the correct Content-Type header
    // This tells the browser "This is a JPEG" instead of "This is text"
    const [metadata] = await file.getMetadata();
    const contentType = metadata.contentType || 'image/jpeg'; // Fallback to jpeg if missing

    res.set('Content-Type', contentType);
    
    // Cache the image in the browser for 1 year for speed
    // public = can be cached by CDNs, max-age = seconds in 1 year
    res.set('Cache-Control', 'public, max-age=31536000, s-maxage=31536000');
    
    // 5. Stream the file directly to the response
    const readStream = file.createReadStream();
    readStream.pipe(res);

  } catch (error) {
    console.error('Error serving image:', error);
    res.status(500).send('Internal Server Error');
  }
});
