import { NextResponse } from "next/server";
import nodemailer from "nodemailer";

export async function POST(request) {
  try {
    const { recipients, template, smtpConfig, attachments } = await request.json();

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

        results.push({ email: recipient.email, status: "sent" });
      } catch (error) {
        results.push({
          email: recipient.email,
          status: "failed",
          error: error instanceof Error ? error.message : "Unknown error",
        });
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
