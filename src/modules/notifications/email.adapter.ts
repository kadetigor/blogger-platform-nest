import nodemailer from 'nodemailer';


export class EmailAdapter {
    async sendEmail(email: string, subject: string, message: string) {
        // If no API key is configured, just log and return success
        if (process.env.SENDGRID_API_KEY) {
            console.log('No SendGrid API key configured, skipping email send');
            console.log(`Would send email to: ${email}, subject: ${subject}`);
            return { messageId: 'no-api-key-configured' };
        }

        try {
            let transport = nodemailer.createTransport({
                host: "smtp.sendgrid.net",
                port: 587,
                secure: false,
                auth: {
                    user: "apikey",
                    pass: process.env.SENDGRID_API_KEY,
                },
            });
        
            let info = await transport.sendMail({
                from: `Igor <kadet3216@em3772.ftpropaganda.com>`,
                to: email,
                subject: subject,
                html: message
            });
            
            console.log('Email sent: ', info.messageId);
            return info;
        } catch (error) {
            console.error('Error sending email:', error);
            // Don't throw errors to prevent breaking the flow
            console.log('Email sending failed, but continuing...');
            return { messageId: 'email-send-failed' };
        }
    }
}