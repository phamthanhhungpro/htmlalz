const express = require('express');
const path = require('path');
const fs = require('fs');
const OpenAIService = require('./services/openai');
const DocumentService = require('./services/document');
const { processUrls } = require('./extract');
const logger = require('./services/logger');

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3333;
const documentService = new DocumentService();

app.post('/api/extract', async (req, res) => {
    try {
        logger.info('/api/extract', { urls: req.body.urls });
        const { urls } = req.body;
        if (!urls || !Array.isArray(urls)) {
            return res.status(400).json({ error: 'URLs array is required' });
        }

        const results = await processUrls(urls);
        logger.info('/api/extract', { success: true, count: results.length });
        res.json(results);
    } catch (error) {
        logger.error('/api/extract', error);
        console.error('Error processing URLs:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.post('/api/generate-video-content', async (req, res) => {
    try {
        logger.info('/api/generate-video-content', { outline: req.body.outline });
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

        logger.info('/api/generate-video-content', { success: true, downloadUrl });
        res.json({ downloadUrl });
    } catch (error) {
        logger.error('/api/generate-video-content', error);
        console.error('Error generating video content:', error);
        res.status(500).json({ error: error.message || 'Internal server error' });
    }
});

app.post('/api/generate-seo-content', async (req, res) => {
    try {
        logger.info('/api/generate-seo-content', { outline: req.body.outline });
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

        logger.info('/api/generate-seo-content', { success: true, downloadUrl });
        res.json({ content, downloadUrl });
    } catch (error) {
        logger.error('/api/generate-seo-content', error);
        console.error('Error generating SEO content:', error);
        res.status(500).json({ error: error.message || 'Internal server error' });
    }
});

app.post('/api/run-prompt', async (req, res) => {
    try {
        logger.info('/api/run-prompt', { 
            outline: req.body.outline,
            count: req.body.count,
            promptLength: req.body.prompt?.length
        });

        const { apiKey, outline, prompt, count = 1 } = req.body;
        if (!apiKey) {
            console.log('API key is required');
            return res.status(400).json({ error: 'OpenAI API key is required' });
        }

        if (!outline || !Array.isArray(outline)) {
            console.log('Valid outline array is required');
            return res.status(400).json({ error: 'Valid outline array is required' });
        }

        if (!prompt) {
            console.log('Prompt is required');
            return res.status(400).json({ error: 'Prompt is required' });
        }

        const openaiService = new OpenAIService(apiKey);
        console.log(`Starting ${count} content generations in parallel...`);
        
        // Generate contents in parallel
        const contentPromises = Array(count).fill(null).map((_, index) => {
            logger.info('/api/run-prompt', `Starting version ${index + 1}/${count}`);
            return openaiService.generateCustomContent(outline, prompt)
                .then(content => {
                    logger.info('/api/run-prompt', `Completed version ${index + 1}/${count}`);
                    return content;
                });
        });

        // Wait for all content generations to complete
        const contents = await Promise.all(contentPromises);
        console.log(`All ${count} versions completed`);
        
        // Generate document with all contents
        const filename = await documentService.generateMultipleContents(contents);
        const baseUrl = `${req.protocol}://${req.get('host')}`;
        const downloadUrl = `${baseUrl}/download/${filename}`;

        logger.info('/api/run-prompt', { success: true, downloadUrl });
        res.json({ downloadUrl });
    } catch (error) {
        logger.error('/api/run-prompt', error);
        console.error('Error generating custom content:', error);
        res.status(500).json({ error: error.message || 'Internal server error' });
    }
});

app.get('/api/logs', (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 100;
        const logs = logger.getRecentLogs(limit);
        res.json({ logs });
    } catch (error) {
        logger.error('/api/logs', error);
        res.status(500).json({ error: 'Error fetching logs' });
    }
});

app.get('/download/:filename', (req, res) => {
    try {
        logger.info('/download', { filename: req.params.filename });
        const filename = req.params.filename;
        const filepath = path.join(__dirname, 'documents', filename);
        
        if (!fs.existsSync(filepath)) {
            return res.status(404).json({ error: 'File not found' });
        }
        
        logger.info('/download', { success: true, filename: req.params.filename });
        res.download(filepath);
    } catch (error) {
        logger.error('/download', error);
        console.error('Error downloading file:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
