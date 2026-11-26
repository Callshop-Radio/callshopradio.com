// Shared open/close state for the schedule surfaces.
//
// The player panel, the landing strip and the expanded popup must agree: the
// compact panel is always one day, and expanding is a separate, explicit step.

export type TimetableView = "day" | "week" | "month";

export function useTimetableUi() {
	const open = useState<boolean>("timetable-popup-open", () => false);
	const expanded = useState<boolean>("timetable-popup-expanded", () => false);
	const view = useState<TimetableView>("timetable-popup-view", () => "day");
	const day = useState<string | null>("timetable-popup-day", () => null);

	const openPopup = (
		nextView: TimetableView = "day",
		nextDay: string | null = null,
	) => {
		view.value = nextView;
		day.value = nextDay;
		expanded.value = false;
		open.value = true;
	};

	const expand = () => {
		expanded.value = true;
	};

	const collapse = () => {
		expanded.value = false;
		view.value = "day";
	};

	const closePopup = () => {
		open.value = false;
		expanded.value = false;
	};

	return { open, expanded, view, day, openPopup, expand, collapse, closePopup };
}
