const http = require("http")
const { Command } = require ("commander");
const express = require('express');
const fs = require('fs');
const path = require('path');
const multer = require('multer'); 
const upload = multer();  

const program = new Command();

program
    .requiredOption("-h, --host <host>", "Server host")
    .requiredOption("-p, --port <port>", "Server port", parseInt)
    .requiredOption("-c, --cache <cache>", "Server cache");

program.parse(process.argv);
const options = program.opts();

const app = express();
app.use(express.text()); // для PUT
app.use(express.json()); // для JSON

let notes = {};
const cachePath = options.cache;

function loadNotes() {
    if (fs.existsSync(cachePath)) {
    const data = fs.readFileSync(cachePath, 'utf-8');
    notes = JSON.parse(data);
    }
}

function saveNotes() {
    fs.writeFileSync(cachePath, JSON.stringify(notes, null, 2));
}

loadNotes();



app.get('/UploadForm.html', (req, res) => {
    const filePath = path.join(__dirname, 'UploadForm.html');
    if (!fs.existsSync(filePath)) return res.sendStatus(404);
    
    res.sendFile(filePath);
});


app.post("/write", upload.none(), (req, res) => {
    const name = req.body.note_name?.trim();
    const text = req.body.note?.trim();
    if (!name || !text) return res.status(400).send("Missing note_name or note");

    if (notes[name]) {
     return res.status(400).send("Note already exists");
    }

    notes[name] = text;
    saveNotes();
    // res.sendStatus(201);
    res.redirect('/UploadForm.html')
  });



app.listen(options.port, options.host, () => {
    console.log(`Server running at http://${options.host}:${options.port}/`);
})

