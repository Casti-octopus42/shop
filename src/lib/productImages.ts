import heroImage from "@/assets/hero-sweets.jpg";
import baklavaImg from "@/assets/baklava.jpg";
import makroudImg from "@/assets/makroud.jpg";
import kalbImg from "@/assets/kalb-el-louz.jpg";
import samsaImg from "@/assets/samsa.jpg";

// Map seeded local image paths to bundled imports so legacy seed URLs still render
const localImageMap: Record<string, string> = {
  "/src/assets/hero-sweets.jpg": heroImage,
  "/src/assets/baklava.jpg": baklavaImg,
  "/src/assets/makroud.jpg": makroudImg,
  "/src/assets/kalb-el-louz.jpg": kalbImg,
  "/src/assets/ghribia.jpg": new URL("../assets/ghribia.jpg", import.meta.url).href,
  "/src/assets/samsa.jpg": samsaImg,
};

export const resolveImg = (url: string) => localImageMap[url] || url;
