const https = require('https');
const fs = require('fs');
const path = require('path');

const outputDir = path.join(__dirname, '..', 'public', 'sounds');
const outputFile = path.join(outputDir, 'notification.mp3');

// URL to a free notification sound from notificationsounds.com
const soundUrl = 'https://notificationsounds.com/storage/sounds/file-sounds-1150-pristine.mp3';

// Create the sounds directory if it doesn't exist
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Download the sound file
https.get(soundUrl, (response) => {
  if (response.statusCode !== 200) {
    console.error(`Failed to download sound file: ${response.statusCode}`);
    return;
  }

  const file = fs.createWriteStream(outputFile);
  response.pipe(file);

  file.on('finish', () => {
    file.close();
    console.log('Notification sound downloaded successfully');
  });
}).on('error', (err) => {
  console.error('Error downloading notification sound:', err.message);
  fs.unlink(outputFile, () => {}); // Clean up failed download
});
