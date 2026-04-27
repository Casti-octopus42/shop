import { MessageCircle } from "lucide-react";
import { openWhatsApp } from "@/lib/whatsapp";

const DEFAULT_MESSAGE = "السلام عليكم، أريد الاستفسار عن منتجاتكم.";

const WhatsAppButton = () => {
  return (
    <button
      type="button"
      onClick={() => openWhatsApp(DEFAULT_MESSAGE)}
      aria-label="Contactez-nous sur WhatsApp"
      className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg transition-transform hover:scale-110 hover:shadow-xl"
    >
      <MessageCircle className="h-7 w-7" fill="currentColor" />
      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#25D366] opacity-30" />
    </button>
  );
};

export default WhatsAppButton;
