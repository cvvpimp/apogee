import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { addBet, applyRoll, freshTable } from "./engine.ts";
import { amountOn } from "./payouts.ts";
import type { TableState } from "./types";

function withPass(amount = 10): TableState {
  const placed = addBet(freshTable(), "pass", amount);
  assert.equal(placed.ok, true);
  if (!placed.ok) throw new Error("setup");
  return placed.state;
}

describe("craps engine", () => {
  it("pays pass on come-out 7 and keeps the bet", () => {
    const { state, events } = applyRoll(withPass(10), 3, 4);
    assert.equal(state.bankroll, 1000 - 10 + 10);
    assert.equal(amountOn(state.bets, "pass"), 10);
    assert.equal(state.phase, "comeOut");
    assert.ok(events.some((e) => e.type === "natural"));
  });

  it("takes pass and pays don't on craps 2", () => {
    let t = freshTable();
    t = (addBet(t, "pass", 10) as { ok: true; state: TableState }).state;
    t = (addBet(t, "dontPass", 10) as { ok: true; state: TableState }).state;
    const { state } = applyRoll(t, 1, 1);
    assert.equal(amountOn(state.bets, "pass"), 0);
    assert.equal(amountOn(state.bets, "dontPass"), 10);
    assert.equal(state.bankroll, 1000 - 20 + 10); // dp profit 10, pass gone
  });

  it("bars 12 on don't pass (push) and takes pass", () => {
    let t = freshTable();
    t = (addBet(t, "pass", 10) as { ok: true; state: TableState }).state;
    t = (addBet(t, "dontPass", 10) as { ok: true; state: TableState }).state;
    const { state, events } = applyRoll(t, 6, 6);
    assert.equal(amountOn(state.bets, "pass"), 0);
    assert.equal(amountOn(state.bets, "dontPass"), 10);
    assert.ok(events.some((e) => e.type === "push"));
    assert.equal(state.bankroll, 1000 - 20); // pass lost, dp pushed
  });

  it("establishes a point on 6", () => {
    const { state, events } = applyRoll(withPass(10), 3, 3);
    assert.equal(state.phase, "point");
    assert.equal(state.point, 6);
    assert.ok(events.some((e) => e.type === "pointOn" && e.point === 6));
    assert.equal(amountOn(state.bets, "pass"), 10);
  });

  it("pays the line when the point hits and turns the puck off", () => {
    let t = applyRoll(withPass(10), 4, 2).state; // point 6
    assert.equal(t.point, 6);
    const { state, events } = applyRoll(t, 5, 1);
    assert.equal(state.phase, "comeOut");
    assert.equal(state.point, null);
    assert.equal(amountOn(state.bets, "pass"), 10);
    assert.equal(state.bankroll, 1000 - 10 + 10);
    assert.ok(events.some((e) => e.type === "pointOff"));
  });

  it("sevens out: takes pass, pays don't", () => {
    let t = freshTable();
    t = (addBet(t, "pass", 10) as { ok: true; state: TableState }).state;
    t = applyRoll(t, 4, 2).state; // point 6
    t = (addBet(t, "dontPass", 5) as { ok: true; state: TableState }).state;
    // don't pass cannot be added during point - that's correct
    assert.equal(amountOn(t.bets, "dontPass"), 0);

    let s = freshTable();
    s = (addBet(s, "pass", 10) as { ok: true; state: TableState }).state;
    s = (addBet(s, "dontPass", 10) as { ok: true; state: TableState }).state;
    s = applyRoll(s, 4, 2).state;
    const { state, events } = applyRoll(s, 3, 4);
    assert.equal(amountOn(state.bets, "pass"), 0);
    assert.equal(amountOn(state.bets, "dontPass"), 10);
    assert.equal(state.phase, "comeOut");
    assert.ok(events.some((e) => e.type === "sevenOut"));
    assert.equal(state.bankroll, 1000 - 20 + 10);
  });

  it("pays field 2 at 2:1 and takes it down", () => {
    const t = (addBet(freshTable(), "field", 10) as { ok: true; state: TableState })
      .state;
    const { state } = applyRoll(t, 1, 1);
    assert.equal(amountOn(state.bets, "field"), 0);
    assert.equal(state.bankroll, 1000 - 10 + 10 + 20);
  });

  it("pays place 8 at 7:6 and keeps the bet", () => {
    let t = applyRoll(withPass(5), 2, 2).state; // point 4 so 8 is not the point
    t = (addBet(t, "place", 12, 8) as { ok: true; state: TableState }).state;
    const { state } = applyRoll(t, 3, 5); // 8
    assert.equal(amountOn(state.bets, "place", 8), 12);
    assert.equal(state.bankroll, 1000 - 5 - 12 + 14);
  });

  it("hard 8 wins 9:1; easy 8 takes the hardway", () => {
    let t = (addBet(freshTable(), "hard", 10, 8) as { ok: true; state: TableState })
      .state;
    t = applyRoll(t, 3, 3).state; // hard 6 — hard 8 stays
    assert.equal(amountOn(t.bets, "hard", 8), 10);
    const easy = applyRoll(t, 3, 5).state; // easy 8
    assert.equal(amountOn(easy.bets, "hard", 8), 0);

    const hard = applyRoll(
      (addBet(freshTable(), "hard", 10, 8) as { ok: true; state: TableState }).state,
      4,
      4,
    ).state;
    assert.equal(amountOn(hard.bets, "hard", 8), 10);
    assert.equal(hard.bankroll, 1000 - 10 + 90);
  });

  it("moves a come bet to the number, then pays it when that number hits", () => {
    let t = applyRoll(withPass(10), 4, 2).state; // point 6
    t = (addBet(t, "come", 10) as { ok: true; state: TableState }).state;
    t = applyRoll(t, 2, 3).state; // 5 — come moves to 5
    assert.equal(amountOn(t.bets, "come", 5), 10);
    const { state } = applyRoll(t, 1, 4); // 5 hits
    assert.equal(amountOn(state.bets, "come", 5), 0);
    assert.equal(state.bankroll, 1000 - 20 + 20); // come stake+profit back
  });

  it("rejects come on the come-out and pass after a point", () => {
    const come = addBet(freshTable(), "come", 10);
    assert.equal(come.ok, false);
    const pointed = applyRoll(withPass(10), 4, 2).state;
    const pass = addBet(pointed, "pass", 5);
    assert.equal(pass.ok, false);
  });

  it("caps pass odds at 3-4-5x", () => {
    let t = applyRoll(withPass(10), 4, 2).state; // point 6 → 5x = 50
    const ok = addBet(t, "passOdds", 50);
    assert.equal(ok.ok, true);
    const over = addBet(
      (ok as { ok: true; state: TableState }).state,
      "passOdds",
      5,
    );
    assert.equal(over.ok, false);
  });

  it("leaves place bets off (and safe) on a come-out seven", () => {
    let t = (addBet(freshTable(), "place", 12, 6) as { ok: true; state: TableState })
      .state;
    t = (addBet(t, "pass", 10) as { ok: true; state: TableState }).state;
    const { state } = applyRoll(t, 3, 4); // come-out 7
    assert.equal(amountOn(state.bets, "place", 6), 12);
    assert.equal(amountOn(state.bets, "pass"), 10);
  });
});
