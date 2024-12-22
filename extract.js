const puppeteer = require('puppeteer');
const cheerio = require('cheerio');
const fs = require('fs');
const cache = require('./cache');

// Process a single URL function
const processUrl = async (url) => {
    // Check cache first
    const cacheKey = `url:${url}`;
    const cachedData = cache.get(cacheKey);
    if (cachedData) {
        return cachedData;
    }

    const browser = await puppeteer.launch({
        executablePath: '/usr/bin/chromium-browser',
        args: ["--no-sandbox", "--disabled-setupid-sandbox"],
    });
    const page = await browser.newPage();
    page.setDefaultNavigationTimeout(60000);

    try {
        await page.goto(url, { waitUntil: 'networkidle2' });
        const html = await page.content();
        const $ = cheerio.load(html);

        const processedGuids = new Set();
        const data = { id: url, title: 'Root', children: [] };

        // Function to process a <g> element recursively
        const processGElement = (gElementHtml, parentArray) => {
            const $$ = cheerio.load(gElementHtml);

            // Find all <path> elements with data-view-id starting with "topic-connection"
            const pathElements = $$('path[data-view-id^="topic-connection"]').toArray();

            // Extract all GUIDs from the data-view-id attributes
            const guids = pathElements.map(pathElement => {
                const dataViewId = $$(pathElement).attr('data-view-id');
                const matches = dataViewId.match(/topic-connection:([^:]+):([^:]+)/);
                return matches ? [matches[1], matches[2]] : [];
            }).flat();

            // Remove duplicate GUIDs
            const uniqueGuids = [...new Set(guids)];

            // Loop through the uniqueGuids and find <g> elements with data-view-id="topic-connection-group:id"
            uniqueGuids.forEach(guid => {
                if (!processedGuids.has(guid)) {
                    processedGuids.add(guid);
                    const gElement = $(`g[data-view-id="topic-connection-group:${guid}"]`).html();
                    if (gElement) {
                        // get the topic title
                        const topicTitleElement = $(`g[data-view-id="topic-content-main-group:${guid}"]`);
                        const topicTitle = topicTitleElement.find('span').first().text().trim();

                        const newNode = { id: guid, title: topicTitle, children: [] };
                        parentArray.push(newNode);
                        processGElement(gElement, newNode.children);
                    } else {
                        const topicTitleElement = $(`g[data-view-id="topic-content-main-group:${guid}"]`);
                        if (topicTitleElement.length > 0) {
                            const topicTitle = topicTitleElement.find('span').first().text().trim();
                            const newNode = { id: guid, title: topicTitle, children: [] };
                            parentArray.push(newNode);
                        }
                    }
                }
            });
        };

        const firstGElement = $('g[data-view-id^="topic-connection-group:"]').first().html();
        if (firstGElement) {
            processGElement(firstGElement, data.children);
        }

        // Store in cache before returning
        cache.set(cacheKey, data);
        return data;
    } finally {
        await browser.close();
    }
};

// New function to process multiple URLs
const processUrls = async (urls) => {
    try {
        return await Promise.all(urls.map(url => processUrl(url)));
    } catch (error) {
        console.error('Error processing URLs:', error);
        throw error;
    }
};

module.exports = {
    processUrls
};