// Numéro WhatsApp du magasin (format international, sans + ni espaces)
export const WHATSAPP_NUMBER = "213552438906";
// Numéro lisible pour SMS / appel
export const PHONE_E164 = "+213552438906";

/**
 * Ouvre WhatsApp en essayant plusieurs URL :
 *  1. Schéma natif "whatsapp://" (mobile + desktop app)
 *  2. api.whatsapp.com/send (web officiel)
 *  3. wa.me (raccourci)
 * Si tout est bloqué (extensions, réseau d'entreprise, pays), on bascule en SMS.
 */
export const openWhatsApp = (message: string, phoneOverride?: string) => {
  const text = encodeURIComponent(message);
  const phone = (phoneOverride && phoneOverride.replace(/\D/g, "")) || WHATSAPP_NUMBER;

  const candidates = [
    `https://api.whatsapp.com/send?phone=${phone}&text=${text}`,
    `https://wa.me/${phone}?text=${text}`,
  ];

  // Tente d'ouvrir l'app native d'abord (sans bloquer si absente)
  try {
    const nativeWin = window.open(`whatsapp://send?phone=${phone}&text=${text}`, "_blank");
    // Si bloqué par le navigateur (popup blocker), nativeWin sera null
    if (nativeWin) {
      // Backup: ouvre aussi la version web après 800ms si l'app native n'a pas pris la main
      setTimeout(() => {
        try { window.open(candidates[0], "_blank", "noopener,noreferrer"); } catch {}
      }, 800);
      return;
    }
  } catch {
    // ignore — on tente le web
  }

  // Essaie les URLs web
  for (const url of candidates) {
    try {
      const w = window.open(url, "_blank", "noopener,noreferrer");
      if (w) return;
    } catch {
      // continue
    }
  }

  // Fallback ultime : SMS avec le même message
  try {
    window.location.href = `sms:${PHONE_E164}?body=${text}`;
  } catch {
    // dernier recours : copier dans le presse-papier
    navigator.clipboard?.writeText(`${PHONE_E164} — ${message}`);
    alert(`WhatsApp est bloqué sur ce réseau. Contactez-nous au ${PHONE_E164}`);
  }
};
