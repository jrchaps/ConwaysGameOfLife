export interface Slider {
	el: HTMLDivElement;
	min: number;
	max: number;
	onDragCallback?: (slider: Slider, value: number) => void;
	readonly onPointerDown: (ev: PointerEvent) => void;
	readonly onPointerUp: () => void;
}

export function sliderMove(slider: Slider, value: number, pixels = false) {
	const trackWidth = slider.el.querySelector<HTMLDivElement>('.sliderTrack')!.getBoundingClientRect().width;

	if (!pixels) {
		value = ((value - slider.min) * trackWidth) / (slider.max - slider.min);
	}

	if (value <= 0) {
		value = 0;
	} else if (value >= trackWidth) {
		value = trackWidth;
	}

	const fontSize = parseFloat(window.getComputedStyle(slider.el).fontSize);
	slider.el.querySelector<HTMLElement>('.sliderThumb')!.style.left = `${value / fontSize}em`;
	slider.el.querySelector<HTMLElement>('.sliderTrackFill')!.style.width = `${value / fontSize}em`;

	return ((slider.max - slider.min) / trackWidth) * value + slider.min;
}

export function sliderEnable(el: HTMLDivElement, min: number, max: number, onDragCallback: (slider: Slider, value: number) => void) {
	el.addEventListener('pointerdown', onPointerDown);

	const slider: Slider = {
		el,
		min,
		max,
		onDragCallback,
		onPointerDown,
		onPointerUp,
	};

	function onPointerDown(ev: PointerEvent) {
		onDrag(ev);
		document.addEventListener('pointermove', onDrag);
		document.addEventListener('pointerup', onPointerUp);
		document.documentElement.classList.add('sliderDragging');
	}

	function onPointerUp() {
		document.removeEventListener('pointerup', onPointerUp);
		document.removeEventListener('pointermove', onDrag);
		document.documentElement.classList.remove('sliderDragging');
	}

	function onDrag(ev: PointerEvent) {
		const track = el.querySelector<HTMLDivElement>('.sliderTrack')!;
		const value = sliderMove(slider, ev.clientX - track.getBoundingClientRect().left, true);
		if (onDragCallback) onDragCallback(slider, value);
	}

	return slider;
}

export function sliderDisable(slider: Slider) {
	if (slider.onPointerUp) slider.onPointerUp();
	if (slider.onPointerDown) slider.el.removeEventListener('pointerdown', slider.onPointerDown);
}
