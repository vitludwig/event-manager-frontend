export class FullProgramConfig {
	/**
	 * Width of program n-minutes segment in px
	 */
	public static segmentWidth: number = 45;

	/**
	 * Time duration of segment in minutes
	 */
	public static segmentDuration: number = 15;

	/**
	 * Height of a single event / lane in px
	 */
	public static eventHeight: number = 65;

	/**
	 * Vertical gap between stacked lanes in px
	 */
	public static laneGap: number = 4;

	/**
	 * Vertical distance between lane tops in px (derived: eventHeight + laneGap)
	 */
	public static laneStride: number = FullProgramConfig.eventHeight + FullProgramConfig.laneGap;

	/**
	 * The minimum width of the card (px) at which tags are still displayed.
	 * Below this (typically 15min event, ~43px) the tags are hidden so that they do not overlap with the title.
	 */
	public static minTagWidthPx: number = 60;
}
