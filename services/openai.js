const OpenAI = require('openai');

class OpenAIService {
    constructor(apiKey) {
        this.openai = new OpenAI({ apiKey });
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
            - Mỗi phần chính cần tối thiểu 500 từ
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
                model: "gpt-4",
                messages: [
                    { role: "system", content: systemPrompt },
                    { 
                        role: "user", 
                        content: `Hãy tạo kịch bản video THẬT CHI TIẾT cho dàn ý sau, đảm bảo nội dung chuyên sâu:\n${formattedOutline}` 
                    }
                ],
                temperature: 0.8,
                max_tokens: 4000, // Reduced max_tokens to stay within limits
                presence_penalty: 0.2,
                frequency_penalty: 0.3
            });

            return completion.choices[0].message.content.trim();
        } catch (error) {
            console.error('Error generating video content:', error);
            throw new Error('Failed to generate video content');
        }
    }

    async generateSEOContent(outline) {
        const systemPrompt = `Bạn là một chuyên gia content writer, chuyên viết bài SEO cho website. 
            Hãy viết một bài theo dàn ý với các yêu cầu sau:

            1. Cấu trúc bài viết (800-1200 từ):
            
            [META]
            - Tiêu đề (H1): Hấp dẫn, chứa từ khóa chính
            - Meta description: 150-160 ký tự, thu hút click
            
            [INTRO]
            - Mở đầu ấn tượng
            - Giới thiệu vấn đề
            - Tóm tắt những gì bài viết sẽ đề cập
            - Chèn từ khóa chính tự nhiên
            
            [MAIN_CONTENT]
            - Sử dụng H2, H3 từ dàn ý
            - Mỗi phần 200-300 từ
            - Ví dụ thực tế, số liệu cụ thể
            - Sử dụng bullet points khi cần
            - Đảm bảo dễ đọc, dễ hiểu
            - Từ khóa phụ tự nhiên
            
            [CONCLUSION]
            - Tóm tắt các điểm chính
            - Kêu gọi hành động rõ ràng
            - Gợi ý thêm tài nguyên liên quan
            
            2. Yêu cầu SEO:
            - Từ khóa chính xuất hiện trong H1, meta
            - Từ khóa phụ trong H2, H3
            - Mật độ từ khóa 1-1.5%
            - Câu ngắn gọn, rõ ràng
            - Đoạn văn 2-4 câu

            3. Tone giọng:
            - Thân thiện, gần gũi
            - Chuyên nghiệp
            - Dễ hiểu với mọi đối tượng
            
            Output format:
            ---META---
            Title: [H1 title]
            Description: [Meta description]

            ---CONTENT---
            <h1>[Title]</h1>

            [Intro content]

            <h2>[Main section 1]</h2>
            [Content]

            <h3>[Sub section]</h3>
            [Content]

            <h2>[Main section 2]</h2>
            [Content]

            [Conclusion]`;

        const formattedOutline = this.formatOutlineForPrompt(outline);

        try {
            const completion = await this.openai.chat.completions.create({
                model: "gpt-4",
                messages: [
                    { role: "system", content: systemPrompt },
                    { 
                        role: "user", 
                        content: `Hãy tạo bài viết chuẩn SEO từ dàn ý sau:\n${formattedOutline}` 
                    }
                ],
                temperature: 0.7,
                max_tokens: 4000,
                presence_penalty: 0.1,
                frequency_penalty: 0.1
            });

            return completion.choices[0].message.content;
        } catch (error) {
            console.error('Error generating SEO content:', error);
            throw new Error('Failed to generate SEO content');
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