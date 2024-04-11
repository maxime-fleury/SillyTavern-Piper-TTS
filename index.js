async function init() {
    const express = require('express');
    const cors = require('cors');
    const bodyParser = require('body-parser');
    const { exec } = require('child_process');
    const { v4: uuidv4 } = require('uuid');
    const multer = require('multer');
    const upload = multer();
    const fs = require('fs');
    const path = require('path');
    const os = require('os');


    const app = express();
    const PORT = 8001;

    // Middleware
    app.use(cors());
    app.use(bodyParser.json());

    // This assumes you have a 'models' directory relative to where the server is run
    const MODEL_PATH = path.join(__dirname, 'models', 'en_US-libritts_r-medium.onnx');
    const OUTPUT_DIR = path.join(__dirname, 'out');

    // Check the OS and adjust the Piper command
    function getPiperCommand(text, voiceId, outputFile) {
        const platform = os.platform();
        const currentPath = __dirname;
        let piperExecutable = currentPath + '\\piper.exe'; // Default to Windows executable
        let echoCommand = 'echo';
    
        if (platform === 'linux') {
            piperExecutable ='piper'; // Use shell script for Linux
            echoCommand = 'echo -e'; // Use -e to enable interpretation of backslash escapes on Linux
        } else if (platform === 'win32') {
            piperExecutable = currentPath + '\\piper.exe'; // Use executable for Windows
        } else if (platform === 'darwin') {
            piperExecutable ='piper'; // Use shell script for MacOS
        }
    
        return `${echoCommand} '${text}' | ${piperExecutable} -m ${MODEL_PATH} -s ${voiceId} -f ${outputFile}`;
    }
    if (!fs.existsSync(OUTPUT_DIR)){
        fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    }

    class TtsService {
        constructor() {
            this.langs = { 'en': 'English', 'de': 'German' };  // Example languages
            this.sessionPath = '';
        }

        initSessionsPath(path) {
            this.sessionPath = path;
            // Additional code to handle session path initialization
        }

        getLanguages() {
            return Object.keys(this.langs);
        }

        loadModel(langId) {
            // Code to load and set the model for the given language ID
        }
    }

    const ttsService = new TtsService();

    // Initialize session path
    app.post('/tts/session', (req, res) => {
        try {
            ttsService.initSessionsPath(req.body.path);
            res.send(`Session path created at ${req.body.path}`);
        } catch (error) {
            res.status(500).send(`Error initializing session path: ${error.message}`);
        }
    });

    // Get supported languages
    app.get('/tts/language', (req, res) => {
        try {
            const languages = ttsService.getLanguages();
            res.json(languages);
        } catch (error) {
            res.status(500).send(`Error fetching languages: ${error.message}`);
        }
    });

    // Set the language for TTS
    app.post('/tts/language', (req, res) => {
        try {
            ttsService.loadModel(req.body.id);
            res.sendStatus(200);
        } catch (error) {
            res.status(500).send(`Error setting language: ${error.message}`);
        }
    });

    app.get('/tts/speakers', (req, res) => {
        const baseURL = `${req.protocol}://${req.get('host')}`;
        const voices = [
            { name: "Emily", voice_id: "372", preview_url: `${baseURL}/samples/372.wav` },
            { name: "Julie", voice_id: "115", preview_url: `${baseURL}/samples/115.wav` },
            { name: "Manon", voice_id: "450", preview_url: `${baseURL}/samples/450.wav` },
            { name: "Lucy", voice_id: "545", preview_url: `${baseURL}/samples/545.wav` },
            { name: "John", voice_id: "581", preview_url: `${baseURL}/samples/581.wav` },
            { name: "Richard", voice_id: "572", preview_url: `${baseURL}/samples/572.wav` },

        ];
        console.log("/tts/speakers", JSON.stringify(voices));
        res.json(voices);
    });
    app.use('/samples', express.static(__dirname + `/samples/`));
    // Setup static directory and generate samples if they don't exist
    checkAndGenerateSamples();

    function checkAndGenerateSamples() {
        const samplesDir = path.join(__dirname, 'samples');
        if (!fs.existsSync(samplesDir)) {
            fs.mkdirSync(samplesDir);
        }
        const samples = [
            { name: "Emily", voice_id: "372", text: "Hello, my name is Emily", output: "372.wav" },
            { name: "Julie", voice_id: "115", text: "Hello, my name is Julie", output: "115.wav" },
            { name: "Manon", voice_id: "450", text: "Hello, my name is Manon", output: "450.wav" },
            { name: "Lucy", voice_id: "545", text: "Hello, my name is Lucy", output: "545.wav" },
            { name: "John", voice_id: "581", text: "Hello, my name is John", output: "581.wav" },
            { name: "Richard", voice_id: "572", text: "Hello, my name is Richard", output: "572.wav" },
            { name: "Peter", voice_id: "541", text: "Hello, my name is Peter", output: "541.wav"}
        ];
        samples.forEach(sample => {
            const outputFile = path.join(samplesDir, sample.output);
            if (!fs.existsSync(outputFile)) {
                const cmd = getPiperCommand(sample.text, sample.voice_id, outputFile);
                exec(cmd, (error, stdout, stderr) => {
                    if (error) {
                        console.error(`exec error: ${error}`);
                    }
                });
                console.log(`Generated sample: ${sample.output}`);
            }
            console.log(`Sample exists: ${sample.output}`);
        });
    }

    app.post('/tts/generate', upload.none(), (req, res) => {
        let text = req.body.text.replace('*', ''); // Clean elipses or special characters
        //remove from text ' and " and \ and / and ` and ; 
        text = text.replace(/['"\\\/`;]/g, '');
        console.log(`Generating audio for: ${text}`)
        const voice = parseInt(req.body.voice, 1000) || 115;
        const outputFile = path.join(OUTPUT_DIR, `output-${uuidv4()}.wav`);
        let cmd = getPiperCommand(text, voice, outputFile);

        console.log(`Generating audio: ${cmd}`);
        
        exec(cmd, (error, stdout, stderr) => {
            if (error) {
                console.error(`exec error: ${error}`);
                return res.status(500).send(`Error generating audio: ${error.message}`);
            }
            res.sendFile(outputFile, {}, (err) => {
                fs.unlink(outputFile, (unlinkErr) => {
                    if (unlinkErr) console.log(`Error removing file: ${unlinkErr}`);
                });
            });
        });
    });

    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
    return Promise.resolve();
};
async function exit() {
    return Promise.resolve();
}

module.exports = {
    init,
    exit,
    info: {
        id: 'st-piper-tts',
        name: 'SillyTavern-Piper-TTS',
        description: 'SillyTavern-Piper-TTS plugin for generating audio from text using Piper TTS. just select silero and it works',
    },
};