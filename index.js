const http = require("http")
const { Command } = require ("commander");

const program = new Command();

program
    .requiredOption("-h, --host <host>", "Server host")
    .requiredOption("-p, --port <port>", "Server port", parseInt)
    .requiredOption("-c, --cache <cache>", "Server cache");

program.parse(process.argv);
const options = program.opts();

const server = http.createServer((req, res) => {
    res.writeHead(200, { "Content-Type": "text/plain" });
    res.end("Serveris running\n");
}) ;

server.listen(options.port, options.host, () => {
    console.log(`Server running at http://${options.host}:${options.port}/`);
})
