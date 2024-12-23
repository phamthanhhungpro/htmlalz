const docx = require('docx');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

class DocumentService {
    constructor() {
        this.documentsDir = path.join(__dirname, '../documents');
        if (!fs.existsSync(this.documentsDir)) {
            fs.mkdirSync(this.documentsDir);
        }
    }

    formatContent(content) {
        // Split content into sections
        const sections = content.split(/\[.*?\]/g).filter(Boolean);
        const titles = content.match(/\[(.*?)\]/g) || [];
        
        return titles.map((title, index) => ({
            title: title.replace(/[\[\]]/g, ''),
            content: sections[index]?.trim() || ''
        }));
    }

    async generateDocument(content, type = 'video') {
        return type === 'seo' ? 
            this.generateSEODocument(content) : 
            this.generateVideoDocument(content);
    }

    async generateVideoDocument(content) {
        const formattedSections = this.formatContent(content);
        
        const children = formattedSections.flatMap(section => [
            // Section Title with better spacing
            new docx.Paragraph({
                children: [
                    new docx.TextRun({
                        text: section.title.toUpperCase(), // Uppercase for better visibility
                        bold: true,
                        size: 28,
                        color: '2E74B5',
                        font: 'Arial'
                    })
                ],
                spacing: { 
                    before: 240,
                    after: 120
                },
                heading: docx.HeadingLevel.HEADING_1,
                border: {
                    bottom: {
                        color: "999999",
                        space: 1,
                        style: "single",
                        size: 6
                    }
                }
            }),
            // Section Content with improved readability
            new docx.Paragraph({
                children: [
                    new docx.TextRun({
                        text: section.content,
                        size: 24,
                        font: 'Arial'
                    })
                ],
                spacing: { 
                    after: 240,
                    line: 360,
                    lineRule: docx.LineRuleType.AUTO
                },
                alignment: docx.AlignmentType.JUSTIFIED
            })
        ]);

        const doc = new docx.Document({
            styles: {
                paragraphStyles: [
                    {
                        id: "Normal",
                        name: "Normal",
                        run: {
                            font: "Arial",
                            size: 24
                        },
                        paragraph: {
                            spacing: {
                                line: 360,
                                lineRule: docx.LineRuleType.AUTO
                            }
                        }
                    }
                ]
            },
            sections: [{
                properties: {
                    page: {
                        margin: {
                            top: 1440,  // 1 inch margins
                            bottom: 1440,
                            left: 1440,
                            right: 1440
                        }
                    }
                },
                children: children
            }]
        });

        const filename = `${uuidv4()}.docx`;
        const filepath = path.join(this.documentsDir, filename);
        
        const buffer = await docx.Packer.toBuffer(doc);
        fs.writeFileSync(filepath, buffer);
        
        return filename;
    }

    async generateSEODocument(content) {
        // Parse META section
        const metaMatch = content.match(/---META---\s*([\s\S]*?)\s*---CONTENT---/);
        const meta = metaMatch ? metaMatch[1] : '';
        
        // Get main content
        const mainContent = content.replace(/---META---[\s\S]*?---CONTENT---/, '').trim();

        const children = [
            // Meta Information Section
            new docx.Paragraph({
                children: [
                    new docx.TextRun({
                        text: "META INFORMATION",
                        bold: true,
                        size: 28,
                        color: '7B2CBF'
                    })
                ],
                spacing: { after: 200 },
                border: {
                    bottom: { style: 'single', size: 10, color: '7B2CBF' }
                }
            }),
            new docx.Paragraph({
                children: [new docx.TextRun({ text: meta, size: 24 })],
                spacing: { after: 400 }
            }),

            // Main Content Section
            new docx.Paragraph({
                children: [
                    new docx.TextRun({
                        text: "MAIN CONTENT",
                        bold: true,
                        size: 28,
                        color: '2E74B5'
                    })
                ],
                spacing: { before: 400, after: 200 },
                border: {
                    bottom: { style: 'single', size: 10, color: '2E74B5' }
                }
            }),
        ];

        // Process main content - convert HTML tags to styled paragraphs
        const contentSections = mainContent.split(/(<h[1-3]>.*?<\/h[1-3]>)/g)
            .filter(Boolean)
            .map(section => {
                if (section.startsWith('<h1>')) {
                    return new docx.Paragraph({
                        children: [
                            new docx.TextRun({
                                text: section.replace(/<\/?h1>/g, ''),
                                bold: true,
                                size: 32,
                                color: '2E74B5'
                            })
                        ],
                        spacing: { before: 240, after: 120 }
                    });
                } else if (section.startsWith('<h2>')) {
                    return new docx.Paragraph({
                        children: [
                            new docx.TextRun({
                                text: section.replace(/<\/?h2>/g, ''),
                                bold: true,
                                size: 28,
                                color: '2E74B5'
                            })
                        ],
                        spacing: { before: 200, after: 100 }
                    });
                } else if (section.startsWith('<h3>')) {
                    return new docx.Paragraph({
                        children: [
                            new docx.TextRun({
                                text: section.replace(/<\/?h3>/g, ''),
                                bold: true,
                                size: 26,
                                color: '2E74B5'
                            })
                        ],
                        spacing: { before: 160, after: 80 }
                    });
                } else {
                    return new docx.Paragraph({
                        children: [
                            new docx.TextRun({
                                text: section.trim(),
                                size: 24
                            })
                        ],
                        spacing: { before: 80, after: 80 },
                        alignment: docx.AlignmentType.JUSTIFIED
                    });
                }
            });

        children.push(...contentSections);

        const doc = new docx.Document({
            styles: {
                paragraphStyles: [
                    {
                        id: "Normal",
                        name: "Normal",
                        run: {
                            font: "Arial",
                            size: 24
                        },
                        paragraph: {
                            spacing: { line: 360 }
                        }
                    }
                ]
            },
            sections: [{
                properties: {
                    page: {
                        margin: {
                            top: 1440,
                            bottom: 1440,
                            left: 1440,
                            right: 1440
                        }
                    }
                },
                children: children
            }]
        });

        const filename = `${uuidv4()}.docx`;
        const filepath = path.join(this.documentsDir, filename);
        
        const buffer = await docx.Packer.toBuffer(doc);
        fs.writeFileSync(filepath, buffer);
        
        return filename;
    }

    async generateMultipleContents(contents) {
        const children = contents.flatMap((content, index) => [
            // Version separator
            new docx.Paragraph({
                children: [
                    new docx.TextRun({
                        text: `Phiên bản ${index + 1}`,
                        bold: true,
                        size: 32,
                        color: '7B2CBF'
                    })
                ],
                spacing: { before: 400, after: 200 },
                pageBreakBefore: true,
                border: {
                    bottom: { style: 'single', size: 10, color: '7B2CBF' }
                }
            }),
            // Content section
            new docx.Paragraph({
                children: [
                    new docx.TextRun({
                        text: content,
                        size: 24,
                        font: 'Arial'
                    })
                ],
                spacing: { 
                    after: 240,
                    line: 360,
                    lineRule: docx.LineRuleType.AUTO
                },
                alignment: docx.AlignmentType.JUSTIFIED
            })
        ]);

        const doc = new docx.Document({
            styles: {
                paragraphStyles: [
                    {
                        id: "Normal",
                        name: "Normal",
                        run: {
                            font: "Arial",
                            size: 24
                        },
                        paragraph: {
                            spacing: { line: 360 }
                        }
                    }
                ]
            },
            sections: [{
                properties: {
                    page: {
                        margin: {
                            top: 1440,
                            bottom: 1440,
                            left: 1440,
                            right: 1440
                        }
                    }
                },
                children: children
            }]
        });

        const filename = `${uuidv4()}.docx`;
        const filepath = path.join(this.documentsDir, filename);
        
        const buffer = await docx.Packer.toBuffer(doc);
        fs.writeFileSync(filepath, buffer);
        
        return filename;
    }
}

module.exports = DocumentService;
