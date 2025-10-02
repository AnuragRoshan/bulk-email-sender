import { NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { appendToGoogleSheet } from "../../utils/googleSheets";

export async function POST(request) {
  try {
    const { recipients, template, smtpConfig, attachments, googleSheetsConfig } = await request.json();

    // Create transporter
    const transporter = nodemailer.createTransport({
      host: smtpConfig.host,
      port: smtpConfig.port,
      secure: smtpConfig.secure,
      auth: {
        user: smtpConfig.user,
        pass: smtpConfig.pass,
      },
    });

    const results = [];

    // Send emails to all recipients
    for (const recipient of recipients) {
      try {
        // Replace variables in template
        let personalizedContent = template.content
          .replace(/\{name\}/g, recipient.name)
          .replace(/\{company\}/g, recipient.company)
          .replace(/\{email\}/g, recipient.email);

        let personalizedSubject = template.subject
          .replace(/\{name\}/g, recipient.name)
          .replace(/\{company\}/g, recipient.company)
          .replace(/\{email\}/g, recipient.email);

        const fromAddress = smtpConfig.senderName
          ? `"${smtpConfig.senderName}" <${smtpConfig.user}>`
          : smtpConfig.user;

        const mailOptions = {
          from: fromAddress,
          to: recipient.email,
          subject: personalizedSubject,
          html: personalizedContent,
        };

        // Add attachments if provided
        if (attachments && attachments.length > 0) {
          mailOptions.attachments = attachments.map((att) => ({
            filename: att.filename,
            content: att.content,
            encoding: 'base64',
            contentType: att.contentType,
          }));
        }

        await transporter.sendMail(mailOptions);

        results.push({
          email: recipient.email,
          name: recipient.name,
          company: recipient.company,
          status: "sent",
          subject: personalizedSubject,
          sentAt: new Date().toISOString()
        });
      } catch (error) {
        results.push({
          email: recipient.email,
          name: recipient.name,
          company: recipient.company,
          status: "failed",
          error: error instanceof Error ? error.message : "Unknown error",
          subject: template.subject,
          sentAt: new Date().toISOString()
        });
      }
    }

    // Log to Google Sheets if configured
    if (googleSheetsConfig && googleSheetsConfig.enabled && googleSheetsConfig.spreadsheetId) {
      try {
        await appendToGoogleSheet(googleSheetsConfig, results);
      } catch (sheetError) {
        console.error('Failed to log to Google Sheets:', sheetError);
        // Don't fail the whole request if Google Sheets logging fails
      }
    }

    return NextResponse.json({ success: true, results });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to send emails",
      },
      { status: 500 }
    );
  }
}
