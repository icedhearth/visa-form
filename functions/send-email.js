const nodemailer = require('nodemailer');

exports.handler = async function(event, context) {
    console.log('Função send-email foi acionada!'); // Log para depuração
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Método não permitido' };
    }

    const formData = new URLSearchParams(event.body);
    const nome = formData.get('nome') || 'Não informado';
    const passaporte = formData.get('passaporte') || 'Não informado';
    const pdfBase64 = formData.get('pdfData');

    const transporter = nodemailer.createTransport({
        host: 'smtp-mail.outlook.com',
        port: 587,
        secure: false,
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        },
        tls: {
            ciphers: 'SSLv3'
        }
    });

    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: 'objetivoturismo@hotmail.com',
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
