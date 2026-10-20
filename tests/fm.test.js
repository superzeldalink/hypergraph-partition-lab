"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");

const { FMEngine, STATUS } = require("../js/fm.js");
const { PRESETS, makeRandomGraph } = require("../js/presets.js");

function independentCut(graph, sides) {
  const index = new Map(graph.nodes.map((node, i) => [String(node.id), i]));
  return graph.nets.filter((net) => {
    const blocks = new Set(net.cells.map((cell) => sides[index.get(String(cell))]));
    return blocks.size > 1;
  }).length;
}

function exhaust(engine, maxSteps = 3000) {
  const events = [];
  let guard = 0;
  while (engine.status !== STATUS.DONE && guard < maxSteps) {
    events.push(engine.advance());
    guard += 1;
  }
  assert.ok(guard < maxSteps, "solver should terminate");
  return events;
}

test("blank and single-cell draft graphs are safe for the visual editor", () => {
  const engine = new FMEngine({ nodes: [], nets: [] });
  assert.equal(engine.nodes.length, 0);
  assert.equal(engine.cut, 0);
  assert.deepEqual(engine.blockSizes, [0, 0]);
  assert.equal(engine.advance().type, "pass-start");
  assert.equal(engine.advance().type, "pass-end");
  assert.equal(engine.status, STATUS.DONE);
  engine.reset();
  assert.equal(engine.status, STATUS.READY);

  const draft = new FMEngine({ nodes: [{ id: "A" }], nets: [] });
  assert.equal(draft.nodes.length, 1);
  assert.deepEqual(draft.blockSizes, [1, 0]);
  draft.advance();
  assert.equal(draft.status, STATUS.ACTIVE);
  draft.advance();
  assert.equal(draft.status, STATUS.DONE);
});

test("a two-cell graph keeps both blocks non-empty", () => {
  const graph = {
    nodes: [{ id: "A" }, { id: "B" }],
    nets: [{ id: "e1", cells: ["A", "B"] }],
  };
  const engine = new FMEngine(graph, { slack: 1 });
  assert.equal(engine.minSize, 1);
  assert.equal(engine.maxSize, 2);
  exhaust(engine);
  assert.equal(engine.cut, 1);
  assert.deepEqual(engine.blockSizes, [1, 1]);
  assert.equal(engine.totalMoves, 0);
});

test("normalizes edges, removes duplicate cells, and computes the initial cut", () => {
  const graph = {
    nodes: [{ id: "a" }, { id: "b" }, { id: "c" }],
    edges: [
      ["a", "b"],
      ["b", "c", "b"],
      ["a", "a"],
    ],
    initialPartition: [0, 1, 0],
  };
  const engine = new FMEngine(graph, { slack: 1 });
  assert.equal(engine.nets.length, 2);
  assert.deepEqual(engine.nets[1].cells, [1, 2]);
  assert.equal(engine.cut, 2);
  assert.deepEqual(engine.blockSizes, [2, 1]);
});

test("hyperedge gain uses FS minus TE", () => {
  const graph = {
    nodes: "ABCD".split("").map((id) => ({ id })),
    nets: [
      { id: "e1", cells: ["A", "B", "C"] },
      { id: "e2", cells: ["A", "D"] },
    ],
    initialPartition: [0, 0, 0, 1],
  };
  const engine = new FMEngine(graph, { slack: 1 });
  assert.deepEqual(
    ["A", "B", "C", "D"].map((id) => {
      const details = engine.getCellDetails(id);
      return [details.gain, details.fs, details.te];
    }),
    [
      [0, 1, 1],
      [-1, 0, 1],
      [-1, 0, 1],
      [1, 1, 0],
    ],
  );
});

test("critical nets identify the lone cell on a cut side", () => {
  const graph = {
    nodes: "ABCD".split("").map((id) => ({ id })),
    nets: [
      { id: "n1", cells: ["A", "B", "C"] },
      { id: "n2", cells: ["A", "B"] },
      { id: "n3", cells: ["C", "D"] },
    ],
    initialPartition: [0, 1, 0, 0],
  };
  const engine = new FMEngine(graph, { slack: 1 });
  assert.equal(engine.cut, 2);
  assert.equal(engine.getMetrics().criticalNets, 2);

  const a = engine.getCellDetails("A");
  assert.equal(a.fs, 1);
  assert.equal(a.criticalForCell, 1);
  assert.equal(a.incidentNets.find((net) => net.id === "n1").criticalForCell, false);
  assert.deepEqual(
    a.incidentNets.find((net) => net.id === "n1").criticalSides,
    [false, true],
  );

  const b = engine.getCellDetails("B");
  assert.equal(b.fs, 2);
  assert.equal(b.incidentNets.find((net) => net.id === "n1").criticalForCell, true);

  const n1 = engine.getNetDetails("n1");
  assert.equal(n1.critical, true);
  assert.deepEqual(n1.counts, [2, 1]);
  assert.deepEqual(n1.criticalSides, [false, true]);
  assert.equal(n1.cells.find((cell) => cell.id === "B").critical, true);
  assert.equal(n1.cells.find((cell) => cell.id === "A").critical, false);
  assert.equal(engine.getNetDetails("n3").critical, false);
  assert.equal(engine.getNetDetails("missing"), null);

  const mixed = new FMEngine(
    {
      nodes: "ABCD".split("").map((id) => ({ id })),
      nets: [{ id: "n1", cells: ["A", "B", "C", "D"] }],
      initialPartition: [0, 0, 1, 1],
    },
    { slack: 1 },
  );
  assert.equal(mixed.cut, 1);
  assert.equal(mixed.getMetrics().criticalNets, 0);
  assert.equal(mixed.getNetDetails("n1").critical, false);
  assert.deepEqual(mixed.getNetDetails("n1").criticalSides, [false, false]);
});

test("every FM move gain exactly equals the cut reduction", () => {
  for (const preset of PRESETS) {
    const engine = new FMEngine(preset.graph, { slack: 1 });
    let guard = 0;
    while (engine.status !== STATUS.DONE && guard < 1000) {
      const event = engine.advance();
      guard += 1;
      if (event.type !== "move") continue;
      assert.equal(
        event.move.cutBefore - event.move.cut,
        event.move.gain,
        `${preset.id} pass ${event.pass} move ${event.move.label}`,
      );
      assert.equal(engine.cut, independentCut(preset.graph, engine.sides));
    }
    assert.ok(guard < 1000);
  }
});

test("balance bounds and bookkeeping remain valid during every pass", () => {
  for (const preset of PRESETS) {
    for (const slack of [0, 1, 2]) {
      const engine = new FMEngine(preset.graph, { slack });
      let guard = 0;
      while (engine.status !== STATUS.DONE && guard < 1500) {
        const event = engine.advance();
        guard += 1;
        assert.ok(engine.blockSizes[0] >= engine.minSize);
        assert.ok(engine.blockSizes[1] >= engine.minSize);
        assert.ok(engine.blockSizes[0] <= engine.maxSize);
        assert.ok(engine.blockSizes[1] <= engine.maxSize);
        assert.equal(engine.blockSizes[0] + engine.blockSizes[1], engine.nodes.length);
        assert.equal(engine.cut, independentCut(preset.graph, engine.sides));

        if (event.type === "move") {
          assert.equal(engine.passMoves.length, event.move.indexInPass);
          assert.ok(event.move.indexInPass <= engine.nodes.length);
          assert.equal(engine.nodes[event.move.index].locked, true);
          assert.equal(engine.sides[event.move.index], event.move.to);
        }
      }
      assert.ok(guard < 1500);
      assert.equal(engine.cut, engine.bestCut);
      assert.ok(engine.cut <= engine.initialCut);
    }
  }
});

test("slack 0 can open and close a pass but cannot move a balanced cell", () => {
  const engine = new FMEngine(PRESETS[0].graph, { slack: 0 });
  const start = engine.advance();
  assert.equal(start.type, "pass-start");
  assert.equal(engine.status, STATUS.ACTIVE);
  assert.equal(engine.peekMove(), null);
  const end = engine.advance();
  assert.equal(end.type, "pass-end");
  assert.equal(end.acceptedMoves, 0);
  assert.equal(end.improvement, 0);
  assert.equal(engine.status, STATUS.DONE);
  assert.equal(engine.totalMoves, 0);
  assert.equal(engine.cut, engine.initialCut);
});

test("pass end rolls back to its best prefix and unlocks every cell", () => {
  const engine = new FMEngine(PRESETS[0].graph, { slack: 1 });
  const events = exhaust(engine);
  const firstPassEnd = events.find((event) => event.type === "pass-end");
  assert.ok(firstPassEnd);
  assert.equal(firstPassEnd.startCut, 12);
  assert.equal(firstPassEnd.bestCut, 5);
  assert.equal(firstPassEnd.acceptedMoves, 5);
  assert.equal(firstPassEnd.rolledBack, 7);
  assert.equal(firstPassEnd.improvement, 7);
  assert.equal(engine.nodes.filter((node) => node.locked).length, 0);
  assert.equal(
    firstPassEnd.attemptedMoves - firstPassEnd.acceptedMoves,
    firstPassEnd.rolledBack,
  );

  const firstPassMoves = engine.log.filter(
    (entry) => entry.type === "move" && entry.pass === 1,
  );
  assert.equal(firstPassMoves.length, 12);
  assert.equal(firstPassMoves.filter((move) => move.rolledBack).length, 7);
  assert.equal(firstPassMoves.filter((move) => move.becameBest).length, 5);
});

test("accepted cuts are monotone and the preset solutions are stable", () => {
  const expected = new Map([
    ["signal", { cut: 5, sizes: [7, 5], passes: 2 }],
    ["clusters", { cut: 3, sizes: [4, 4], passes: 2 }],
    ["grid", { cut: 3, sizes: [6, 6], passes: 2 }],
  ]);

  for (const preset of PRESETS) {
    const engine = new FMEngine(preset.graph, { slack: 1 });
    const events = exhaust(engine);
    const acceptedCuts = [engine.initialCut];
    events
      .filter((event) => event.type === "pass-end")
      .forEach((event) => {
        assert.ok(event.bestCut <= event.startCut);
        acceptedCuts.push(event.bestCut);
      });
    for (let i = 1; i < acceptedCuts.length; i += 1) {
      assert.ok(acceptedCuts[i] <= acceptedCuts[i - 1]);
    }
    const target = expected.get(preset.id);
    assert.equal(engine.cut, target.cut, preset.id);
    assert.deepEqual(engine.blockSizes, target.sizes, preset.id);
    assert.equal(engine.pass, target.passes, preset.id);
    assert.equal(engine.cut, independentCut(preset.graph, engine.sides));
  }
});

test("reset restores the initial partition and clears the run", () => {
  const engine = new FMEngine(PRESETS[2].graph, { slack: 1 });
  engine.advance();
  engine.advance();
  engine.advance();
  assert.ok(engine.totalMoves > 0);
  engine.reset();
  assert.equal(engine.status, STATUS.READY);
  assert.equal(engine.cut, engine.initialCut);
  assert.deepEqual(engine.blockSizes, engine.initialSizes);
  assert.equal(engine.totalMoves, 0);
  assert.equal(engine.acceptedMoves, 0);
  assert.equal(engine.pass, 0);
  assert.equal(engine.log.length, 0);
  assert.equal(engine.nodes.filter((node) => node.locked).length, 0);
  assert.deepEqual(engine.sides, engine.initialSides);
});

test("random connected netlists terminate with valid gains and balance", () => {
  for (let seed = 1; seed <= 40; seed += 1) {
    const { graph } = makeRandomGraph(seed * 48271);
    assert.ok(graph.nets.length >= graph.nodes.length - 1);
    const engine = new FMEngine(graph, { slack: 1 });
    let guard = 0;
    while (engine.status !== STATUS.DONE && guard < 3000) {
      const event = engine.advance();
      guard += 1;
      if (event.type === "move") {
        assert.equal(event.move.cutBefore - event.move.cut, event.move.gain);
      }
      assert.equal(engine.cut, independentCut(graph, engine.sides));
      assert.ok(engine.blockSizes[0] >= engine.minSize);
      assert.ok(engine.blockSizes[1] >= engine.minSize);
    }
    assert.ok(guard < 3000, `seed ${seed}`);
    assert.ok(engine.cut <= engine.initialCut);
  }
});

test("the gain queue is sorted and agrees with the next pick", () => {
  const engine = new FMEngine(PRESETS[0].graph, { slack: 1 });
  engine.advance();
  const queue = engine.getGainQueue(20);
  assert.ok(queue.length > 0);
  for (let i = 1; i < queue.length; i += 1) {
    assert.ok(queue[i - 1].gain >= queue[i].gain);
  }
  const pick = engine.peekMove();
  assert.equal(queue[0].nodeId, pick.nodeId);
  assert.equal(queue[0].gain, pick.gain);
  const event = engine.advance();
  assert.equal(event.move.nodeId, pick.nodeId);
});

test("setSlack resets the run with new block bounds", () => {
  const engine = new FMEngine(PRESETS[0].graph, { slack: 1 });
  engine.advance();
  engine.advance();
  engine.setSlack(2);
  assert.equal(engine.status, STATUS.READY);
  assert.equal(engine.slack, 2);
  assert.equal(engine.maxSize, 8);
  assert.equal(engine.minSize, 4);
  assert.equal(engine.cut, engine.initialCut);
  assert.equal(engine.totalMoves, 0);
});
