import { Platform } from 'react-native';

export const normalizePhone = (phone: string) => phone.replace(/[^\d]/g, '');

export const whatsappUrl = (phone: string, message: string) =>
  `https://wa.me/${normalizePhone(phone)}?text=${encodeURIComponent(message)}`;

export const smsUrl = (phone: string, message: string) => {
  const digits = normalizePhone(phone);
  const body = encodeURIComponent(message);
  return Platform.OS === 'ios' ? `sms:${digits}&body=${body}` : `sms:${digits}?body=${body}`;
};
