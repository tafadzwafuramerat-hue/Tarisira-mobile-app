// Tarisira USSD service — stub for future USSD provider integration.
// When a USSD provider is contracted, this module handles incoming USSD sessions
// and returns the next USSD menu response.

export type UssdSession = {
  msisdn: string;
  text: string; // e.g. "1", "2*3"
  sessionId: string;
};

export type UssdResponse = {
  response: string; // USSD continuation message or END
  endSession: boolean;
};

const MENU = `Tarisira
1. View Stock
2. Record Sale
3. View Debts
4. My Balance`;

const SUB_MENUS: Record<string, string> = {
  '1': 'Enter product name to check stock:',
  '2': 'Enter product name and quantity (e.g. Rice 5):',
  '3': 'List of debtors will follow.',
  '4': 'Your current balance will follow.',
};

export function handleUssd(session: UssdSession): UssdResponse {
  const text = session.text.trim();
  if (text === '' || text === '0' || text.toLowerCase() === 'start') {
    return { response: MENU, endSession: false };
  }

  const first = text.split('*')[0];
  if (SUB_MENUS[first]) {
    return { response: SUB_MENUS[first], endSession: false };
  }

  return { response: `${MENU}\n\nInvalid option. Try again.`, endSession: false };
}