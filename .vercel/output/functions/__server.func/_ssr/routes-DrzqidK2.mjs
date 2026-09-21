import { i as __toESM } from "../_runtime.mjs";
import { L as require_react, v as require_jsx_runtime } from "../_libs/@tanstack/react-router+[...].mjs";
import { i as BookOpen, n as Volume2, t as VolumeX } from "../_libs/lucide-react.mjs";
import { n as clsx, t as cva } from "../_libs/class-variance-authority+clsx.mjs";
import { t as twMerge } from "../_libs/tailwind-merge.mjs";
import { t as create } from "../_libs/zustand.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/routes-DrzqidK2.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function cn(...inputs) {
	return twMerge(clsx(inputs));
}
function formatMoney(n) {
	const formatted = Math.abs(n).toLocaleString("en-US");
	if (n < 0) return `-$${formatted}`;
	return `$${formatted}`;
}
var buttonVariants = cva("inline-flex items-center justify-center gap-2 font-medium transition-[opacity,transform,background-color] duration-150 ease-out active:not-disabled:scale-[0.96] disabled:opacity-40 disabled:pointer-events-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-line", {
	variants: {
		variant: {
			primary: "bg-cream text-ink hover:opacity-90",
			rail: "bg-rail-light text-cream border border-cream/15 hover:border-cream/30",
			ghost: "bg-transparent text-cream/80 hover:text-cream hover:bg-cream/5",
			shoot: "bg-line text-ink font-table tracking-widest uppercase hover:opacity-90"
		},
		size: {
			sm: "h-9 px-3 text-sm rounded-[8px]",
			md: "h-11 px-4 text-sm rounded-[10px]",
			lg: "h-12 px-5 text-base rounded-[12px]",
			icon: "size-11 rounded-[10px]"
		}
	},
	defaultVariants: {
		variant: "primary",
		size: "md"
	}
});
function Button({ className, variant, size, ...props }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
		className: cn(buttonVariants({
			variant,
			size
		}), className),
		...props
	});
}
var STARTING_BANKROLL = 1e3;
var CHIP_VALUES = [
	1,
	5,
	25,
	100,
	500
];
function randDie() {
	const buf = /* @__PURE__ */ new Uint32Array(1);
	crypto.getRandomValues(buf);
	return buf[0] % 6 + 1;
}
function rollDice() {
	return [
		randDie(),
		randDie(),
		randDie()
	];
}
function readHand(dice) {
	const s = [...dice].sort((a, b) => a - b);
	if (s[0] === 4 && s[1] === 5 && s[2] === 6) return { kind: "seeLo" };
	if (s[0] === 1 && s[1] === 2 && s[2] === 3) return { kind: "aceDeuce" };
	if (s[0] === s[1] && s[1] === s[2]) return {
		kind: "trips",
		n: s[0]
	};
	if (s[0] === s[1]) return {
		kind: "point",
		n: s[2]
	};
	if (s[1] === s[2]) return {
		kind: "point",
		n: s[0]
	};
	return { kind: "junk" };
}
function rank(hand) {
	switch (hand.kind) {
		case "junk": return 0;
		case "aceDeuce": return 1;
		case "point": return 10 + hand.n;
		case "trips": return 20 + hand.n;
		case "seeLo": return 40;
	}
}
function compare(a, b) {
	const ra = rank(a);
	const rb = rank(b);
	if (ra > rb) return "a";
	if (rb > ra) return "b";
	return "push";
}
function handLine(who, hand) {
	switch (hand.kind) {
		case "seeLo": return `${who} hits 4-5-6. That's the window.`;
		case "aceDeuce": return `${who} rolls 1-2-3. Dead on the curb.`;
		case "trips": return `${who} trips ${hand.n}s.`;
		case "point": return `${who} shows a ${hand.n}.`;
		case "junk": return `${who} got nothing. Pick 'em up.`;
	}
}
function handShort(hand) {
	switch (hand.kind) {
		case "seeLo": return "4-5-6";
		case "aceDeuce": return "1-2-3";
		case "trips": return `trips ${hand.n}`;
		case "point": return `point ${hand.n}`;
		case "junk": return "nothing";
	}
}
var ctx = null;
var master = null;
var sfx = null;
var unlocked = false;
function ensure() {
	if (typeof window === "undefined") return null;
	if (!ctx) {
		const AC = window.AudioContext || window.webkitAudioContext;
		if (!AC) return null;
		ctx = new AC({ latencyHint: "interactive" });
		master = ctx.createGain();
		sfx = ctx.createGain();
		sfx.gain.value = .7;
		master.gain.value = .85;
		sfx.connect(master);
		master.connect(ctx.destination);
	}
	return ctx;
}
function unlockAudio() {
	const audio = ensure();
	if (!audio) return;
	if (audio.state === "suspended") audio.resume();
	unlocked = true;
}
function setMuted(muted) {
	const audio = ensure();
	if (!audio || !master) return;
	master.gain.setTargetAtTime(muted ? 0 : .85, audio.currentTime, .02);
}
function bus() {
	const audio = ensure();
	if (!audio || !sfx || !unlocked) return null;
	if (audio.state === "suspended") audio.resume();
	return {
		audio,
		sfx
	};
}
function noiseBuffer(audio, seconds) {
	const rate = audio.sampleRate;
	const length = Math.floor(rate * seconds);
	const buffer = audio.createBuffer(1, length, rate);
	const data = buffer.getChannelData(0);
	for (let i = 0; i < length; i++) data[i] = Math.random() * 2 - 1;
	return buffer;
}
function playDice() {
	const nodes = bus();
	if (!nodes) return;
	const { audio, sfx } = nodes;
	const src = audio.createBufferSource();
	src.buffer = noiseBuffer(audio, .35);
	src.playbackRate.value = .8 + Math.random() * .4;
	const filter = audio.createBiquadFilter();
	filter.type = "bandpass";
	filter.frequency.value = 1200;
	filter.Q.value = .7;
	const gain = audio.createGain();
	gain.gain.setValueAtTime(1e-4, audio.currentTime);
	gain.gain.exponentialRampToValueAtTime(.45, audio.currentTime + .02);
	gain.gain.exponentialRampToValueAtTime(1e-4, audio.currentTime + .38);
	src.connect(filter);
	filter.connect(gain);
	gain.connect(sfx);
	src.start();
	for (let i = 0; i < 4; i++) {
		const click = audio.createOscillator();
		const cg = audio.createGain();
		click.type = "square";
		click.frequency.value = 180 + Math.random() * 90;
		const t = audio.currentTime + .04 * i;
		cg.gain.setValueAtTime(1e-4, t);
		cg.gain.exponentialRampToValueAtTime(.12, t + .005);
		cg.gain.exponentialRampToValueAtTime(1e-4, t + .04);
		click.connect(cg);
		cg.connect(sfx);
		click.start(t);
		click.stop(t + .05);
	}
}
function playWin() {
	const nodes = bus();
	if (!nodes) return;
	const { audio, sfx } = nodes;
	[
		523.25,
		659.25,
		783.99
	].forEach((freq, i) => {
		const osc = audio.createOscillator();
		const gain = audio.createGain();
		osc.type = "sine";
		osc.frequency.value = freq;
		const t = audio.currentTime + i * .07;
		gain.gain.setValueAtTime(1e-4, t);
		gain.gain.exponentialRampToValueAtTime(.16, t + .02);
		gain.gain.exponentialRampToValueAtTime(1e-4, t + .28);
		osc.connect(gain);
		gain.connect(sfx);
		osc.start(t);
		osc.stop(t + .3);
	});
}
function playLose() {
	const nodes = bus();
	if (!nodes) return;
	const { audio, sfx } = nodes;
	const osc = audio.createOscillator();
	const gain = audio.createGain();
	osc.type = "sawtooth";
	osc.frequency.setValueAtTime(140, audio.currentTime);
	osc.frequency.exponentialRampToValueAtTime(70, audio.currentTime + .28);
	gain.gain.setValueAtTime(1e-4, audio.currentTime);
	gain.gain.exponentialRampToValueAtTime(.14, audio.currentTime + .02);
	gain.gain.exponentialRampToValueAtTime(1e-4, audio.currentTime + .32);
	osc.connect(gain);
	gain.connect(sfx);
	osc.start();
	osc.stop(audio.currentTime + .34);
}
if (typeof window !== "undefined") document.addEventListener("visibilitychange", () => {
	if (document.visibilityState === "visible" && ctx?.state === "suspended") ctx.resume();
});
var SAVE_KEY = "white-stoop-v1";
function loadSaved() {
	if (typeof window === "undefined") return null;
	try {
		const raw = localStorage.getItem(SAVE_KEY);
		return raw ? JSON.parse(raw) : null;
	} catch {
		return null;
	}
}
function persist(s) {
	if (typeof window === "undefined") return;
	localStorage.setItem(SAVE_KEY, JSON.stringify(s));
}
var calTimer = 0;
var nedTimer = 0;
var useGame = create((set, get) => ({
	seated: false,
	bankroll: STARTING_BANKROLL,
	nedBank: STARTING_BANKROLL,
	bet: 0,
	selectedChip: 25,
	phase: "betting",
	clip: "idle",
	clipNonce: 0,
	rolling: false,
	dice: null,
	calHand: null,
	nedHand: null,
	line: "Cal's mustard. Ned's the cap. Dice in the middle.",
	muted: false,
	showRules: false,
	hydrate: () => {
		const saved = loadSaved();
		if (!saved) return;
		set({
			bankroll: saved.bankroll,
			nedBank: saved.nedBank,
			muted: saved.muted
		});
		setMuted(saved.muted);
	},
	sitDown: () => {
		unlockAudio();
		const saved = loadSaved();
		set({
			seated: true,
			clip: "idle",
			clipNonce: get().clipNonce + 1,
			bankroll: saved?.bankroll ?? 1e3,
			nedBank: saved?.nedBank ?? 1e3,
			line: "Put something down. Cal shoots first."
		});
	},
	setChip: (n) => set({ selectedChip: n }),
	addChip: () => {
		const s = get();
		if (s.phase !== "betting" || s.rolling) return;
		if (s.selectedChip > s.bankroll) {
			set({ line: "Cal's short. Smaller chip." });
			return;
		}
		if (s.bet + s.selectedChip > s.nedBank) {
			set({ line: "Ned can't cover that." });
			return;
		}
		unlockAudio();
		set({
			bankroll: s.bankroll - s.selectedChip,
			bet: s.bet + s.selectedChip
		});
		persist({
			bankroll: get().bankroll,
			nedBank: get().nedBank,
			muted: get().muted
		});
	},
	clearBet: () => {
		const s = get();
		if (s.phase !== "betting" || s.bet <= 0) return;
		set({
			bankroll: s.bankroll + s.bet,
			bet: 0
		});
		persist({
			bankroll: get().bankroll,
			nedBank: get().nedBank,
			muted: get().muted
		});
	},
	shoot: () => {
		const s = get();
		if (s.phase !== "betting" || s.bet <= 0 || s.rolling) return;
		unlockAudio();
		window.clearTimeout(calTimer);
		window.clearTimeout(nedTimer);
		throwFor("cal", get, set);
	},
	nextRound: () => {
		if (get().phase !== "settle") return;
		set({
			phase: "betting",
			dice: null,
			calHand: null,
			nedHand: null,
			clip: "idle",
			clipNonce: get().clipNonce + 1,
			line: "Again. Cal's the shooter."
		});
	},
	clipEnded: () => {
		if (get().clip !== "idle") set({ clip: "idle" });
	},
	toggleMute: () => {
		const muted = !get().muted;
		set({ muted });
		setMuted(muted);
		persist({
			bankroll: get().bankroll,
			nedBank: get().nedBank,
			muted
		});
	},
	toggleRules: () => set({ showRules: !get().showRules }),
	rebuy: () => {
		set({
			bankroll: STARTING_BANKROLL,
			nedBank: STARTING_BANKROLL,
			bet: 0,
			phase: "betting",
			line: "Both pockets restuffed. Don't waste it."
		});
		persist({
			bankroll: STARTING_BANKROLL,
			nedBank: STARTING_BANKROLL,
			muted: get().muted
		});
	}
}));
function throwFor(who, get, set) {
	playDice();
	set({
		phase: who,
		clip: who,
		clipNonce: get().clipNonce + 1,
		rolling: true,
		line: who === "cal" ? "Cal shoots." : "Ned answers."
	});
	const timer = window.setTimeout(() => {
		const dice = rollDice();
		const hand = readHand(dice);
		set({
			dice,
			rolling: false,
			line: handLine(who === "cal" ? "Cal" : "Ned", hand)
		});
		if (hand.kind === "junk") {
			const again = window.setTimeout(() => throwFor(who, get, set), 900);
			if (who === "cal") calTimer = again;
			else nedTimer = again;
			return;
		}
		if (who === "cal") {
			set({ calHand: hand });
			if (hand.kind === "seeLo") {
				pay("cal", get, set);
				return;
			}
			if (hand.kind === "aceDeuce") {
				pay("ned", get, set);
				return;
			}
			nedTimer = window.setTimeout(() => throwFor("ned", get, set), 1100);
			return;
		}
		set({ nedHand: hand });
		if (hand.kind === "seeLo") {
			pay("ned", get, set);
			return;
		}
		if (hand.kind === "aceDeuce") {
			pay("cal", get, set);
			return;
		}
		const cal = get().calHand;
		if (!cal) {
			pay("ned", get, set);
			return;
		}
		const result = compare(cal, hand);
		if (result === "a") pay("cal", get, set);
		else if (result === "b") pay("ned", get, set);
		else pay("push", get, set);
	}, 1400);
	if (who === "cal") calTimer = timer;
	else nedTimer = timer;
}
function pay(winner, get, set) {
	const s = get();
	const stake = s.bet;
	let bankroll = s.bankroll;
	let nedBank = s.nedBank;
	let line = "Push. Dice stay.";
	if (winner === "cal") {
		bankroll += stake * 2;
		nedBank -= stake;
		playWin();
		line = `Cal takes it. ${s.calHand ? handShort(s.calHand) : ""} beats ${s.nedHand ? handShort(s.nedHand) : "Ned"}.`;
	} else if (winner === "ned") {
		nedBank += stake;
		playLose();
		line = `Ned takes it. ${s.nedHand ? handShort(s.nedHand) : "The cap"} beats ${s.calHand ? handShort(s.calHand) : "Cal"}.`;
	} else {
		bankroll += stake;
		line = "Push. Same street.";
	}
	set({
		phase: "settle",
		bet: 0,
		bankroll,
		nedBank: Math.max(0, nedBank),
		clip: "idle",
		clipNonce: get().clipNonce + 1,
		line
	});
	persist({
		bankroll: get().bankroll,
		nedBank: get().nedBank,
		muted: get().muted
	});
}
var TONE = {
	1: "bg-chip-1 text-ink",
	5: "bg-chip-5 text-cream",
	25: "bg-chip-25 text-cream",
	100: "bg-chip-100 text-cream",
	500: "bg-chip-500 text-cream"
};
function chipTone(amount) {
	return TONE[[...CHIP_VALUES].reverse().find((v) => amount >= v) ?? 1] ?? TONE[1];
}
function ChipDisc({ amount, selected, onClick, disabled }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
		type: "button",
		disabled,
		onClick,
		"aria-label": `${formatMoney(amount)} chip`,
		"aria-pressed": selected,
		className: cn("relative size-12 rounded-full font-table text-sm font-bold tracking-wide shadow-[inset_0_0_0_3px_rgba(255,255,255,0.28),inset_0_0_0_6px_rgba(0,0,0,0.25),0_2px_6px_rgba(0,0,0,0.4)] transition-transform duration-150 ease-out active:scale-[0.96]", chipTone(amount), selected && "ring-2 ring-ink ring-offset-2 ring-offset-white scale-105"),
		children: amount
	});
}
var CLIPS = {
	idle: "/stoop/idle.mp4",
	cal: "/stoop/cal.mp4",
	ned: "/stoop/ned.mp4"
};
function StreetCam() {
	const clip = useGame((s) => s.clip);
	const clipNonce = useGame((s) => s.clipNonce);
	const clipEnded = useGame((s) => s.clipEnded);
	const ref = (0, import_react.useRef)(null);
	(0, import_react.useEffect)(() => {
		const el = ref.current;
		if (!el) return;
		el.src = CLIPS[clip];
		el.loop = clip === "idle";
		el.muted = true;
		el.play().catch(() => void 0);
	}, [clip, clipNonce]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("video", {
		ref,
		className: "absolute inset-0 size-full object-cover",
		poster: "/stoop/poster.jpg",
		playsInline: true,
		muted: true,
		autoPlay: true,
		onEnded: clipEnded,
		"aria-label": "Street dice camera"
	});
}
function Game() {
	const seated = useGame((s) => s.seated);
	const hydrate = useGame((s) => s.hydrate);
	const sitDown = useGame((s) => s.sitDown);
	const bankroll = useGame((s) => s.bankroll);
	const nedBank = useGame((s) => s.nedBank);
	const bet = useGame((s) => s.bet);
	const selected = useGame((s) => s.selectedChip);
	const setChip = useGame((s) => s.setChip);
	const addChip = useGame((s) => s.addChip);
	const clearBet = useGame((s) => s.clearBet);
	const shoot = useGame((s) => s.shoot);
	const nextRound = useGame((s) => s.nextRound);
	const phase = useGame((s) => s.phase);
	const rolling = useGame((s) => s.rolling);
	const calHand = useGame((s) => s.calHand);
	const nedHand = useGame((s) => s.nedHand);
	const line = useGame((s) => s.line);
	const muted = useGame((s) => s.muted);
	const toggleMute = useGame((s) => s.toggleMute);
	const showRules = useGame((s) => s.showRules);
	const toggleRules = useGame((s) => s.toggleRules);
	const rebuy = useGame((s) => s.rebuy);
	(0, import_react.useEffect)(() => {
		hydrate();
	}, [hydrate]);
	(0, import_react.useEffect)(() => {
		function onKey(e) {
			if (!useGame.getState().seated) return;
			const tag = e.target?.tagName;
			if (tag === "INPUT" || tag === "TEXTAREA") return;
			if (e.code === "Space") {
				e.preventDefault();
				const s = useGame.getState();
				if (s.phase === "betting") s.shoot();
				else if (s.phase === "settle") s.nextRound();
			}
		}
		window.addEventListener("keydown", onKey);
		return () => window.removeEventListener("keydown", onKey);
	}, []);
	const busted = bankroll <= 0 && bet <= 0 && phase === "betting";
	const nedBusted = nedBank <= 0 && phase === "betting";
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "relative h-dvh overflow-hidden bg-white text-ink",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "absolute inset-0 grid place-items-center bg-white",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "relative",
					style: {
						width: "min(100%, calc(100dvh * 16 / 9))",
						height: "min(100%, calc(100vw * 9 / 16))"
					},
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(StreetCam, {})
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
				className: "pointer-events-none absolute inset-x-0 top-0 z-20 flex items-start justify-between p-4",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "font-table text-[10px] tracking-[0.28em] text-ink/45 uppercase",
					children: "Street dice"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "font-display text-2xl leading-none text-ink",
					children: "White Stoop"
				})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "pointer-events-auto flex items-center gap-1",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						variant: "ghost",
						size: "icon",
						className: "text-ink hover:bg-ink/5 hover:text-ink",
						onClick: toggleMute,
						"aria-label": muted ? "Unmute" : "Mute",
						children: muted ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(VolumeX, { className: "size-4" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Volume2, { className: "size-4" })
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						variant: "ghost",
						size: "icon",
						className: "text-ink hover:bg-ink/5 hover:text-ink",
						onClick: toggleRules,
						"aria-label": "Rules",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(BookOpen, { className: "size-4" })
					})]
				})]
			}),
			seated ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "pointer-events-none absolute inset-x-0 top-16 z-20 flex justify-between px-4 text-[11px] font-table tracking-[0.16em] uppercase",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", { children: [
					"Cal ",
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "tabular-nums",
						children: formatMoney(bankroll)
					}),
					calHand ? ` · ${handShort(calHand)}` : ""
				] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "text-right",
					children: [
						"Ned ",
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "tabular-nums",
							children: formatMoney(nedBank)
						}),
						nedHand ? ` · ${handShort(nedHand)}` : ""
					]
				})]
			}) : null,
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "absolute inset-x-0 bottom-0 z-20 flex flex-col items-center gap-3 p-4 pb-[max(1rem,env(safe-area-inset-bottom))]",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "max-w-md text-center font-display text-lg leading-snug text-ink",
						children: seated ? line : "Two shooters. Blank curb. Dice go back and forth."
					}),
					!seated ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						size: "lg",
						className: "bg-ink text-white hover:opacity-90",
						onClick: sitDown,
						children: "Step up"
					}) : null,
					seated && phase === "betting" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex flex-wrap items-center justify-center gap-2",
							children: [CHIP_VALUES.map((v) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChipDisc, {
								amount: v,
								selected: selected === v,
								onClick: () => {
									setChip(v);
									addChip();
								},
								disabled: rolling
							}, v)), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								variant: "ghost",
								size: "sm",
								className: "text-ink hover:bg-ink/5",
								onClick: clearBet,
								disabled: bet <= 0,
								children: "Clear"
							})]
						}),
						bet > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "font-table text-xs tracking-[0.2em] text-ink/50 uppercase",
							children: ["Stake ", formatMoney(bet)]
						}) : null,
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							variant: "shoot",
							size: "lg",
							className: "min-w-44 bg-ink text-white tracking-[0.28em]",
							disabled: bet <= 0 || rolling,
							onClick: shoot,
							children: "Shoot"
						})
					] }) : null,
					seated && phase !== "betting" && phase !== "settle" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "font-table text-[10px] tracking-[0.28em] text-ink/40 uppercase",
						children: phase === "cal" ? "Cal throwing" : "Ned throwing"
					}) : null,
					seated && phase === "settle" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						variant: "shoot",
						size: "lg",
						className: "min-w-44 bg-ink text-white tracking-[0.22em]",
						onClick: nextRound,
						children: "Again"
					}) : null
				]
			}),
			busted || nedBusted ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "fixed inset-0 z-50 flex items-center justify-center bg-white/80 p-4",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "w-full max-w-sm rounded-[24px] border border-ink/10 bg-white p-6 text-center",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
							className: "font-display text-2xl",
							children: busted ? "Cal's empty" : "Ned's empty"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-2 text-sm text-ink/60",
							children: "Restuff both pockets and keep the curb going."
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							className: "mt-5 w-full bg-ink text-white",
							onClick: rebuy,
							children: "Restuff"
						})
					]
				})
			}) : null,
			showRules ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "fixed inset-0 z-50 flex items-end justify-center bg-ink/20 p-3 sm:items-center",
				role: "dialog",
				"aria-modal": "true",
				onClick: toggleRules,
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "max-h-[80dvh] w-full max-w-lg overflow-y-auto rounded-[24px] bg-white p-5 text-ink shadow-[0_24px_60px_rgba(0,0,0,0.12)]",
					onClick: (e) => e.stopPropagation(),
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
							className: "font-display text-2xl",
							children: "Cee-lo on the stoop"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mt-4 space-y-3 text-sm leading-relaxed text-ink/75",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "Three dice. Cal shoots, then Ned. Junk rolls get picked up and thrown again." }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "4-5-6 wins on the spot. 1-2-3 loses on the spot. Trips beat a point. Higher number wins the rank." }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "You are Cal in the mustard jacket. Ned in the cap fades you." })
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							className: "mt-5 w-full bg-ink text-white",
							onClick: toggleRules,
							children: "Back to the curb"
						})
					]
				})
			}) : null
		]
	});
}
function Home() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Game, {});
}
//#endregion
export { Home as component };
