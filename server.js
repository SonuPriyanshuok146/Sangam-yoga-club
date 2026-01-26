const http = require("http");
const fs = require("fs");
const path = require("path");

const PORT = 3000;

const server = http.createServer((req, res) => {
  // Handle default route
  let filePath = path.join(__dirname, req.url === "/" ? "index.html" : req.url);

  // Get file extension
  const extName = path.extname(filePath).toLowerCase();

  // MIME types
  const mimeTypes = {
    ".html": "text/html",
    ".css": "text/css",
    ".js": "application/javascript",
    ".json": "application/json",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".gif": "image/gif",
    ".svg": "image/svg+xml",
    ".ico": "image/x-icon",
  };

  const contentType = mimeTypes[extName] || "application/octet-stream";

  fs.readFile(filePath, (err, content) => {
    if (err) {
      if (err.code === "ENOENT") {
        // 404 Page
        res.writeHead(404, { "Content-Type": "text/html; charset=utf-8" });
        res.end("<h1>404 - File Not Found</h1>");
      } else {
        // Server error
        res.writeHead(500);
        res.end(`Server Error: ${err.code}`);
      }
    } else {
      // UTF-8 ONLY for text files
      if (
        contentType.startsWith("text") ||
        contentType === "application/javascript"
      ) {
        res.writeHead(200, {
          "Content-Type": `${contentType}; charset=utf-8`,
        });
        res.end(content, "utf-8");
      } else {
        // Binary files (images, icons)
        res.writeHead(200, { "Content-Type": contentType });
        res.end(content);
      }
    }
  });
});

server.listen(PORT, () => {
  console.log(`🧘 Yoga website running at http://localhost:${PORT}`);
});
