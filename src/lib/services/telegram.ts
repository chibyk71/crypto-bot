import TelegramBot from 'node-telegram-bot-api';
import { serverConfig } from '$lib/server/config/settings';

export class TelegramService {
    private bot: TelegramBot;
    private chatId: string;

    constructor() {
        if (!serverConfig.telegram.token) {
            throw new Error('Telegram Bot token is missing in serverConfig');
        }
        if (!serverConfig.telegram.chatId) {
            throw new Error('Telegram chatId is missing in serverConfig');
        }

        this.chatId = serverConfig.telegram.chatId;

        // Start bot in polling mode
        this.bot = new TelegramBot(serverConfig.telegram.token, { polling: false });
    }

    
    /**
     * Send a text message to the configured Telegram chatId
     * @param message the text message to send
     */
    async sendMessage(message: string): Promise<void> {
        try {
            await this.bot.sendMessage(this.chatId, message);
            console.log(`Telegram message sent: ${message}`);
        } catch (error) {
            console.error('Failed to send Telegram message:', error);
        }
    }

    /**
     * Send a photo with optional caption
     * @param photoUrl the URL of the photo to send
     * @param caption an optional caption for the photo
     */
    async sendPhoto(photoUrl: string, caption?: string): Promise<void> {
        try {
            await this.bot.sendPhoto(this.chatId, photoUrl, { caption });
            console.log(`Telegram photo sent: ${photoUrl}`);
        } catch (error) {
            console.error('Failed to send Telegram photo:', error);
        }
    }

    /**
     * Send a document (PDF, etc.)
     */
    async sendDocument(filePath: string, caption?: string): Promise<void> {
        try {
            await this.bot.sendDocument(this.chatId, filePath, { caption });
            console.log(`Telegram document sent: ${filePath}`);
        } catch (error) {
            console.error('Failed to send Telegram document:', error);
        }
    }
}
