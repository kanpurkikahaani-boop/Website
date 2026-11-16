/** Suggested multi-city routes from Kanpur (shown on /nearby; open in the trip planner). */
export const circuits: { name: string; route: string; days: string; cities: string[]; body: string }[] = [
  { name: "Nawabi Weekend", route: "Kanpur → Lucknow", days: "2 days", cities: ["lucknow"], body: "Kebabs, imambaras and chikankari — the easiest getaway, by intercity train or a quick highway drive." },
  { name: "Spiritual Ganga Trail", route: "Kanpur → Prayagraj → Varanasi", days: "4–5 days", cities: ["prayagraj", "varanasi"], body: "Follow the river from the Sangam to the ghats of Kashi, with aartis at both ends." },
  { name: "Ram Path", route: "Kanpur → Lucknow → Ayodhya", days: "3 days", cities: ["lucknow", "ayodhya"], body: "A Nawabi stopover, then on to the new Ram Mandir and evening aarti on the Saryu." },
  { name: "Mughal Detour", route: "Kanpur → Agra", days: "2 days", cities: ["agra"], body: "Sunrise at the Taj Mahal, an afternoon at Agra Fort and sunset from Mehtab Bagh." },
];
