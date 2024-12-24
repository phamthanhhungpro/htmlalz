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

        const processContent = (text) => {
            // Tách các phần bằng 2 dòng trống trở lên
            const sections = text.split(/\n{2,}/);
            
            return sections.flatMap(section => {
                const trimmedSection = section.trim();
                if (!trimmedSection) return [];

                // Xử lý các thẻ HTML h1, h2, h3
                if (trimmedSection.match(/<h[123][^>]*>/i)) {
                    const level = parseInt(trimmedSection.match(/<h([123])/i)[1]);
                    const text = trimmedSection.replace(/<\/?h[123]>/gi, '').trim();
                    return new docx.Paragraph({
                        children: [
                            new docx.TextRun({
                                text: text,
                                bold: true,
                                size: 34 - (level * 2), // h1: 32, h2: 30, h3: 28
                                color: '2E74B5'
                            })
                        ],
                        spacing: { 
                            before: 240 - (level * 40),
                            after: 120 - (level * 20)
                        }
                    });
                }

                // Xử lý danh sách (bullet points)
                if (trimmedSection.match(/^[•\-\*]/m)) {
                    const listItems = trimmedSection.split(/\n/).filter(Boolean);
                    return listItems.map(item => 
                        new docx.Paragraph({
                            children: [
                                new docx.TextRun({
                                    text: item.replace(/^[•\-\*]\s*/, ''),
                                    size: 24
                                })
                            ],
                            bullet: {
                                level: 0
                            },
                            spacing: { before: 60, after: 60 }
                        })
                    );
                }

                // Đoạn văn bản thông thường
                return new docx.Paragraph({
                    children: [
                        new docx.TextRun({
                            text: trimmedSection,
                            size: 24,
                            font: 'Arial'
                        })
                    ],
                    spacing: { 
                        before: 120,
                        after: 120,
                        line: 360,
                        lineRule: docx.LineRuleType.AUTO
                    },
                    alignment: docx.AlignmentType.JUSTIFIED
                });
            });
        };

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
            ...processContent(meta),
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
            ...processContent(mainContent)
        ];

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
        // Format và xử lý từng phần nội dung
        const processContent = (content) => {
            // Tách các phần bằng 2 dòng trống trở lên
            const sections = content.split(/\n{2,}/);
            
            return sections.flatMap(section => {
                const trimmedSection = section.trim();
                if (!trimmedSection) return [];

                // Xử lý heading (dòng bắt đầu bằng #)
                if (trimmedSection.startsWith('#')) {
                    return new docx.Paragraph({
                        children: [
                            new docx.TextRun({
                                text: trimmedSection.replace(/^#+\s*/, ''),
                                bold: true,
                                size: 28,
                                color: '2E74B5'
                            })
                        ],
                        spacing: { before: 240, after: 120 }
                    });
                }

                // Xử lý danh sách (bullet points)
                if (trimmedSection.match(/^[•\-\*]/m)) {
                    const listItems = trimmedSection.split(/\n/).filter(Boolean);
                    return listItems.map(item => 
                        new docx.Paragraph({
                            children: [
                                new docx.TextRun({
                                    text: item.replace(/^[•\-\*]\s*/, ''),
                                    size: 24
                                })
                            ],
                            bullet: {
                                level: 0
                            },
                            spacing: { before: 60, after: 60 }
                        })
                    );
                }

                // Đoạn văn bản thông thường
                return new docx.Paragraph({
                    children: [
                        new docx.TextRun({
                            text: trimmedSection,
                            size: 24,
                            font: 'Arial'
                        })
                    ],
                    spacing: { 
                        before: 120,
                        after: 120,
                        line: 360,
                        lineRule: docx.LineRuleType.AUTO
                    },
                    alignment: docx.AlignmentType.JUSTIFIED
                });
            });
        };

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
            // Process and format content sections
            ...processContent(content)
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
                                before: 120,
                                after: 120
                            }
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
