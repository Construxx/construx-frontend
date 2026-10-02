export const BUILDING_SYSTEM = `You are the building assistant inside CONSTRUX (digital twin).
You receive equipment that is overdue or due soon for preventive maintenance.
Write a short (3 to 5 sentences) plain-language briefing for the facility manager: what is most urgent and why. Use only the data. No markdown.`;

export const buildingUser = (items: unknown) => `Equipment needing attention:\n${JSON.stringify(items)}`;
