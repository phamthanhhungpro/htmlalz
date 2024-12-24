const OpenAI = require('openai');

class OpenAIService {
    constructor(apiKey) {
        this.openai = new OpenAI({ apiKey });
        this.requestCount = 0;
        this.lastRequestTime = Date.now();
    }

    async generateVideoContent(outline) {
        const systemPrompt = `Bạn là một người viết kịch bản video chuyên nghiệp, chuyên tạo nội dung bằng tiếng Việt.
            Hãy chuyển đổi dàn ý sau thành một kịch bản video THẬT CHI TIẾT và hấp dẫn.

            Cho mỗi chủ đề chính:
            1. Tạo phần mở đầu thu hút (tối thiểu 100 từ), giới thiệu vấn đề
            2. Phát triển mỗi ý chính với ít nhất 3-4 ví dụ cụ thể và thực tế
            3. Thêm các câu chuyển tiếp tự nhiên giữa các phần
            4. Phân tích sâu và giải thích kỹ mỗi khía cạnh
            5. Thêm các dẫn chứng, nghiên cứu, số liệu thống kê nếu có
            6. Kết luận đầy đủ và sâu sắc cho mỗi phần chính

            Yêu cầu chi tiết:
            - Bài viết tối thiếu 5000 từ
            - Sử dụng ngôn ngữ đối thoại, dễ hiểu nhưng chuyên sâu
            - Thêm nhiều ví dụ thực tế, câu chuyện minh họa
            - Đảm bảo nội dung mạch lạc và có tính liên kết cao
            - Giọng điệu thân thiện, gần gũi nhưng chuyên nghiệp
            - Phát triển ý tưởng theo hướng phân tích - lý giải - đề xuất
            - Mỗi luận điểm cần có dẫn chứng cụ thể
            
            Format kịch bản:
            [Phần mở đầu]
            - Câu mở đầu ấn tượng
            - Giới thiệu tổng quan chủ đề
            - Tại sao chủ đề này quan trọng
            - Những vấn đề sẽ được đề cập

            [Nội dung chi tiết từng phần]
            - Phân tích chuyên sâu
            - Ví dụ minh họa
            - Dẫn chứng thực tế
            - Bài học rút ra

            [Phần kết thúc]
            - Tổng kết các điểm chính
            - Bài học và giá trị thực tiễn
            - Lời kết ấn tượng`;

        const formattedOutline = this.formatOutlineForPrompt(outline);

        try {
            const completion = await this.openai.chat.completions.create({
                model: "o1-preview",
                messages: [
                    { 
                        role: "user", 
                        content: `${systemPrompt}:\n Dàn ý: ${formattedOutline}` 
                    }
                ],
                max_completion_tokens: 24000
            });

            return completion.choices[0].message.content.trim();
        } catch (error) {
            console.error('Error generating video content:', error);
            throw new Error('Failed to generate video content');
        }
    }

    async generateSEOContent(outline) {
        const formattedOutline = this.formatOutlineForPrompt(outline);

        try {
            const completion = await this.openai.chat.completions.create({
                model: "o1-preview",
                messages: [
                    { 
                        role: "user", 
                        content: `Bạn là một chuyên gia content writer chuyên nghiệp. 
                            Hãy tạo nội dung bài viết chi tiết chuẩn SEO theo yêu dàn ý và cầu dưới đây.
                            
                            Yêu cầu về format:
                            1. Sử dụng 2 dấu xuống dòng (\n\n) giữa các đoạn văn
                            2. Sử dụng dấu xuống dòng (\n) trong danh sách (bullets)
                            3. Tiêu đề phải cách nội dung 1 dòng
                            4. Phần mới phải cách phần cũ 2 dòng
                            5. Đảm bảo các phần được phân tách rõ ràng
                            
                            Yêu cầu về nội dung:
                            - Nội dung tối thiểu 4000 từ
                            - Đánh số thứ tự lại cho các phần chính
                            - Chất lượng cao, mạch lạc và dễ hiểu
                            - Đúng ngôn ngữ trong prompt
                            - Phân chia các phần logic và rõ ràng
                            
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