import './main.css';
import './favicon.svg';

// undefined = dead, 1 = alive
let gen: number[][] | undefined[][] = [];

const rows = 15;
const columns = 15;

let shape = 'cell';

let gamePlaying = false;
let msUntilStep = 0;
let msPerStep = 110;

const canvas = document.querySelector('canvas')!;
const ctx = canvas.getContext('2d')!;

let gridOn = true;
let gridRed = 255;
let gridGreen = 255;
let gridBlue = 255;
let gridAlpha = 0;
const gridAnimationDuration = 200;

let timestampPrev: number;

genInit();

canvasContextSet();
window.addEventListener('resize', canvasContextSet);

window.requestAnimationFrame(gameLoop);

function gameLoop(timestamp: number) {
	if (!timestampPrev) timestampPrev = timestamp;
	const timeDelta = timestamp - timestampPrev;

	if (gamePlaying) {
		msUntilStep -= timeDelta;
		if (msUntilStep <= 0) {
			genStep();
			msUntilStep = msPerStep;
		}
	}

	ctx.clearRect(0, 0, canvas.width, canvas.height);

	const cells = new Path2D();
	for (let i = 0; i < rows; i++) {
		for (let j = 0; j < columns; j++) {
			if (gen[i][j]) cells.rect(cellWidth() * j, cellHeight() * i, cellWidth(), cellHeight());
		}
	}
	ctx.fill(cells);

	const grid = new Path2D();
	for (let xPos = ctx.lineWidth / 2; xPos < canvas.width; xPos += (canvas.width - ctx.lineWidth) / columns) {
		grid.moveTo(xPos, 0);
		grid.lineTo(xPos, canvas.height);
	}
	for (let yPos = ctx.lineWidth / 2; yPos < canvas.height; yPos += (canvas.height - ctx.lineWidth) / rows) {
		grid.moveTo(0, yPos);
		grid.lineTo(canvas.width, yPos);
	}

	const themeDark = document.documentElement.classList.contains('themeDark');
	gridRed = animationStep(gridRed, timeDelta, gridAnimationDuration, 24, 244, themeDark);
	gridGreen = animationStep(gridGreen, timeDelta, gridAnimationDuration, 24, 244, themeDark);
	gridBlue = animationStep(gridBlue, timeDelta, gridAnimationDuration, 24, 244, themeDark);
	gridAlpha = animationStep(gridAlpha, timeDelta, gridAnimationDuration, 0, 1, gridOn);

	ctx.strokeStyle = `rgba(${gridRed},${gridGreen},${gridBlue},${gridAlpha})`;

	ctx.stroke(grid);

	timestampPrev = timestamp;

	window.requestAnimationFrame(gameLoop);
}

function genInit() {
	for (let i = 0; i < rows; i++) {
		gen[i] = [];
	}
}

function genStep() {
	let nextGen: number[][] | undefined[][] = [];
	for (let i = 0; i < rows; i++) {
		nextGen[i] = [];
		for (let j = 0; j < columns; j++) {
			const nbors = [
				[i - 1, j - 1],
				[i - 1, j],
				[i - 1, j + 1],
				[i, j - 1],
				[i, j + 1],
				[i + 1, j - 1],
				[i + 1, j],
				[i + 1, j + 1],
			];
			let nborsAlive = 0;
			for (const nbor of nbors) {
				if (gen[nbor[0]] && gen[nbor[0]][nbor[1]]) nborsAlive++;
			}

			if (nborsAlive === 3 || (gen[i][j] && nborsAlive === 2)) {
				nextGen[i][j] = 1;
			}
		}
	}
	gen = nextGen;
}

function shapesSpawn(i: number, j: number) {
	let coords: [number, number][] = [];

	if (gen[i][j]) {
		gen[i][j] = 0;
	} else if (shape === 'cell') {
		coords = [[i, j]];
	} else if (shape === 'blinker') {
		coords = [
			[i, j],
			[i - 1, j],
			[i + 1, j],
		];
	} else if (shape === 'glider') {
		coords = [
			[i, j],
			[i + 1, j + 1],
			[i + 2, j + 1],
			[i + 2, j],
			[i + 2, j - 1],
		];
	} else if (shape === 'block') {
		coords = [
			[i, j],
			[i, j + 1],
			[i + 1, j + 1],
			[i + 1, j],
		];
	}

	for (const coord of coords) {
		if (coord[0] >= 0 && coord[0] < rows && coord[1] >= 0 && coord[1] < columns) {
			gen[coord[0]][coord[1]] = 1;
		}
	}
}

function gameToggle() {
	gamePlaying = !gamePlaying;
	msUntilStep = 0;
}

const cellWidth = () => canvas.width / columns;
const cellHeight = () => canvas.height / rows;

function canvasContextSet() {
	// Use dimensions and base the canvas dimensions off those values to prevent CLS.
	// Should this be ran after the window load event? It seems sometimes the javascript is executing before CSS in Chrome.
	canvas.width = canvas.getBoundingClientRect().width;
	canvas.height = canvas.getBoundingClientRect().width;
	ctx.fillStyle = '#ff5050';
	ctx.lineWidth = 2;
}

function gridToggle() {
	gridOn = !gridOn;
}

function themeToggle() {
	document.documentElement.classList.toggle('themeDark');
}

function animationStep(value: number, timeElapsed: number, animationDuration: number, from: number, to: number, stepForward = true) {
	if (stepForward) {
		return Math.min(value + (timeElapsed / animationDuration) * (to - from), to);
	} else {
		return Math.max(value - (timeElapsed / animationDuration) * (to - from), from);
	}
}

//Canvas interation

canvas.addEventListener('click', canvasOnClick);
function canvasOnClick(ev: MouseEvent) {
	const i = Math.floor((ev.clientY - canvas.getBoundingClientRect().top) / cellHeight());
	const j = Math.floor((ev.clientX - canvas.getBoundingClientRect().left) / cellWidth());
	shapesSpawn(i, j);
}

// Shape buttons

for (const btn of document.querySelectorAll<HTMLButtonElement>('.btnShape')) {
	btn.addEventListener('click', shapeButtonOnClick);
}
function shapeButtonOnClick(this: HTMLButtonElement) {
	document.querySelector<HTMLButtonElement>(`#${shape}`)!.classList.remove('selected');
	this.classList.add('selected');
	shape = this.id;
}

//Game Controls

document.querySelector<HTMLButtonElement>('#btnPlay')!.addEventListener('click', playButtonOnClick);
function playButtonOnClick(this: HTMLButtonElement) {
	if (this.innerText === 'PLAY') {
		this.innerText = 'PAUSE';
	} else {
		this.innerText = 'PLAY';
	}
	gameToggle();
}

document.querySelector<HTMLButtonElement>('#btnStep')!.addEventListener('click', genStep);
document.querySelector<HTMLButtonElement>('#btnClear')!.addEventListener('click', genInit);

//Switches

for (const swtch of document.querySelectorAll<HTMLDivElement>('.switch')) {
	swtch.addEventListener('click', switchOnClick);
}
function switchOnClick(this: HTMLDivElement) {
	this.classList.toggle('on');
}

document.querySelector<HTMLDivElement>('#switchTheme')!.addEventListener('click', themeToggle);
document.querySelector<HTMLDivElement>('#switchGrid')!.addEventListener('click', gridToggle);

import { Slider, sliderEnable, sliderMove } from './slider';

const sliderEl = document.querySelector<HTMLDivElement>('#sliderSpeed')!;

function sliderOnDrag(slider: Slider, sliderValue: number) {
	const value = slider.max + slider.min - Math.round(sliderValue);
	msPerStep = value;
	input.value = `${value}`;
}

const slider = sliderEnable(sliderEl, 20, 200, sliderOnDrag);

const input = document.querySelector<HTMLInputElement>('#input')!;
input.addEventListener('input', function () {
	const value = parseFloat(this.value);
	if (!Number.isNaN(value)) {
		msPerStep = value;
		sliderMove(slider, slider.max + slider.min - value);
	}
});
