import * as bcrypt from 'bcrypt';

const saltRounds = Number(10);

export async function hashPasswordAndOtp(password: string): Promise<string> {
  const hash = await bcrypt.hash(password, saltRounds);
  return hash;
}

export async function comparePassword(
  plain: string,
  hash: string,
): Promise<boolean> {
  const compare = await bcrypt.compare(plain, hash);
  return compare;
}
