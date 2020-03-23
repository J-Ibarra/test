/** The set of Contis API endpoint that we require integration with. */
export enum ContisEndpointPath {
  logIn = 'Security/login',

  addConsumers = 'Consumer/AddConsumers',
  setConsumerAsLockout = 'Consumer/SetConsumerAsLockout',
  setConsumerAsNormal = 'Consumer/SetConsumerAsNormal',
  getSpecificConsumer = 'Consumer/GetSpecificConsumer',

  unloadConsumerAccount = 'Account/UnloadConsumerAccount',
  loadConsumerAccount = 'Account/LoadConsumerAccount',
  listAccounts = 'Account/ListAccounts',
  listTransactions = 'Account/ListTransactions',
  getSpecificAccountBalance = 'Account/GetBalance',

  viewPin = 'Card/ViewPin',
  listCards = 'Card/ListCards',
  activateCard = 'Card/ActivateCard',
  validateLastFourDigits = 'Card/ValidateLast4Digit',
  setCardAsLostWithReplacement = 'Card/SetCardAsLostWithReplacement',
  setCardAsDamaged = 'Card/SetCardAsDamaged',
  setCardAsBlock = 'Card/SetCardAsBlock',
  setCardAsNormal = 'Card/SetCardAsNormal',
}
