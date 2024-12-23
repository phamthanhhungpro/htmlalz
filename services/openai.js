const OpenAI = require('openai');

class OpenAIService {
    constructor(apiKey) {
        this.openai = new OpenAI({ apiKey });
        this.requestCount = 0;
        this.lastRequestTime = Date.now();
    }

    async generateVideoContent(outline) {
        const userPrompt = `Hãy chuyển đổi dàn ý sau thành một kịch bản video THẬT CHI TIẾT và hấp dẫn.
                            Tối thiểu 6000 từ.
                            Đánh lại số thứ tự các phần nếu cần thiết.`;

        const formattedOutline = this.formatOutlineForPrompt(outline);

        try {
            const completion = await this.openai.chat.completions.create({
                model: "o1-preview",
                messages: [
                    { 
                        role: "user", 
                        content: `Bạn là một người viết kịch bản video chuyên nghiệp. 
                                 Hãy tạo nội dung theo yêu cầu dưới đây.
                            
                            Yêu cầu về format:
                            1. Sử dụng 2 dấu xuống dòng (\n\n) giữa các đoạn văn
                            2. Sử dụng dấu xuống dòng (\n) trong danh sách (bullets)
                            3. Tiêu đề phải cách nội dung 1 dòng
                            4. Phần mới phải cách phần cũ 2 dòng
                            5. Đảm bảo các phần được phân tách rõ ràng
                            
                            Yêu cầu về nội dung:
                            - Chất lượng cao, mạch lạc và dễ hiểu
                            - Đúng ngôn ngữ trong prompt
                            - Phân chia các phần logic và rõ ràng

                            Prompt từ người dùng:
                            ${userPrompt}

                            Dàn ý chi tiết:
                            ${formattedOutline}` 
                    }
                ],
                max_completion_tokens: 24000
            });
            // Format lại output để đảm bảo xuống dòng đúng
            let content = completion.choices[0].message.content;
            
            // Đảm bảo xuống dòng sau tiêu đề
            content = content.replace(/^(#+ .+)$/gm, '$1\n');
            
            // Đảm bảo 2 dòng trống giữa các phần
            content = content.replace(/\n{3,}/g, '\n\n');
            
            // Đảm bảo bullets được xuống dòng đúng
            content = content.replace(/^[•\-\*] (.+)$/gm, '\n• $1');

            return content;

        } catch (error) {
            console.error('Error generating video content:', error);
            throw new Error('Failed to generate video content');
        }
    }

    async generateSEOContent(outline) {
        const formattedOutline = this.formatOutlineForPrompt(outline);
        const userPrompt = `Tạo nội dung chuẩn SEO cho bài viết với dàn ý sau, tối thiểu 6000 từ. 
                            Viết lại nội dung theo cách mạch lạc, dễ hiểu và chuyên sâu nhất có thể. 
                            Đánh lại số thứ tự các phần nếu cần thiết. Bài viết phải đáp ứng đầy đủ yêu cầu SEO.
                            Đảm bảo sử dụng từ khóa chính và từ khóa liên quan một cách hợp lý.
                            Đảm bảo hoàn hảo để copywriter có thể sử dụng nó mà không cần chỉnh sửa nhiều.`;

        try {
            const completion = await this.openai.chat.completions.create({
                model: "o1-preview",
                messages: [
                    { 
                        role: "user", 
                        content: `Bạn là một chuyên gia content writer chuyên nghiệp. 
                                  Hãy tạo nội dung theo yêu cầu dưới đây.
                            
                            Yêu cầu về format:
                            1. Sử dụng 2 dấu xuống dòng (\n\n) giữa các đoạn văn
                            2. Sử dụng dấu xuống dòng (\n) trong danh sách (bullets)
                            3. Tiêu đề phải cách nội dung 1 dòng
                            4. Phần mới phải cách phần cũ 2 dòng
                            5. Đảm bảo các phần được phân tách rõ ràng
                            
                            Yêu cầu về nội dung:
                            - Chất lượng cao, mạch lạc và dễ hiểu
                            - Đúng ngôn ngữ trong prompt
                            - Phân chia các phần logic và rõ ràng

                            Prompt từ người dùng:
                            ${userPrompt}

                            Dàn ý chi tiết:
                            ${formattedOutline}` 
                    }
                ],
                max_completion_tokens: 24000
            });

            // Format lại output để đảm bảo xuống dòng đúng
            let content = completion.choices[0].message.content;
            
            // Đảm bảo xuống dòng sau tiêu đề
            content = content.replace(/^(#+ .+)$/gm, '$1\n');
            
            // Đảm bảo 2 dòng trống giữa các phần
            content = content.replace(/\n{3,}/g, '\n\n');
            
            // Đảm bảo bullets được xuống dòng đúng
            content = content.replace(/^[•\-\*] (.+)$/gm, '\n• $1');

            return content;
        } catch (error) {
            console.error('Error generating SEO content:', error);
            throw new Error('Failed to generate SEO content');
        }
    }

    async generateCustomContent(outline, customPrompt) {
        await this.handleRateLimit();
        
        const formattedOutline = this.formatOutlineForPrompt(outline);

        try {
            const completion = await this.openai.chat.completions.create({
                model: "o1-preview",
                messages: [
                    { 
                        role: "user", 
                        content: `Bạn là một chuyên gia content writer chuyên nghiệp. 
                            Hãy tạo nội dung theo yêu cầu dưới đây.
                            
                            Yêu cầu về format:
                            1. Sử dụng 2 dấu xuống dòng (\n\n) giữa các đoạn văn
                            2. Sử dụng dấu xuống dòng (\n) trong danh sách (bullets)
                            3. Tiêu đề phải cách nội dung 1 dòng
                            4. Phần mới phải cách phần cũ 2 dòng
                            5. Đảm bảo các phần được phân tách rõ ràng
                            
                            Yêu cầu về nội dung:
                            - Chất lượng cao, mạch lạc và dễ hiểu
                            - Đúng ngôn ngữ trong prompt
                            - Phân chia các phần logic và rõ ràng
                            - Đánh lại số thứ tự các phần nếu cần thiết
                            
                            Prompt từ người dùng:
                            ${customPrompt}
                            
                            Dàn ý chi tiết:
                            ${formattedOutline}` 
                    }
                ],
                max_completion_tokens: 24000
            });

            // Format lại output để đảm bảo xuống dòng đúng
            let content = completion.choices[0].message.content;
            
            // Đảm bảo xuống dòng sau tiêu đề
            content = content.replace(/^(#+ .+)$/gm, '$1\n');
            
            // Đảm bảo 2 dòng trống giữa các phần
            content = content.replace(/\n{3,}/g, '\n\n');
            
            // Đảm bảo bullets được xuống dòng đúng
            content = content.replace(/^[•\-\*] (.+)$/gm, '\n• $1');

            this.requestCount++;
            this.lastRequestTime = Date.now();
            return content;
        } catch (error) {
            if (error.response?.status === 429) { // Rate limit error
                console.log('Rate limit reached, retrying after delay...');
                await new Promise(resolve => setTimeout(resolve, 20000)); // Wait 20s
                return this.generateCustomContent(outline, customPrompt);
            }
            throw error;
        }
    }

    async analyzeAndSelectOutlines(outlines, count) {
        const formatForAnalysis = outlines.map((outline, index) => ({
            index,
            content: this.formatOutlineForPrompt([outline])
        }));

        try {
            const completion = await this.openai.chat.completions.create({
                model: "gpt-4",
                messages: [
                    { 
                        role: "system", 
                        content: `Bạn là chuyên gia phân tích dàn ý nội dung.
                            Nhiệm vụ: Phân tích và chọn ${count} dàn ý TỐT NHẤT dựa trên:
                            1. Tính logic và mạch lạc
                            2. Độ bao quát của nội dung
                            3. Tính thực tiễn và giá trị
                            4. Tiềm năng phát triển nội dung
                            
                            Yêu cầu: Chỉ trả về mảng các số thứ tự (index) của các dàn ý được chọn.
                            Format: [0, 2, 3] (ví dụ cho 3 dàn ý được chọn)`
                    },
                    { 
                        role: "user", 
                        content: `Phân tích và chọn ${count} dàn ý tốt nhất từ danh sách sau:\n\n` +
                            formatForAnalysis.map(item => 
                                `[${item.index}]:\n${item.content}\n---\n`
                            ).join('\n')
                    }
                ],
                temperature: 0.3
            });

            const selectedIndexes = JSON.parse(completion.choices[0].message.content);
            
            return {
                selectedOutlines: selectedIndexes.map(index => outlines[index]),
                originalOutlines: outlines
            };

        } catch (error) {
            console.error('Error analyzing outlines:', error);
            throw new Error('Failed to analyze outlines');
        }
    }

    async handleRateLimit() {
        // Reset counter after 1 minute
        if (Date.now() - this.lastRequestTime > 60000) {
            this.requestCount = 0;
        }

        // Add delay if making too many requests
        if (this.requestCount > 3) { // Adjust this number based on your API limits
            const delay = Math.min(this.requestCount * 1000, 10000); // Max 10s delay
            console.log(`Adding ${delay}ms delay for rate limiting...`);
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }

    formatOutlineForPrompt(outline) {
        if (!outline || outline.length === 0) {
            console.warn('Empty outline received');
            return '';
        }

        const formatNode = (node, depth = 0) => {
            if (!node || !node.title) {
                console.warn('Invalid node:', node);
                return '';
            }

            const indent = '  '.repeat(depth);
            let result = `${indent}${node.title}\n`;
            
            // Process all children regardless of IsSelected
            if (Array.isArray(node.children) && node.children.length > 0) {
                const childrenText = node.children
                    .map(child => formatNode(child, depth + 1))
                    .join('');
                if (childrenText) {
                    result += childrenText;
                }
            }
            
            return result;
        };

        // Only filter at the top level for IsSelected
        const formattedResult = outline
            .filter(node => node.IsSelected !== false)
            .map(section => formatNode(section))
            .join('\n');
            
        return formattedResult || 'Không có dàn ý để xử lý';
    }
}

module.exports = OpenAIService;