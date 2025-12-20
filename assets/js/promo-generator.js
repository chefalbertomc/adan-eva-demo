// ===================================
// PROMOTIONAL IMAGE GENERATOR
// ===================================
// Generates personalized promotional images using Canvas API

const PromoGenerator = {
    templates: [
        {
            id: 'vip_exclusive',
            name: 'VIP Exclusivo',
            bgGradient: ['#1a1a1a', '#4a3f00'],
            accentColor: '#FFD700',
            emoji: '👑',
            title: '¡OFERTA VIP EXCLUSIVA!'
        },
        {
            id: 'comeback',
            name: 'Te Extrañamos',
            bgGradient: ['#1a1a1a', '#4a0000'],
            accentColor: '#FF6B6B',
            emoji: '💝',
            title: '¡TE EXTRAÑAMOS!'
        },
        {
            id: 'welcome',
            name: 'Bienvenida',
            bgGradient: ['#1a1a1a', '#004a1a'],
            accentColor: '#34D399',
            emoji: '🌟',
            title: '¡BIENVENIDO!'
        },
        {
            id: 'birthday',
            name: 'Cumpleaños',
            bgGradient: ['#1a1a1a', '#4a004a'],
            accentColor: '#D946EF',
            emoji: '🎂',
            title: '¡FELIZ CUMPLEAÑOS!'
        },
        {
            id: 'game_day',
            name: 'Día de Partido',
            bgGradient: ['#1a1a1a', '#001a4a'],
            accentColor: '#60A5FA',
            emoji: '🏈',
            title: '¡VEN A VER EL PARTIDO!'
        }
    ],

    /**
     * Generate promotional image
     * @param {string} templateId - Template ID
     * @param {object} data - { customerName, message, branchName }
     * @returns {string} Data URL of generated image
     */
    generate(templateId, data) {
        const template = this.templates.find(t => t.id === templateId) || this.templates[0];

        // Create canvas
        const canvas = document.createElement('canvas');
        canvas.width = 1080; // Instagram square
        canvas.height = 1080;
        const ctx = canvas.getContext('2d');

        // Background gradient
        const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
        gradient.addColorStop(0, template.bgGradient[0]);
        gradient.addColorStop(1, template.bgGradient[1]);
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Add noise/texture (optional)
        ctx.fillStyle = 'rgba(255, 255, 255, 0.02)';
        for (let i = 0; i < 1000; i++) {
            const x = Math.random() * canvas.width;
            const y = Math.random() * canvas.height;
            ctx.fillRect(x, y, 2, 2);
        }

        // Logo area (simplified - text based)
        ctx.font = 'bold 48px Arial';
        ctx.fillStyle = '#FFD700';
        ctx.textAlign = 'center';
        ctx.fillText('ADAN & EVA', canvas.width / 2, 120);

        ctx.font = '32px Arial';
        ctx.fillStyle = '#CCCCCC';
        ctx.fillText('Buffalo Wild Wings', canvas.width / 2, 170);

        // Emoji
        ctx.font = '180px Arial';
        ctx.fillText(template.emoji, canvas.width / 2, 380);

        // Title
        ctx.font = 'bold 64px Arial';
        ctx.fillStyle = template.accentColor;
        ctx.fillText(template.title, canvas.width / 2, 520);

        // Customer name
        if (data.customerName) {
            ctx.font = 'bold 54px Arial';
            ctx.fillStyle = '#FFFFFF';
            ctx.fillText(data.customerName.toUpperCase(), canvas.width / 2, 620);
        }

        // Message (wrapped)
        if (data.message) {
            ctx.font = '36px Arial';
            ctx.fillStyle = '#EEEEEE';
            const words = data.message.split(' ');
            let line = '';
            let y = 720;
            const maxWidth = 900;

            words.forEach((word, idx) => {
                const testLine = line + word + ' ';
                const metrics = ctx.measureText(testLine);
                if (metrics.width > maxWidth && idx > 0) {
                    ctx.fillText(line, canvas.width / 2, y);
                    line = word + ' ';
                    y += 50;
                } else {
                    line = testLine;
                }
            });
            ctx.fillText(line, canvas.width / 2, y);
        }

        // Footer
        ctx.font = '28px Arial';
        ctx.fillStyle = '#888888';
        ctx.fillText(data.branchName || 'Querétaro', canvas.width / 2, 980);

        // Border accent
        ctx.strokeStyle = template.accentColor;
        ctx.lineWidth = 12;
        ctx.strokeRect(20, 20, canvas.width - 40, canvas.height - 40);

        return canvas.toDataURL('image/png');
    },

    /**
     * Render template selector
     * @returns {string} HTML markup
     */
    renderTemplateSelector() {
        return `
            <div class="grid grid-cols-2 md:grid-cols-3 gap-3">
                ${this.templates.map(t => `
                    <div onclick="selectPromoTemplate('${t.id}')" 
                         data-template="${t.id}"
                         class="promo-template-card cursor-pointer p-4 rounded-lg border-2 border-gray-700 hover:border-yellow-500 transition text-center">
                        <div class="text-4xl mb-2">${t.emoji}</div>
                        <div class="text-sm font-bold">${t.name}</div>
                    </div>
                `).join('')}
            </div>
        `;
    }
};

// Export to global
window.PromoGenerator = PromoGenerator;
