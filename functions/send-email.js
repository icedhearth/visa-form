const nodemailer = require('nodemailer');

exports.handler = async function (event, context) {
    console.log('Função send-email foi acionada!');

    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            body: JSON.stringify({ message: 'Método não permitido' }),
        };
    }

    try {
        console.log('Parsing form data');
        const formData = new URLSearchParams(event.body);
        const nome = formData.get('nome');
        const passaporte = formData.get('passaporte');
        const pdfData = formData.get('pdfData');

        console.log('Configurando transporter do nodemailer');
        const transporter = nodemailer.createTransport({
            host: 'smtp.office365.com',
            port: 587,
            secure: false, // Use TLS
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
            tls: {
                ciphers: 'SSLv3', // Para compatibilidade com alguns servidores
            },
        });

        console.log('Configurando opções de e-mail');
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: process.env.EMAIL_USER,
            subject: `Novo Formulário de Visto - ${nome}`,
            text: `Novo formulário recebido:\nNome: ${nome}\nPassaporte: ${passaporte}`,
            attachments: [
                {
                    filename: 'formulario_visto.pdf',
                    content: Buffer.from(pdfData, 'base64'),
                    contentType: 'application/pdf',
                },
            ],
        };

        console.log('Enviando e-mail...');
        await transporter.sendMail(mailOptions);
        console.log('E-mail enviado com sucesso!');

        return {
            statusCode: 200,
            body: JSON.stringify({ message: 'E-mail enviado com sucesso!' }),
        };
    } catch (error) {
        console.error('Erro ao enviar e-mail:', error.message);
        return {
            statusCode: 500,
            body: JSON.stringify({ message: 'Erro ao enviar e-mail', error: error.message }),
        };
    }
};
