const http = require("http")
const { Command } = require ("commander");
const express = require('express');
const fs = require('fs');
const path = require('path');
const multer = require('multer'); 
const upload = multer();  
const swaggerUi = require('swagger-ui-express');
const swaggerJSDoc = require('swagger-jsdoc');

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


/**
 * @swagger
 * /UploadForm.html:
 *   get:
 *     summary: Return the HTML form for uploading a note
 *     responses:
 *       200:
 *         description: HTML form returned
 *       404:
 *         description: Form not found
 */
app.get('/UploadForm.html', (req, res) => {
    const filePath = path.join(__dirname, 'UploadForm.html');
    if (!fs.existsSync(filePath)) return res.sendStatus(404);
    
    res.sendFile(filePath);
});



/**
 * @swagger
 * /write:
 *   post:
 *     summary: Create a new note
 *     requestBody:
 *       required: true
 *       content:
 *         application/x-www-form-urlencoded:
 *           schema:
 *             type: object
 *             properties:
 *               note_name:
 *                 type: string
 *               note:
 *                 type: string
 *     responses:
 *       201:
 *         description: Note created
 *       400:
 *         description: Missing fields or note already exists
 */
// POST /write
app.post("/write", upload.none(), (req, res) => {
const name = req.body.note_name?.trim();
const text = req.body.note?.trim();
if (!name || !text) return res.status(400).send("Missing note_name or note");

if (notes[name]) {
    return res.status(400).send("Note already exists");
}

notes[name] = text;
saveNotes();
res.sendStatus(201);
res.redirect('/UploadForm.html')
});


/**
 * @swagger
 * /notes/{name}:
 *   get:
 *     summary: Get a specific note by name
 *     parameters:
 *       - in: path
 *         name: name
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Note found
 *         content:
 *           text/plain:
 *             schema:
 *               type: string
 *       404:
 *         description: Note not found
 */
  // GET /notes/<ім’я>
app.get("/notes/:name", (req, res) => {
    const name = req.params.name;
    if (!notes[name]) return res.sendStatus(404);
    res.send(notes[name]);
  });


/**
 * @swagger
 * /notes:
 *   get:
 *     summary: Get all notes
 *     responses:
 *       200:
 *         description: List of notes
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   name:
 *                     type: string
 *                   text:
 *                     type: string
 */
  // GET /notes (всі нотатки)
app.get("/notes", (req, res) => {
const noteList = Object.entries(notes).map(([name, text]) => ({
    name,
    text
}));
res.status(200).json(noteList);
});

/**
 * @swagger
 * /notes/{name}:
 *   put:
 *     summary: Update an existing note
 *     parameters:
 *       - in: path
 *         name: name
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         text/plain:
 *           schema:
 *             type: string
 *     responses:
 *       200:
 *         description: Note updated
 *       400:
 *         description: Missing text
 *       404:
 *         description: Note not found
 */
  // PUT /notes/<ім’я>
app.put("/notes/:name", (req, res) => {
const name = req.params.name;
const newText = req.body.text?.trim();

if (!notes[name]) return res.sendStatus(404);
if (!newText) return res.status(400).send("Missing text");

notes[name] = newText;
saveNotes();
res.sendStatus(200);
});


/**
 * @swagger
 * /notes/{name}:
 *   delete:
 *     summary: Delete a note by name
 *     parameters:
 *       - in: path
 *         name: name
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Note deleted
 *       404:
 *         description: Note not found
 */
// DELETE /notes/<ім’я>
app.delete("/notes/:name", (req,res) =>{
const name = req.params.name;
if (!notes[name]) return res.sendStatus(404);

delete notes[name];
saveNotes();
res.sendStatus(200);
});


const swaggerDefinition = {
openapi: '3.0.0',
info: {
    title: 'Notes API',
    version: '1.0.0',
    description: 'API для роботи з нотатками',
},
servers: [
    {
    url: `http://${options.host}:${options.port}`,
    },
],
};

const optionsSwagger = {
swaggerDefinition,
apis: [__filename], 
};

const swaggerSpec = swaggerJSDoc(optionsSwagger);
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));



app.listen(options.port, options.host, () => {
    console.log(`Server running at http://${options.host}:${options.port}/`);
})

