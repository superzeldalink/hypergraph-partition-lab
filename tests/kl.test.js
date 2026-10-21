"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");

const { STATUS } = require("../js/fm.js");
const { KLEngine } = require("../js/kl.js");
const { PRESETS, makeRandomGraph } = require("../js/presets.js");

function independentCut(graph, sides) {
  const index = new Map(graph.nodes.map((node, i) => [String(node.id), i]));
  return graph.nets.filter((net) => {
    const blocks = new Set(net.cells.map((cell) => sides[index.get(String(cell))]));
    return blocks.size > 1;
  }).length;
}

function twoCellGraph(edges, partition = [0, 0, 1, 1]) {
  return {
    nodes: "abcd".split("").map((id) => ({ id })),
    nets: edges.map((cells, index) => ({ id: `e${index + 1}`, cells })),
    initialPartition: partition,
  };
}

function exhaust(engine, maxSteps = 3000) {
  const events = [];
  let guard = 0;
  while (engine.status !== STATUS.DONE && guard < maxSteps) {
    events.push(engine.advance());
    guard += 1;
  }
  assert.ok(guard < maxSteps, "KL should terminate");
  return events;
}

test("KL uses D(v), picks the best pair, locks both, and keeps the best prefix", () => {
  const graph = twoCellGraph([
    ["a", "c"],
    ["a", "d"],
    ["b", "c"],
    ["b", "d"],
  ]);
  const engine = new KLEngine(graph);
  assert.equal(engine.cut, 4);
  assert.deepEqual(engine.blockSizes, [2, 2]);
  assert.deepEqual(
    engine.nodes.map((node) => node.gain),
    [2, 2, 2, 2],
  );

  const start = engine.advance();
  assert.equal(start.type, "pass-start");
  assert.equal(engine.status, STATUS.ACTIVE);

  const queue = engine.getPairQueue(20);
  assert.equal(queue.length, 4);
  assert.deepEqual(
    queue.map((pair) => [pair.a.label, pair.b.label, pair.gain]),
    [
      ["a", "c", 2],
      ["a", "d", 2],
      ["b", "c", 2],
      ["b", "d", 2],
    ],
  );
  assert.equal(engine.peekMove().a.label, "a");
  assert.equal(engine.peekMove().b.label, "c");

  const first = engine.advance();
  assert.equal(first.type, "swap");
  assert.equal(first.move.gain, 2);
  assert.equal(first.move.cutBefore, 4);
  assert.equal(first.move.cut, 2);
  assert.deepEqual(
    [first.move.a.label, first.move.a.from, first.move.a.to],
    ["a", 0, 1],
  );
  assert.deepEqual(
    [first.move.b.label, first.move.b.from, first.move.b.to],
    ["c", 1, 0],
  );
  assert.equal(engine.cut, 2);
  assert.equal(engine.nodes.find((node) => node.id === "a").locked, true);
  assert.equal(engine.nodes.find((node) => node.id === "c").locked, true);
  assert.equal(engine.nodes.find((node) => node.id === "b").locked, false);

  const secondQueue = engine.getPairQueue(20);
  assert.equal(secondQueue.length, 1);
  assert.deepEqual(
    [secondQueue[0].a.label, secondQueue[0].b.label, secondQueue[0].gain],
    ["b", "d", -2],
  );
  const second = engine.advance();
  assert.equal(second.move.gain, -2);
  assert.equal(second.move.cut, 4);
  assert.equal(second.move.becameBest, false);

  const end = engine.advance();
  assert.equal(end.type, "pass-end");
  assert.equal(end.startCut, 4);
  assert.equal(end.bestCut, 2);
  assert.equal(end.acceptedMoves, 1);
  assert.equal(end.rolledBack, 1);
  assert.equal(end.improvement, 2);
  assert.equal(engine.cut, 2);
  assert.deepEqual(engine.blockSizes, [2, 2]);
  assert.equal(engine.nodes.filter((node) => node.locked).length, 0);
  assert.equal(engine.status, STATUS.BETWEEN);
});

test("KL reproduces the slide's Example 2.1 gain sequence and G_m", () => {
  // The graph in the KL example: A={a,b,c,d}, B={e,f,g,h}, nine cut
  // edges initially. The four internal edges are a-b, c-d, e-f, g-h.
  const graph = {
    nodes: "abcdefgh".split("").map((id) => ({ id })),
    nets: [
      ["a", "b"],
      ["a", "e"],
      ["a", "f"],
      ["b", "e"],
      ["b", "f"],
      ["c", "d"],
      ["c", "f"],
      ["c", "g"],
      ["c", "h"],
      ["d", "g"],
      ["d", "h"],
      ["e", "f"],
      ["g", "h"],
    ].map((cells, index) => ({ id: `e${index + 1}`, cells })),
    initialPartition: [0, 0, 0, 0, 1, 1, 1, 1],
  };
  const engine = new KLEngine(graph);
  assert.equal(engine.cut, 9);
  assert.deepEqual(
    engine.nodes.map((node) => node.gain),
    [1, 1, 2, 1, 1, 2, 1, 1],
  );

  assert.equal(engine.advance().type, "pass-start");
  const gains = () =>
    Object.fromEntries(engine.nodes.map((node) => [node.label, node.gain]));
  assert.deepEqual([gains().c, gains().e], [2, 1]);
  const pairs = [];
  const pair = engine.peekMove();
  pairs.push([pair.a.label, pair.b.label, pair.gain]);
  engine.advance();
  assert.deepEqual(
    ["a", "b", "d", "f", "g", "h"].map((label) => gains()[label]),
    [-1, -1, 3, 2, -1, -1],
  );
  for (let i = 0; i < 3; i += 1) {
    const next = engine.peekMove();
    pairs.push([next.a.label, next.b.label, next.gain]);
    engine.advance();
    if (i === 0) {
      assert.deepEqual(
        ["a", "b", "g", "h"].map((label) => gains()[label]),
        [-3, -3, -3, -3],
      );
    }
  }
  assert.deepEqual(pairs, [
    ["c", "e", 3],
    ["d", "f", 5],
    ["a", "g", -6],
    ["b", "h", -2],
  ]);

  const end = engine.advance();
  assert.equal(end.type, "pass-end");
  assert.equal(end.startCut, 9);
  assert.equal(end.bestCut, 1);
  assert.equal(end.acceptedMoves, 2);
  assert.equal(end.rolledBack, 2);
  assert.equal(end.improvement, 8);
  assert.equal(engine.cut, 1);
  assert.deepEqual(engine.blockSizes, [4, 4]);
  assert.deepEqual(
    engine.nodes.filter((node) => engine.sides[node.index] === 1).map((node) => node.label).sort(),
    ["c", "d", "g", "h"],
  );
});

test("KL pair gain matches the slide graph formula for two-terminal nets", () => {
  const engine = new KLEngine(PRESETS[2].graph);
  engine.advance();
  const queue = engine.getPairQueue(Number.MAX_SAFE_INTEGER);
  assert.ok(queue.length > 0);
  for (const pair of queue.slice(0, 40)) {
    const a = engine.nodes[pair.indexA];
    const b = engine.nodes[pair.indexB];
    const shared = engine.incident[pair.indexA].filter(
      (netIndex) =>
        engine.nets[netIndex].cells.length === 2 &&
        engine.incident[pair.indexB].includes(netIndex),
    ).length;
    assert.equal(pair.gain, a.gain + b.gain - 2 * shared);
  }
});

test("KL exact pair gain is the net-cut change on hypergraphs", () => {
  const graph = {
    nodes: "abcdef".split("").map((id) => ({ id })),
    nets: [
      { id: "h1", cells: ["a", "b", "c"] },
      { id: "h2", cells: ["a", "d", "e"] },
      { id: "h3", cells: ["c", "e", "f"] },
      { id: "h4", cells: ["b", "d"] },
    ],
    initialPartition: [0, 0, 0, 1, 1, 1],
  };
  const engine = new KLEngine(graph);
  engine.advance();
  const queue = engine.getPairQueue(Number.MAX_SAFE_INTEGER);
  for (const pair of queue) {
    const sides = engine.sides.slice();
    sides[pair.indexA] = 1 - sides[pair.indexA];
    sides[pair.indexB] = 1 - sides[pair.indexB];
    assert.equal(pair.gain, engine.cut - independentCut(graph, sides));
  }
});

test("KL traverses passes, preserves block sizes, and never reports a false cut", () => {
  for (const preset of PRESETS) {
    const engine = new KLEngine(preset.graph);
    const initialSizes = engine.blockSizes.slice();
    const events = exhaust(engine);
    assert.ok(engine.cut <= engine.initialCut, preset.id);
    assert.deepEqual(engine.blockSizes, initialSizes, preset.id);
    assert.equal(engine.cut, independentCut(preset.graph, engine.sides), preset.id);
    assert.equal(engine.nodes.filter((node) => node.locked).length, 0, preset.id);
    for (const event of events) {
      if (event.type === "swap") {
        assert.equal(event.move.cutBefore - event.move.cut, event.move.gain);
        assert.equal(
          event.move.a.from,
          1 - event.move.a.to,
          `${preset.id} a direction`,
        );
        assert.equal(
          event.move.b.from,
          1 - event.move.b.to,
          `${preset.id} b direction`,
        );
      }
    }
  }
});

test("KL random netlists terminate with exact swaps and fixed balance", () => {
  for (let seed = 1; seed <= 30; seed += 1) {
    const { graph } = makeRandomGraph(seed * 7919);
    const engine = new KLEngine(graph);
    const initialSizes = engine.blockSizes.slice();
    let guard = 0;
    while (engine.status !== STATUS.DONE && guard < 4000) {
      const event = engine.advance();
      guard += 1;
      if (event.type === "swap") {
        assert.equal(event.move.cutBefore - event.move.cut, event.move.gain);
        assert.equal(event.move.a.to, 1 - event.move.a.from);
        assert.equal(event.move.b.to, 1 - event.move.b.from);
      }
      assert.deepEqual(engine.blockSizes, initialSizes, `seed ${seed}`);
      assert.equal(engine.cut, independentCut(graph, engine.sides), `seed ${seed}`);
    }
    assert.ok(guard < 4000, `seed ${seed}`);
    assert.ok(engine.cut <= engine.initialCut, `seed ${seed}`);
  }
});

test("KL reset clears the run and restores the initial partition", () => {
  const engine = new KLEngine(PRESETS[0].graph);
  engine.advance();
  engine.advance();
  assert.ok(engine.totalMoves > 0);
  engine.reset();
  assert.equal(engine.status, STATUS.READY);
  assert.equal(engine.pass, 0);
  assert.equal(engine.cut, engine.initialCut);
  assert.deepEqual(engine.blockSizes, engine.initialSizes);
  assert.deepEqual(engine.sides, engine.initialSides);
  assert.equal(engine.totalMoves, 0);
  assert.equal(engine.acceptedMoves, 0);
  assert.equal(engine.log.length, 0);
  assert.equal(engine.nodes.filter((node) => node.locked).length, 0);
});
