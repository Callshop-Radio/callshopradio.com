// Shared open/close state for the schedule surfaces.
//
// The navbar dropdown, the landing strip and the popup must agree: opening the
// popup from the strip closes the dropdown, and a deep link opens the popup.

export type TimetableView = "day" | "week" | "month";

export function useTimetableUi() {
	const open = useState<boolean>("timetable-popup-open", () => false);
	const view = useState<TimetableView>("timetable-popup-view", () => "day");
	const day = useState<string | null>("timetable-popup-day", () => null);

	const openPopup = (nextView: TimetableView = "day", nextDay: string | null = null) => {
		view.value = nextView;
		day.value = nextDay;
		open.value = true;
	};

	const closePopup = () => {
		open.value = false;
	};

	return { open, view, day, openPopup, closePopup };
}
