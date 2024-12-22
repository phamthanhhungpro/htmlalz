const express = require('express');
const path = require('path');
const fs = require('fs');
const OpenAIService = require('./services/openai');
const DocumentService = require('./services/document');
const { processUrls } = require('./extract');

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3333;
const documentService = new DocumentService();

app.post('/api/extract', async (req, res) => {
    try {
        const { urls } = req.body;
        if (!urls || !Array.isArray(urls)) {
            return res.status(400).json({ error: 'URLs array is required' });
        }

        const results = await processUrls(urls);
        res.json(results);
    } catch (error) {
        console.error('Error processing URLs:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.post('/api/generate-video-content', async (req, res) => {
    try {
        const { apiKey, outline } = req.body;
        
        if (!apiKey) {
            return res.status(400).json({ error: 'OpenAI API key is required' });
        }

        if (!outline || !Array.isArray(outline)) {
            return res.status(400).json({ error: 'Valid outline array is required' });
        }

        const openaiService = new OpenAIService(apiKey);
        const content = await openaiService.generateVideoContent(outline);
        
        // Generate document and get filename
        const filename = await documentService.generateDocument(content);
        const baseUrl = `${req.protocol}://${req.get('host')}`;
        const downloadUrl = `${baseUrl}/download/${filename}`;

        res.json({ downloadUrl });
    } catch (error) {
        console.error('Error generating video content:', error);
        res.status(500).json({ error: error.message || 'Internal server error' });
    }
});

app.post('/api/generate-seo-content', async (req, res) => {
    try {
        const { apiKey, outline } = req.body;
        
        if (!apiKey) {
            return res.status(400).json({ error: 'OpenAI API key is required' });
        }

        if (!outline || !Array.isArray(outline)) {
            return res.status(400).json({ error: 'Valid outline array is required' });
        }

        const openaiService = new OpenAIService(apiKey);
        const content = await openaiService.generateSEOContent(outline);
        
        // Generate document with SEO type
        const filename = await documentService.generateDocument(content, 'seo');
        const baseUrl = `${req.protocol}://${req.get('host')}`;
        const downloadUrl = `${baseUrl}/download/${filename}`;

        res.json({ content, downloadUrl });
    } catch (error) {
        console.error('Error generating SEO content:', error);
        res.status(500).json({ error: error.message || 'Internal server error' });
    }
});

app.get('/download/:filename', (req, res) => {
    const filename = req.params.filename;
    const filepath = path.join(__dirname, 'documents', filename);
    
    if (!fs.existsSync(filepath)) {
        return res.status(404).json({ error: 'File not found' });
    }
    
    res.download(filepath);
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
