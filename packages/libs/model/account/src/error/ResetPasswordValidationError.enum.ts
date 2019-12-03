export enum ResetPasswordValidationError {
  userInvalid = 'Invalid user id',
  tokenInvalid = 'Invalid token',
  passwordNotMatch = 'The two passwords provided do not match',
  passwordNotStrength = 'The password must have a minimum of 12 characters',
}
