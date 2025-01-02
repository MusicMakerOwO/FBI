const PROGRESS = [' ', '⡀', '⣀', '⣄', '⣤', '⣦', '⣶', '⣷', '⣿'];

export default function ProgressBar(progress: number, max: number) {
	if (progress > max) progress = max;
	
	const percent = Math.floor((progress / max) * 100);
	const full = Math.floor(progress / max * PROGRESS.length);
	const remainder = Math.floor((progress / max * PROGRESS.length - full) * 8);
	const bar = `${PROGRESS[PROGRESS.length - 1].repeat(full)}${PROGRESS[remainder]}${' '.repeat(PROGRESS.length - full)}`;
	return `[ ${bar}] ${percent}%`;
}