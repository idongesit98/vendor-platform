export const verifyLinkHtml = (link: string, email: string) => `
  <p>Hello,</p>
  <p>We received a login request for ${email}.</p>
  <p>Click the link below to continue:</p>
  <p><a href="${link}">${link}</a></p>
  <p>This link expires in 10 minutes.</p>`;

export const verifyLinkText = (link: string, email: string) => `
Hello,We received a login request for ${email}.Use this link to continue (expires in 10 minutes):${link}`;
