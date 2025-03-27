const { google } = require('googleapis');
const express = require('express');
const app = express();

const CLIENT_ID = 'SEU_CLIENT_ID';
const CLIENT_SECRET = 'SEU_CLIENT_SECRET';
const REDIRECT_URI = 'https://localhost';

const oAuth2Client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);

const SCOPES = ['https://www.googleapis.com/auth/gmail.send'];

const authUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
    prompt: 'consent',
});

console.log('Acesse este URL para autorizar o app:', authUrl);

app.get('/', async (req, code) => {
    const { tokens } = await oAuth2Client.getToken(req.query.code);
    console.log('Refresh Token:', tokens.refresh_token);
    process.exit();
});

app.listen(80, () => {
    console.log('Servidor rodando em https://localhost');
});
