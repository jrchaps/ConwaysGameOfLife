import './main.scss'
import './Glider.png'

/*
	If you are used to libraries like React, Angular, Vue, ect. then this code will probably look unfamiliar/weird.
	HTML is written in a separate file.

	The basic structure of this file is written as:
		- Program state/DOM elements
		- Element event handlers
		- Main update function
		- Utility functions

	The DOM isn't updated directly by event handlers. Instead, event handlers generally change state values, 
	then the update occurs in the update function. This is similar in concept to how React updates the DOM. 
	I think there are benefits to doing it this way. The difference is that there's no additional library 
	required for this approach, I'm simply using built in browser API's. Also, It's very clear how the updates
	actually occur, and the programmer has full control over how it's done.
*/

/*
	TODO:
		Fix bug when entering a non-number into the input causes the game to pause, but then entering a number doesn't resume the game
*/

type Btn = HTMLButtonElement
type Div = HTMLDivElement
type Input = HTMLInputElement
type Canvas = HTMLCanvasElement
let { documentElement, body } = document
let { pow, floor, round, min } = Math

interface v2 { x: number, y: number }

interface Shape {
	btn: Btn
	v2s: v2[]
}

const cell = {
	btn: elSelect<Btn>('#cellBtn'),
	v2s: []
}

const blinker = {
	btn: elSelect<Btn>('#blinkerBtn'),
	v2s: [
		{ x: 0, y: -1 }, { x: 0, y: 1 }
	]
}

const glider = {
	btn: elSelect<Btn>('#gliderBtn'),
	v2s: [
		{ x: 1, y: 1 }, { x: 1, y: 2 },
		{ x: 0, y: 2 }, { x: -1, y: 2 }
	]
}

const block = {
	btn: elSelect<Btn>('#blockBtn'),
	v2s: [
		{ x: 1, y: 0 }, { x: 1, y: 1 },
		{ x: 0, y: 1 }
	]
}

const shapes = [cell, blinker, glider, block]

const canvas = elSelect<Canvas>('canvas')
const ctx = canvas.getContext('2d')!

const themeSwitch = elSelect<Div>('#themeSwitch')
const gridSwitch = elSelect<Div>('#gridSwitch')

const playBtn = elSelect<Btn>('#playBtn')
const stepBtn = elSelect<Btn>('#stepBtn')
const clearBtn = elSelect<Btn>('#clearBtn')

const speedSlider = {
	rootEl: elSelect<Div>('#speedSlider'),
	track: elSelect<Div>('#speedSlider > div:nth-of-type(1)'),
	trackFill: elSelect<Div>('#speedSlider > div:nth-of-type(1) div'),
	thumb: elSelect<Div>('#speedSlider > div:nth-of-type(2)'),
	from: 200,
	to: 10,
	engaged: false,
}

const speedInput = elSelect<Input>('#speedInput')

const n = 15 // Square matrix side length.
const gen = {
	cells: arrayInit(pow(n, 2), false),
	n
}

const cellNeighbors = [
	{ x: -1, y: -1 }, { x: 0, y: -1 },
	{ x: 1, y: -1 }, { x: -1, y: 0 },
	{ x: 1, y: 0 }, { x: -1, y: 1 },
	{ x: 0, y: 1 }, { x: 1, y: 1 },
]

let pointerEv: PointerEvent

let shape: Shape = cell

let paused = true
let wasPaused = paused

// All time values are milliseconds by default.
// Save the timestamp from the previous frame to calculate the time delta between frames.
let timestampPrev = 0
let tPerNewGen = floor((speedSlider.from + speedSlider.to) / 2)
let tUntilNewGen = tPerNewGen

let themeDark = true
let gridOn = true

// Event handlers
onpointermove = (ev) => { pointerEv = ev }
onpointerup = () => { speedSlider.engaged = false }

themeSwitch.onclick = () => { themeDark = !themeDark }
gridSwitch.onclick = () => { gridOn = !gridOn }

cell.btn.onclick = () => { shape = cell }
blinker.btn.onclick = () => { shape = blinker }
glider.btn.onclick = () => { shape = glider }
block.btn.onclick = () => { shape = block }

playBtn.onclick = () => { paused = !paused }
stepBtn.onclick = () => { tUntilNewGen = 0 }
clearBtn.onclick = () => { gen.cells = arrayInit(pow(gen.n, 2), false) }

speedSlider.rootEl.onpointerdown = () => { speedSlider.engaged = true }
speedInput.oninput = () => { tPerNewGen = parseFloat(speedInput.value) }

canvas.onclick = (ev) => {
	const { cells, n } = gen
	let origin = {
		x: floor(xOffset(ev, canvas) * n / canvas.width),
		y: floor(yOffset(ev, canvas) * n / canvas.height),
	}
	let i = v2ToIndex(origin, n)
	cells[i] = !cells[i]
	if (cells[i]) {
		for (let v2 of shape.v2s) {
			v2 = v2Add(v2, origin)
			if (v2InBounds(v2, n)) cells[v2ToIndex(v2, n)] = true
		}
	}
}

function update(timestamp: number) {
	if (!timestampPrev) timestampPrev = timestamp
	const tDelta = timestamp - timestampPrev
	timestampPrev = timestamp

	// Text content is intentionally used here for multiple reasons. For one, it prevents re-flow.
	// https://developer.mozilla.org/en-US/docs/Web/API/Node/textContent#differences_from_innertext
	if (!paused) {
		if (paused !== wasPaused) {
			wasPaused = paused
			tUntilNewGen = 0
		} else tUntilNewGen -= tDelta
		playBtn.textContent = 'PAUSE'
	} else playBtn.textContent = 'PLAY'

	// Another way to do this is to have a previous shape value, and check if it has changed.
	for (let s of shapes) {
		if (s !== shape) classRemove(s.btn, 'selected')
		else classInsert(shape.btn, 'selected')
	}

	{
		// Update slider
		let { rootEl, track, trackFill, thumb,
			to, from, engaged } = speedSlider
		let { width } = track.getBoundingClientRect()
		let offset: number

		if (engaged) {
			classInsert(body, 'sliderEngaged')
			offset = clamp(xOffset(pointerEv, track), 0, width)
			tPerNewGen = round((to - from) / width * offset + from)
		} else {
			classRemove(body, 'sliderEngaged')
			offset = width / (to - from) * (tPerNewGen - from)
			offset = clamp(offset, 0, width)
		}

		let em = `${offset / parseFloat(getComputedStyle(rootEl).fontSize)}em`
		thumb.style.left = em; trackFill.style.width = em
	}

	if (Number.isNaN(tPerNewGen)) speedInput.value = ''
	else speedInput.value = `${tPerNewGen}`

	const { cells, n } = gen
	// Create a new generation of cells
	let genNew: boolean[] = []
	for (let i = 0; i < cells.length; i++) {
		let origin = indexToV2(i, n)
		let alive = 0
		for (let v2 of cellNeighbors) {
			v2 = v2Add(v2, origin)
			if (v2InBounds(v2, n) && cells[v2ToIndex(v2, n)]) alive++
		}
		if (alive === 3 || (cells[i] && alive === 2)) genNew[i] = true
		else genNew[i] = false
	}

	if (tUntilNewGen <= 0) {
		tUntilNewGen = tPerNewGen
		gen.cells = genNew
	}

	canvas.width = min(body.getBoundingClientRect().width, 602)
	canvas.height = canvas.width

	ctx.clearRect(0, 0, canvas.width, canvas.height)

	ctx.lineWidth = 1
	ctx.fillStyle = 'rgba(255, 102, 103, 1)'

	{
		let alpha = 1
		let grey = 244

		if (gridOn) {
			classInsert(gridSwitch, 'on')
		} else {
			classRemove(gridSwitch, 'on')
			alpha = 0
		}
		if (themeDark) {
			classInsert(documentElement, 'themeDark')
			classInsert(themeSwitch, 'on')
		} else {
			classRemove(documentElement, 'themeDark')
			classRemove(themeSwitch, 'on')
			grey = 24
		}

		ctx.strokeStyle = `rgba(${grey},${grey},${grey},${alpha})`
	}

	const { lineWidth } = ctx
	let cellLength = floor((canvas.width - ctx.lineWidth * 2) / n)
	let boardLength = cellLength * n + ctx.lineWidth * 2
	let boardOrigin = floor((canvas.width - boardLength) / 2)

	ctx.save()
	ctx.translate(boardOrigin, boardOrigin)
	// Draw border
	rectStroke(ctx, v2Init(lineWidth / 2), boardLength - lineWidth)
	// Draw cells
	for (let i = 0; i < cells.length; i++) {
		let v2 = indexToV2(i, n)
		v2 = v2Scale(v2, cellLength)
		v2 = v2Add(v2, v2Init(lineWidth))
		if (cells[i]) rectFill(ctx, v2, cellLength)
		v2 = v2Add(v2, v2Init(lineWidth / 2))
		rectStroke(ctx, v2, cellLength - lineWidth)
	}
	ctx.restore()

	requestAnimationFrame(update)
}

function arrayInit<T>(length: number, value: T) {
	let arr = []
	for (let i = 0; i < length; i++) arr[i] = value
	return arr
}

function clamp(value: number, min: number, max: number) {
	if (value < min) return min
	if (value > max) return max
	return value
}

function v2Init(x: number, y = x) {
	return { x, y }
}

function v2Add(a: v2, b: v2) {
	return { x: a.x + b.x, y: a.y + b.y }
}

function v2Scale({ x, y }: v2, scalar: number) {
	return { x: x * scalar, y: y * scalar }
}

function v2InBounds({ x, y }: v2, cols: number, rows = cols) {
	return (x >= 0 && x < cols && y >= 0 && y < rows)
}

function v2ToIndex({ x, y }: v2, cols: number) {
	return cols * y + x
}

function indexToV2(i: number, cols: number) {
	return { x: i % cols, y: floor(i / cols) }
}

function xOffset(ev: MouseEvent, el: HTMLElement): number {
	return ev.clientX - el.getBoundingClientRect().x
}

function yOffset(ev: MouseEvent, el: HTMLElement): number {
	return ev.clientY - el.getBoundingClientRect().y
}

function elSelect<T extends Element>(selector: string, node: ParentNode = document) {
	return node.querySelector<T>(selector)!
}

function rectFill(ctx: CanvasRenderingContext2D, { x, y }: v2, width: number, height = width) {
	ctx.fillRect(x, y, width, height)
}

function rectStroke(ctx: CanvasRenderingContext2D, { x, y }: v2, width: number, height = width) {
	ctx.strokeRect(x, y, width, height)
}

function classInsert(el: Element, clss: string) {
	el.classList.add(clss)
}

function classRemove(el: Element, clss: string) {
	el.classList.remove(clss)
}

requestAnimationFrame(update)