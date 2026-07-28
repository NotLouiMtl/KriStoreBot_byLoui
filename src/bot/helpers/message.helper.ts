function formatDate(date: Date): string {
  const d = date.getDate().toString().padStart(2, '0');
  const m = (date.getMonth() + 1).toString().padStart(2, '0');
  const y = date.getFullYear();
  return `${d}/${m}/${y}`;
}

function buildDeliveryMessage(opts: {
  serviceName: string;
  type: 'full' | 'profile';
  email: string;
  password: string;
  pin?: string | null;
  profileNumber?: number;
  daysRemaining: number;
}): string {
  const { serviceName, type, email, password, pin, profileNumber, daysRemaining } = opts;

  const typeLabel = type === 'full' ? 'Cuenta completa' : 'Perfil';
  const today = new Date();
  const expiry = new Date(today);
  expiry.setDate(expiry.getDate() + daysRemaining);

  const lines = [
    '🌸🍡 MOCHI SHOP 🍡🌸',
    `💜✨ (${serviceName} - ${typeLabel}) ✨💜`,
    '',
    `📧 Correo: ${email}`,
    `🔐 Contraseña: ${password}`,
  ];

  if (pin) {
    lines.push(`🔐 PIN: ${pin}`);
  }

  if (type === 'profile' && profileNumber) {
    lines.push(`👤 Perfil #${profileNumber}`);
  }

  lines.push('');
  lines.push(`📅 Entrega:`);
  lines.push(`🌸 ${formatDate(today)}`);
  lines.push('');
  lines.push(`⏳ Expira:`);
  lines.push(`💖 ${formatDate(expiry)}`);
  lines.push('');
  lines.push('🩷 ¡Gracias por tu compra!');
  lines.push('🍓 Cualquier duda, estamos para ayudarte. ✨');

  return lines.join('\n');
}

export function formatFullPurchaseMessage(opts: {
  serviceName: string;
  email: string;
  password: string;
  pin?: string | null;
  daysRemaining: number;
}): string {
  return buildDeliveryMessage({ ...opts, type: 'full' });
}

export function formatProfilePurchaseMessage(opts: {
  serviceName: string;
  email: string;
  password: string;
  pin?: string | null;
  accountPin?: string | null;
  profileNumber: number;
  daysRemaining: number;
}): string {
  const { pin, accountPin, ...rest } = opts;
  return buildDeliveryMessage({ ...rest, type: 'profile', pin: pin || accountPin || null });
}
