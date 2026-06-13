import nodemailer from 'nodemailer';

const createTransporter = () => {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
};

/**
 * Send a password reset email with a branded HTML template.
 * @param {string} to - Recipient email address
 * @param {string} resetUrl - Full reset URL with token
 */
export const sendPasswordResetEmail = async (to, resetUrl) => {
  const transporter = createTransporter();

  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
      <title>Reset your DocMind password</title>
    </head>
    <body style="margin:0;padding:0;background-color:#0a0a0a;font-family:'Inter',Arial,sans-serif;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0a;padding:40px 0;">
        <tr>
          <td align="center">
            <table width="480" cellpadding="0" cellspacing="0" style="background:#111113;border-radius:16px;border:1px solid #222;overflow:hidden;">
              <!-- Header -->
              <tr>
                <td align="center" style="padding:40px 40px 24px;">
                  <div style="width:56px;height:56px;background:linear-gradient(135deg,#7c3aed,#4f46e5);border-radius:14px;display:inline-flex;align-items:center;justify-content:center;margin-bottom:20px;">
                    <span style="font-size:28px;">🧠</span>
                  </div>
                  <h1 style="margin:0;color:#fff;font-size:22px;font-weight:700;letter-spacing:-0.3px;">Reset your password</h1>
                  <p style="margin:8px 0 0;color:#6b7280;font-size:14px;">We received a request to reset your DocMind password.</p>
                </td>
              </tr>
              <!-- Body -->
              <tr>
                <td style="padding:0 40px 32px;">
                  <p style="color:#9ca3af;font-size:14px;line-height:1.6;margin:0 0 24px;">
                    Click the button below to choose a new password. This link expires in <strong style="color:#fff;">1 hour</strong>.
                  </p>
                  <a href="${resetUrl}" style="display:block;text-align:center;background:linear-gradient(135deg,#7c3aed,#4f46e5);color:#fff;text-decoration:none;font-weight:600;font-size:15px;padding:14px 24px;border-radius:10px;">
                    Reset Password
                  </a>
                  <p style="color:#4b5563;font-size:12px;line-height:1.6;margin:20px 0 0;">
                    If you didn't request a password reset, you can safely ignore this email. Your password will not be changed.
                  </p>
                </td>
              </tr>
              <!-- Footer -->
              <tr>
                <td style="padding:20px 40px;border-top:1px solid #1f1f1f;">
                  <p style="margin:0;color:#374151;font-size:12px;text-align:center;">
                    © ${new Date().getFullYear()} DocMind · Your documents, your AI assistant — all in one place.
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  await transporter.sendMail({
    from: `"DocMind" <${process.env.EMAIL_USER}>`,
    to,
    subject: 'Reset your DocMind password',
    html,
  });
};
