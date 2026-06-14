export const MIN_PASSWORD_LENGTH = 6;

export const RESEND_CONFIRMATION_SUCCESS_MESSAGE =
  'אם קיימת במערכת כתובת אימייל תואמת, נשלח אליה מייל אישור.';

export function isValidEmail(email: string): boolean {
  const trimmed = email.trim();
  const at = trimmed.indexOf('@');
  return at > 0 && at < trimmed.length - 1 && !trimmed.includes(' ');
}

export type LoginFieldErrors = {
  email?: string;
  password?: string;
};

export type RegisterFieldErrors = {
  displayName?: string;
  email?: string;
  password?: string;
};

export function validateLoginFields(email: string, password: string): LoginFieldErrors {
  const errors: LoginFieldErrors = {};
  const trimmedEmail = email.trim();

  if (!trimmedEmail) {
    errors.email = 'יש להזין כתובת אימייל.';
  } else if (!isValidEmail(trimmedEmail)) {
    errors.email = 'יש להזין כתובת אימייל תקינה.';
  }

  if (!password) {
    errors.password = 'יש להזין סיסמה.';
  }

  return errors;
}

export function validateRegisterFields(
  displayName: string,
  email: string,
  password: string,
): RegisterFieldErrors {
  const errors: RegisterFieldErrors = {};
  const trimmedEmail = email.trim();
  const trimmedName = displayName.trim();

  if (!trimmedName) {
    errors.displayName = 'יש להזין שם מלא.';
  }

  if (!trimmedEmail) {
    errors.email = 'יש להזין כתובת אימייל.';
  } else if (!isValidEmail(trimmedEmail)) {
    errors.email = 'יש להזין כתובת אימייל תקינה.';
  }

  if (!password) {
    errors.password = 'יש להזין סיסמה.';
  } else if (password.length < MIN_PASSWORD_LENGTH) {
    errors.password = 'הסיסמה חייבת להכיל לפחות 6 תווים.';
  }

  return errors;
}

export function isEmailConfirmationRequired(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return false;
  }

  return (
    error.message.includes('לאשר את כתובת האימייל') ||
    error.message.includes('אשר את כתובת האימייל')
  );
}

export function hasFieldErrors<T extends Record<string, string | undefined>>(
  errors: T,
): boolean {
  return Object.values(errors).some(Boolean);
}
