/*
 * KL Lab core — a dependency-free Kernighan–Lin pair-swap partitioner.
 *
 * The course KL algorithm works on an undirected graph:
 *   D(v) = E_B(v) - E_A(v)
 *   g(a,b) = D(a) + D(b) - 2*c(a,b)
 * It swaps one free node from each block, locks both, records the best
 * cumulative-gain prefix, and stops after a pass with no improvement.
 *
 * This lab's board is a hypergraph. The same pair-swap state machine is used,
 * but pair gains are evaluated from the exact change in the unit-cost net cut.
 * For two-terminal nets that is exactly the slide formula. This keeps KL and
 * FM comparable on the same board and lets KL operate on nets with 3+ cells.
 */
(function (root, factory) {
  if (typeof module === "object" && module.exports) {
    module.exports = factory(require("./fm.js"));
  } else {
    root.KLCore = factory(root.FMCore);
  }
})(typeof globalThis !== "undefined" ? globalThis : this, function (core) {
  "use strict";

  const { FMEngine, STATUS, isCutCounts } = core;

  function compareNodes(a, b) {
    const labelA = String(a.label ?? a.id).toLocaleLowerCase("en");
    const labelB = String(b.label ?? b.id).toLocaleLowerCase("en");
    if (labelA < labelB) return -1;
    if (labelA > labelB) return 1;
    const idA = String(a.id);
    const idB = String(b.id);
    if (idA < idB) return -1;
    if (idA > idB) return 1;
    return a.index - b.index;
  }

  class KLEngine {
    constructor(graph, options = {}) {
      // Reuse FM's graph normalization, partition bookkeeping, net counts,
      // D(v)=FS-TE breakdown, critical-net inspection, and cut computation.
      this.base = new FMEngine(graph, options);
      this.algorithm = "KL";
      this.fixedBlockSizes = true;
      this.reset();
    }

    /* Shared partition surface ---------------------------------------- */

    get nodes() { return this.base.nodes; }
    get nets() { return this.base.nets; }
    get indexOf() { return this.base.indexOf; }
    get incident() { return this.base.incident; }
    get sides() { return this.base.sides; }
    get netCounts() { return this.base.netCounts; }
    get blockSizes() { return this.base.blockSizes; }
    get cut() { return this.base.cut; }
    get initialSides() { return this.base.initialSides; }
    get initialCut() { return this.base.initialCut; }
    get initialSizes() { return this.base.initialSizes; }
    get graphMeta() { return this.base.graphMeta; }
    get slack() { return 0; }
    get maxSize() { return Math.max(this.blockSizes[0], this.blockSizes[1]); }
    get minSize() { return Math.min(this.blockSizes[0], this.blockSizes[1]); }

    reset() {
      this.base.reset();
      this.pass = 0;
      this.status = STATUS.READY;
      this.passStartCut = this.base.cut;
      this.passBestCut = this.base.cut;
      this.passBestSides = this.base.sides.slice();
      this.passBestMoveCount = 0;
      this.passMoves = [];
      this.passCumulativeGain = 0;
      this.bestCut = this.base.initialCut;
      this.bestSides = this.base.sides.slice();
      this.totalMoves = 0;
      this.acceptedMoves = 0;
      this.moveSerial = 0;
      this.log = [];
      this.lastPassImprovement = null;
      return this;
    }

    setSlack() {
      // KL swaps preserve the starting block sizes; slack is FM-only.
      return this;
    }

    /* Pair evaluation ------------------------------------------------ */

    _pairGain(aIndex, bIndex) {
      if (aIndex === bIndex) return 0;
      if (this.base.sides[aIndex] === this.base.sides[bIndex]) return 0;

      // Apply the two moves to affected net-side counts without mutating the
      // live partition, then compare cut status before and after.
      const affected = new Map();
      const applyMove = (index) => {
        const from = this.base.sides[index];
        const to = 1 - from;
        this.base.incident[index].forEach((netIndex) => {
          let counts = affected.get(netIndex);
          if (!counts) {
            counts = this.base.netCounts[netIndex].slice();
            affected.set(netIndex, counts);
          }
          counts[from] -= 1;
          counts[to] += 1;
        });
      };
      applyMove(aIndex);
      applyMove(bIndex);

      let gain = 0;
      affected.forEach((counts, netIndex) => {
        const before = isCutCounts(this.base.netCounts[netIndex]);
        const after = isCutCounts(counts);
        if (before && !after) gain += 1;
        else if (!before && after) gain -= 1;
      });
      return gain;
    }

    _makePair(aIndex, bIndex) {
      const a = this.base.nodes[aIndex];
      const b = this.base.nodes[bIndex];
      const gain = this._pairGain(aIndex, bIndex);
      return {
        type: "swap",
        indexA: aIndex,
        indexB: bIndex,
        gain,
        cutBefore: this.cut,
        cutAfter: this.cut - gain,
        a: {
          index: aIndex,
          nodeId: a.id,
          label: a.label,
          side: a.side,
          from: a.side,
          to: 1 - a.side,
          d: a.gain,
        },
        b: {
          index: bIndex,
          nodeId: b.id,
          label: b.label,
          side: b.side,
          from: b.side,
          to: 1 - b.side,
          d: b.gain,
        },
      };
    }

    getPairQueue(limit = 12) {
      if (this.status !== STATUS.ACTIVE) return [];
      const freeA = [];
      const freeB = [];
      this.base.nodes.forEach((node, index) => {
        if (node.locked) return;
        if (node.side === 0) freeA.push(index);
        else freeB.push(index);
      });

      const pairs = [];
      freeA.forEach((aIndex) => {
        freeB.forEach((bIndex) => {
          pairs.push(this._makePair(aIndex, bIndex));
        });
      });
      pairs.sort(
        (left, right) =>
          right.gain - left.gain ||
          compareNodes(left.a, right.a) ||
          compareNodes(left.b, right.b),
      );
      return Number.isFinite(limit) ? pairs.slice(0, limit) : pairs;
    }

    evaluatePair(aId, bId) {
      const aIndex = this.base.indexOf.get(String(aId));
      const bIndex = this.base.indexOf.get(String(bId));
      if (aIndex === undefined || bIndex === undefined) return null;
      if (this.base.sides[aIndex] === this.base.sides[bIndex]) return null;
      return this._makePair(aIndex, bIndex);
    }

    getBestPairForCell(nodeId) {
      if (this.status !== STATUS.ACTIVE) return null;
      const index = this.base.indexOf.get(String(nodeId));
      if (index === undefined || this.base.nodes[index].locked) return null;
      return (
        this.getPairQueue(Number.MAX_SAFE_INTEGER).find(
          (pair) =>
            pair.indexA === index || pair.indexB === index,
        ) ?? null
      );
    }

    choosePair() {
      return this.getPairQueue(1)[0] ?? null;
    }

    peekMove() {
      if (this.status !== STATUS.ACTIVE) return null;
      return this.choosePair();
    }

    /* KL pass state machine ----------------------------------------- */

    beginPass() {
      if (this.status === STATUS.ACTIVE) return { type: "noop", state: this.status };
      if (this.status === STATUS.DONE) return { type: "done", cut: this.cut };

      this.pass += 1;
      this.status = STATUS.ACTIVE;
      this.base.nodes.forEach((node) => {
        node.locked = false;
      });
      this.base._refreshGains(this.base.nodes.map((_, index) => index));
      this.passStartCut = this.cut;
      this.passBestCut = this.cut;
      this.passBestSides = this.sides.slice();
      this.passBestMoveCount = 0;
      this.passMoves = [];
      this.passCumulativeGain = 0;

      const event = {
        type: "pass-start",
        pass: this.pass,
        cut: this.cut,
        cells: this.base.nodes.length,
        nets: this.base.nets.length,
        algorithm: "KL",
      };
      this.log.push(event);
      return event;
    }

    _applySwap(pair) {
      const aIndex = pair.indexA;
      const bIndex = pair.indexB;
      const a = this.base.nodes[aIndex];
      const b = this.base.nodes[bIndex];
      if (a.locked || b.locked) throw new Error("Attempted to swap a fixed cell.");
      if (a.side === b.side) throw new Error("KL swaps need one cell from each block.");

      const cutBefore = this.cut;
      const gain = this._pairGain(aIndex, bIndex);
      const aFrom = a.side;
      const bFrom = b.side;
      const lockedBefore = this.base.nodes.map((node) => node.locked);
      const sides = this.sides.slice();
      sides[aIndex] = 1 - sides[aIndex];
      sides[bIndex] = 1 - sides[bIndex];

      this.base._loadPartition(sides);
      this.base.nodes.forEach((node, index) => {
        node.locked = lockedBefore[index] || index === aIndex || index === bIndex;
      });
      this.passCumulativeGain += gain;
      this.totalMoves += 1;
      this.moveSerial += 1;

      const move = {
        type: "swap",
        serial: this.moveSerial,
        pass: this.pass,
        indexInPass: this.passMoves.length + 1,
        a: {
          index: aIndex,
          nodeId: a.id,
          label: a.label,
          from: aFrom,
          to: 1 - aFrom,
        },
        b: {
          index: bIndex,
          nodeId: b.id,
          label: b.label,
          from: bFrom,
          to: 1 - bFrom,
        },
        gain,
        cutBefore,
        cut: this.cut,
        cumulativeGain: this.passCumulativeGain,
        lockedCount: this.base.nodes.filter((node) => node.locked).length,
        becameBest: false,
        rolledBack: false,
      };
      this.passMoves.push(move);
      this.log.push(move);

      if (this.cut < this.passBestCut) {
        this.passBestCut = this.cut;
        this.passBestSides = this.sides.slice();
        this.passBestMoveCount = this.passMoves.length;
        move.becameBest = true;
      }

      return { type: "swap", pass: this.pass, move, cut: this.cut };
    }

    finishPass() {
      if (this.status !== STATUS.ACTIVE) {
        return { type: "noop", state: this.status };
      }

      const startCut = this.passStartCut;
      const bestCut = this.passBestCut;
      const attemptedMoves = this.passMoves.length;
      const acceptedMoves = this.passBestMoveCount;
      const improvement = startCut - bestCut;

      this.passMoves.forEach((move, index) => {
        if (index >= acceptedMoves) move.rolledBack = true;
      });

      this.base._loadPartition(this.passBestSides);
      this.base.nodes.forEach((node) => {
        node.locked = false;
      });
      this.bestCut = Math.min(this.bestCut, bestCut);
      this.bestSides = this.sides.slice();
      this.acceptedMoves += acceptedMoves;
      this.lastPassImprovement = improvement;
      this.status = improvement > 0 ? STATUS.BETWEEN : STATUS.DONE;

      const event = {
        type: "pass-end",
        pass: this.pass,
        startCut,
        bestCut,
        attemptedMoves,
        acceptedMoves,
        rolledBack: attemptedMoves - acceptedMoves,
        improvement,
        cut: this.cut,
        status: this.status,
        algorithm: "KL",
      };
      this.log.push(event);
      return event;
    }

    advance() {
      if (this.status === STATUS.DONE) {
        return { type: "done", cut: this.cut };
      }
      if (this.status === STATUS.READY || this.status === STATUS.BETWEEN) {
        return this.beginPass();
      }
      const pair = this.choosePair();
      if (!pair) return this.finishPass();
      return this._applySwap(pair);
    }

    /* Inspection ----------------------------------------------------- */

    getCellDetails(nodeId) {
      const details = this.base.getCellDetails(nodeId);
      if (!details) return null;
      details.algorithm = "KL";
      details.d = details.gain;
      details.bestSwap = this.getBestPairForCell(nodeId);
      return details;
    }

    getNetDetails(netId) {
      return this.base.getNetDetails(netId);
    }

    getCriticalNets() {
      return this.base.getCriticalNets();
    }

    getGainQueue() {
      return [];
    }

    getMetrics() {
      const metrics = this.base.getMetrics();
      const sizes = this.blockSizes;
      return {
        ...metrics,
        algorithm: "KL",
        fixedBlockSizes: true,
        cut: this.cut,
        initialCut: this.base.initialCut,
        improvement: this.base.initialCut - this.cut,
        bestCut: this.bestCut,
        pass: this.pass,
        status: this.status,
        slack: 0,
        maxSize: Math.max(sizes[0], sizes[1]),
        minSize: Math.min(sizes[0], sizes[1]),
        totalMoves: this.totalMoves,
        acceptedMoves: this.acceptedMoves,
        passMoves: this.passMoves.length,
        passBestMoveCount: this.passBestMoveCount,
        passStartCut: this.passStartCut,
        passBestCut: this.passBestCut,
        passCumulativeGain: this.passCumulativeGain,
        lastPassImprovement: this.lastPassImprovement,
      };
    }
  }

  return {
    KLEngine,
    version: "1.0.0",
  };
});
