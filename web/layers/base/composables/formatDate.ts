export const formatDate = (
	dateObj: Date | string | number | undefined,
): string | undefined => {
	if (!dateObj) {
		console.warn("No date provided!");
		return;
	}

	const date = new Date(dateObj);

	if (isNaN(date.getTime())) {
		console.warn("Invalid date provided!");
		return;
	}

	// Formatierung für Tag, Monat und Jahr
	const day = date.toLocaleString("default", { day: "2-digit" });
	const month = date.toLocaleString("default", { month: "2-digit" });
	const year = date.toLocaleString("default", { year: "numeric" });

	return `${day}.${month}.${year}`;
};
