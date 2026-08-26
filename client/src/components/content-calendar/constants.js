export const PLATFORM_OPTIONS = [
  {
    value: "facebook",
    label: "Facebook",
    icon: "thumb_up",
    logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b9/2023_Facebook_icon.svg/1280px-2023_Facebook_icon.svg.png",
    className: "text-blue-700 bg-blue-50 border-blue-200",
  },
  {
    value: "instagram",
    label: "Instagram",
    icon: "photo_camera",
    logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/95/Instagram_logo_2022.svg/960px-Instagram_logo_2022.svg.png",
    className: "text-pink-700 bg-pink-50 border-pink-200",
  },
  {
    value: "linkedin",
    label: "LinkedIn",
    icon: "work",
    logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f7/Linkedin-brands-solid.svg/960px-Linkedin-brands-solid.svg.png",
    className: "text-sky-700 bg-sky-50 border-sky-200",
  },
  {
    value: "youtube",
    label: "YouTube",
    icon: "smart_display",
    logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/f/fd/YouTube_full-color_icon_%282024%29.svg/960px-YouTube_full-color_icon_%282024%29.svg.png",
    className: "text-red-700 bg-red-50 border-red-200",
  },
  {
    value: "gmb",
    label: "GMB",
    icon: "location_on",
    logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/aa/Google_Maps_icon_%282020%29.svg/960px-Google_Maps_icon_%282020%29.svg.png",
    className: "text-emerald-700 bg-emerald-50 border-emerald-200",
  },
];

export const getPlatformMeta = (value) =>
  PLATFORM_OPTIONS.find((p) => p.value === value) || { value, label: value, icon: "public", logo: null, className: "text-gray-700 bg-gray-100 border-gray-200" };

// Parse a DATEONLY string ("2026-08-26") without timezone drift.
export const parseDateOnly = (dateStr) => {
  if (!dateStr) return null;
  const [year, month, day] = dateStr.split("-").map(Number);
  if (!year || !month || !day) return null;
  return new Date(year, month - 1, day);
};

export const getWeekDay = (dateStr) => {
  const date = parseDateOnly(dateStr);
  if (!date) return "";
  return date.toLocaleDateString("en-US", { weekday: "long" });
};

export const formatDateDisplay = (dateStr) => {
  const date = parseDateOnly(dateStr);
  if (!date) return "";
  return date.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
};
