import * as argon2 from 'argon2';

//const saltRounds = Number(10);

export async function hashPasswordAndOtp(password: string): Promise<string> {
  const hash = await argon2.hash(password);
  return hash;
}

export async function comparePassword(
  plain: string,
  hash: string,
): Promise<boolean> {
  const compare = await argon2.verify(hash, plain);
  return compare;
}
