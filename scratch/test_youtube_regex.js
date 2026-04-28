
const youtubeRegex = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;

const testUrls = [
  "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
  "https://youtu.be/dQw4w9WgXcQ",
  "https://m.youtube.com/watch?v=dQw4w9WgXcQ",
  "https://www.youtube.com/embed/dQw4w9WgXcQ",
  "https://youtube.com/v/dQw4w9WgXcQ",
  "https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=10s",
  "http://youtube.com/watch?v=dQw4w9WgXcQ",
  "https://www.google.com",
  "https://vimeo.com/12345"
];

console.log("Testing YouTube Regex:");
testUrls.forEach(url => {
  const match = url.match(youtubeRegex);
  const isYoutube = !!(match && match[2].length === 11);
  console.log(`${url} => ${isYoutube ? '✅ YES' : '❌ NO'} (ID: ${match ? match[2] : 'N/A'})`);
});
