import twilio from 'twilio';

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;

let twilioClient: twilio.Twilio | null = null;

// Initialize Twilio client only if valid credentials are provided
if (accountSid && authToken && accountSid.startsWith('AC')) {
  twilioClient = twilio(accountSid, authToken);
}

export const sendVerificationCode = async (
  phoneNumber: string, 
  code: string
): Promise<boolean> => {
  try {
    if (!twilioClient) {
      console.log(`[DEV MODE] SMS would be sent to ${phoneNumber}: Your Linkup verification code is ${code}`);
      return true; // Return success in development mode
    }

    const message = await twilioClient.messages.create({
      body: `Your Linkup verification code is ${code}`,
      from: twilioPhoneNumber,
      to: phoneNumber
    });

    console.log(`SMS sent successfully: ${message.sid}`);
    return true;
  } catch (error) {
    console.error('Error sending SMS:', error);
    return false;
  }
};

export const generateVerificationCode = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};