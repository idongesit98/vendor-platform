export const verificationEmailHtml = (
  firstName: string,
  otp: string,
  verificationLink: string,
): string => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Verify Your Email</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f4f5;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
          
          <!-- Header -->
        <tr>
        <td style="background:linear-gradient(135deg,#1E3A8A,#2563EB);padding:36px 40px;text-align:center;">
          <h1 style="margin:0;color:#ffffff;font-size:28px;font-weight:700;letter-spacing:-0.5px;">
            🍔 Foody
          </h1>
          <p style="margin:8px 0 0;color:rgba(255,255,255,0.85);font-size:14px;">
            Your favourite food, delivered fast
          </p>
        </td>
        </tr>

          <!-- Body -->
          <tr>
            <td style="padding:40px 40px 32px;">
              <h2 style="margin:0 0 8px;color:#18181b;font-size:22px;font-weight:600;">
                Hi ${firstName} 👋
              </h2>
              <p style="margin:0 0 28px;color:#52525b;font-size:15px;line-height:1.6;">
                Thanks for signing up! Use the OTP below to verify your email address. 
                It expires in <strong>10 minutes</strong>.
              </p>

              <!-- OTP Box -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
                <tr>
                  <td align="center" style="background:#fff7ed;border:2px dashed #9db984;border-radius:10px;padding:24px;">
                    <p style="margin:0 0 4px;color:#71717a;font-size:12px;text-transform:uppercase;letter-spacing:1.5px;font-weight:600;">
                      Your OTP Code
                    </p>
                    <p style="margin:0;color:#FF6B35;font-size:42px;font-weight:800;letter-spacing:12px;">
                      ${otp}
                    </p>
                  </td>
                </tr>
              </table>

              <!-- Divider -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
                <tr>
                  <td style="border-top:1px solid #e4e4e7;"></td>
                  <td style="padding:0 12px;color:#a1a1aa;font-size:13px;white-space:nowrap;">
                    or click below
                  </td>
                  <td style="border-top:1px solid #e4e4e7;"></td>
                </tr>
              </table>

              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
                <tr>
                  <td align="center">
                    <a href="${verificationLink}"
                      style="display:inline-block;background:linear-gradient(135deg,#FF6B35,#FF8C42);color:#ffffff;text-decoration:none;font-size:15px;font-weight:600;padding:14px 36px;border-radius:8px;letter-spacing:0.3px;">
                      ✅ Verify My Email
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin:0;color:#a1a1aa;font-size:13px;line-height:1.6;text-align:center;">
                If you didn't create an account, you can safely ignore this email.<br/>
                This link expires in <strong>10 minutes</strong>.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#fafafa;border-top:1px solid #f0f0f0;padding:20px 40px;text-align:center;">
              <p style="margin:0;color:#a1a1aa;font-size:12px;">
                © ${new Date().getFullYear()} Foody Inc. · All rights reserved
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

export const verificationVendorEmailHtml = (
  businessName: string,
  otp: string,
  verificationLink: string,
): string => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Verify Your Email</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f4f5;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 6px 28px rgba(0,0,0,0.08);">
          
          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#1E3A8A,#2563EB);padding:36px 40px;text-align:center;">
              <h1 style="margin:0;color:#ffffff;font-size:26px;font-weight:700;">
                🚀 Foody Vendor Portal
              </h1>
              <p style="margin:8px 0 0;color:rgba(255,255,255,0.85);font-size:14px;">
                Grow your business. Reach more customers.
              </p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:40px;">
              <h2 style="margin:0 0 10px;color:#111827;font-size:22px;font-weight:600;">
                Welcome, ${businessName} 👋
              </h2>

              <p style="margin:0 0 20px;color:#4b5563;font-size:15px;line-height:1.6;">
                We're excited to have you join <strong>Foody</strong> as a vendor 🎉  
                You're just one step away from accessing your dashboard and starting to receive orders.
              </p>

              <p style="margin:0 0 28px;color:#4b5563;font-size:15px;line-height:1.6;">
                Please verify your email address using the OTP below. This helps us keep your account secure.
              </p>

              <!-- OTP Box -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
                <tr>
                  <td align="center" style="background:#eff6ff;border:2px dashed #93c5fd;border-radius:10px;padding:24px;">
                    <p style="margin:0 0 6px;color:#6b7280;font-size:12px;text-transform:uppercase;letter-spacing:1.5px;font-weight:600;">
                      Verification Code
                    </p>
                    <p style="margin:0;color:#1E3A8A;font-size:40px;font-weight:800;letter-spacing:10px;">
                      ${otp}
                    </p>
                  </td>
                </tr>
              </table>

              <!-- Divider -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
                <tr>
                  <td style="border-top:1px solid #e5e7eb;"></td>
                  <td style="padding:0 12px;color:#9ca3af;font-size:13px;white-space:nowrap;">
                    or
                  </td>
                  <td style="border-top:1px solid #e5e7eb;"></td>
                </tr>
              </table>

              <!-- CTA -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
                <tr>
                  <td align="center">
                    <a href="${verificationLink}"
                      style="display:inline-block;background:linear-gradient(135deg,#1E3A8A,#2563EB);color:#ffffff;text-decoration:none;font-size:15px;font-weight:600;padding:14px 36px;border-radius:8px;">
                      Verify Email Address
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin:0;color:#6b7280;font-size:13px;line-height:1.6;text-align:center;">
                This code and link will expire in <strong>10 minutes</strong>.<br/>
                If you didn’t create a vendor account, you can safely ignore this email.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#fafafa;border-top:1px solid #f0f0f0;padding:20px 40px;text-align:center;">
              <p style="margin:0;color:#9ca3af;font-size:12px;">
                © ${new Date().getFullYear()} Foody Inc. · All rights reserved
              </p>
              <p style="margin:6px 0 0;color:#d1d5db;font-size:11px;">
                Helping vendors grow smarter, faster 🚀
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
