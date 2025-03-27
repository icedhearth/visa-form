const nodemailer = require('nodemailer');

exports.handler = async function(event, context) {
    console.log('Função send-email foi acionada!'); // Adicione este log
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Método não permitido' };
    }
    // ... resto do código ...
};

const nodemailer = require('nodemailer');

exports.handler = async function(event, context) {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Método não permitido' };
    }

    const formData = new URLSearchParams(event.body);
    const nome = formData.get('nome') || 'Não informado';
    const passaporte = formData.get('passaporte') || 'Não informado';
    const pdfBase64 = formData.get('pdfData');

    // Configuração do transporte de e-mail para Hotmail/Outlook
    const transporter = nodemailer.createTransport({
        host: 'smtp-mail.outlook.com', // Servidor SMTP do Hotmail/Outlook
        port: 587, // Porta padrão para TLS
        secure: false, // true para 465, false para outras portas
        auth: {
            user: process.env.EMAIL_USER, // Deve ser 'objetivoturismo@hotmail.com'
            pass: process.env.EMAIL_PASS  // Senha correta do Hotmail
        },
        tls: {
            ciphers: 'SSLv3' // Para compatibilidade com Outlook
        }
    });

    // Configuração do e-mail
    const mailOptions = {
        from: process.env.EMAIL_USER, // 'objetivoturismo@hotmail.com'
        to: 'objetivoturismo@hotmail.com', // Destinatário fixo
        subject: `Formulário de Visto - ${nome} - Passaporte: ${passaporte}`,
        text: 'Segue em anexo o formulário de solicitação de visto preenchido.',
        attachments: [
            {
                filename: 'formulario_visto.pdf',
                content: pdfBase64,
                encoding: 'base64'
            }
        ]
    };

    try {
        await transporter.sendMail(mailOptions);
        return {
            statusCode: 200,
            body: JSON.stringify({ message: 'E-mail enviado com sucesso' })
        };
    } catch (error) {
        console.error('Erro ao enviar e-mail:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Erro ao enviar e-mail', details: error.message })
        };
    }
};
