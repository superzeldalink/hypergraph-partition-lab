/*
 * FM Lab core — a dependency-free Fiduccia–Mattheyses hypergraph partitioner.
 *
 * A net is "cut" when it has cells in both blocks. For a cell v:
 *   FS(v): nets where v is the only cell on its side (and at least one cell
 *          is on the other side). Moving v removes those nets from the cut.
 *   TE(v): nets entirely on v's side. Moving v creates a cut.
 *   gain(v) = FS(v) - TE(v)
 *
 * Each pass locks every moved cell, updates the gains of its net-mates, and
 * records the best partition prefix. At the end of the pass the partition is
 * rolled back to that best prefix. A new pass starts only after an improvement.
 */
(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.FMCore = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  const STATUS = Object.freeze({
    READY: "ready",
    ACTIVE: "active",
    BETWEEN: "between",
    DONE: "done",
  });

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function isCutCounts(counts) {
    return counts[0] > 0 && counts[1] > 0;
  }

  /**
   * A cut net is critical when one block contains exactly one of its cells.
   * Moving that lone cell closes the net and contributes +1 to its gain.
   */
  function isCriticalCounts(counts) {
    return isCutCounts(counts) && (counts[0] === 1 || counts[1] === 1);
  }

  function shuffleInPlace(items, rng) {
    for (let i = items.length - 1; i > 0; i -= 1) {
      const j = Math.floor(rng() * (i + 1));
      [items[i], items[j]] = [items[j], items[i]];
    }
    return items;
  }

  /** Return a balanced 0/1 split, alternating through a shuffled node order. */
  function balancedSplit(size, rng) {
    const random = typeof rng === "function" ? rng : Math.random;
    const order = Array.from({ length: size }, (_, i) => i);
    shuffleInPlace(order, random);
    const sides = new Array(size).fill(0);
    order.forEach((index, ordinal) => {
      sides[index] = ordinal % 2;
    });
    return sides;
  }

  function normalizeGraph(graph) {
    if (!graph || !Array.isArray(graph.nodes)) {
      throw new Error("A graph needs a nodes array.");
    }

    const seen = new Set();
    const nodes = graph.nodes.map((node, index) => {
      const id = String(node.id ?? `cell-${index + 1}`);
      if (seen.has(id)) throw new Error(`Duplicate cell id: ${id}`);
      seen.add(id);
      return {
        id,
        label: String(node.label ?? id),
        description: node.description ? String(node.description) : "",
      };
    });

    const rawNets = Array.isArray(graph.nets)
      ? graph.nets
      : Array.isArray(graph.edges)
        ? graph.edges.map((edge, index) => ({
            id: edge.id ?? `e${index + 1}`,
            cells: edge.cells ?? edge.nodes ?? edge,
          }))
        : [];

    const indexOf = new Map(nodes.map((node, index) => [node.id, index]));
    const nets = [];
    rawNets.forEach((rawNet, netIndex) => {
      const rawCells = Array.isArray(rawNet)
        ? rawNet
        : rawNet.cells ?? rawNet.nodes ?? [];
      const unique = [];
      const localSeen = new Set();
      rawCells.forEach((rawCell) => {
        const index = indexOf.get(String(rawCell));
        if (index === undefined || localSeen.has(index)) return;
        localSeen.add(index);
        unique.push(index);
      });
      if (unique.length < 2) return;
      const id = String(rawNet.id ?? `n${netIndex + 1}`);
      nets.push({
        id,
        label: String(rawNet.label ?? rawNet.name ?? id),
        cells: unique,
      });
    });

    return { nodes, nets };
  }

  class FMEngine {
    constructor(graph, options = {}) {
      const normalized = normalizeGraph(graph);
      this.nodes = normalized.nodes.map((node, index) => ({
        ...node,
        index,
        side: 0,
        locked: false,
        gain: 0,
        fs: 0,
        te: 0,
      }));
      this.nets = normalized.nets;
      this.indexOf = new Map(this.nodes.map((node) => [node.id, node.index]));
      this.incident = this.nodes.map(() => []);
      this.nets.forEach((net, netIndex) => {
        net.cells.forEach((cellIndex) => {
          this.incident[cellIndex].push(netIndex);
        });
      });

      const requestedSlack = Number.isFinite(options.slack)
        ? Math.round(options.slack)
        : 1;
      this.slack = clamp(requestedSlack, 0, this.nodes.length);
      this.maxSize = Math.min(
        this.nodes.length,
        Math.ceil(this.nodes.length / 2) + this.slack,
      );
      this.minSize = Math.max(1, this.nodes.length - this.maxSize);

      let initialSides;
      if (
        Array.isArray(options.initialPartition) &&
        options.initialPartition.length === this.nodes.length
      ) {
        initialSides = options.initialPartition.map((side) => (Number(side) ? 1 : 0));
      } else if (Array.isArray(graph.initialPartition) && graph.initialPartition.length === this.nodes.length) {
        initialSides = graph.initialPartition.map((side) => (Number(side) ? 1 : 0));
      } else {
        initialSides = this.nodes.map((_, index) => index % 2);
      }

      this.initialSides = initialSides.slice();
      this._loadPartition(this.initialSides);
      this.initialCut = this.cut;
      this.initialSizes = this.blockSizes.slice();
      this.reset();

      this.graphMeta = {
        name: String(graph.name ?? "Untitled hypergraph"),
        description: String(graph.description ?? ""),
      };
    }

    /* ------------------------------------------------------------------ */
    /* Partition bookkeeping                                              */
    /* ------------------------------------------------------------------ */

    _loadPartition(sides) {
      this.sides = sides.map((side) => (Number(side) ? 1 : 0));
      this.blockSizes = [0, 0];
      this.netCounts = this.nets.map(() => [0, 0]);

      this.nodes.forEach((node, index) => {
        node.side = this.sides[index];
        node.locked = false;
        this.blockSizes[node.side] += 1;
        this.incident[index].forEach((netIndex) => {
          this.netCounts[netIndex][node.side] += 1;
        });
      });

      this.cut = this._computeCut();
      this._refreshGains(this.nodes.map((_, index) => index));
    }

    _computeCut() {
      return this.netCounts.reduce(
        (total, counts) => total + (isCutCounts(counts) ? 1 : 0),
        0,
      );
    }

    _gainBreakdown(index) {
      const side = this.sides[index];
      const other = 1 - side;
      let fs = 0;
      let te = 0;

      this.incident[index].forEach((netIndex) => {
        const net = this.nets[netIndex];
        const counts = this.netCounts[netIndex];
        const sameSide = counts[side];
        const otherSide = counts[other];

        if (otherSide === 0) {
          // The whole net is on this side. Moving v tears the net open.
          if (net.cells.length > 1) te += 1;
        } else if (sameSide === 1) {
          // v is the net's only cell on this side. Moving it closes the cut.
          fs += 1;
        }
      });

      return { fs, te, gain: fs - te };
    }

    _refreshGains(indices) {
      indices.forEach((index) => {
        const breakdown = this._gainBreakdown(index);
        const node = this.nodes[index];
        node.fs = breakdown.fs;
        node.te = breakdown.te;
        node.gain = breakdown.gain;
      });
    }

    _refreshGainsAround(index) {
      const affected = new Set([index]);
      this.incident[index].forEach((netIndex) => {
        this.nets[netIndex].cells.forEach((cellIndex) => affected.add(cellIndex));
      });
      this._refreshGains(affected);
    }

    /* ------------------------------------------------------------------ */
    /* Public state                                                       */
    /* ------------------------------------------------------------------ */

    reset() {
      this._loadPartition(this.initialSides);
      this.cut = this.initialCut;
      this.pass = 0;
      this.status = STATUS.READY;
      this.passStartCut = this.initialCut;
      this.passBestCut = this.initialCut;
      this.passBestSides = this.initialSides.slice();
      this.passBestMoveCount = 0;
      this.passMoves = [];
      this.passCumulativeGain = 0;
      this.bestCut = this.initialCut;
      this.bestSides = this.initialSides.slice();
      this.totalMoves = 0;
      this.acceptedMoves = 0;
      this.moveSerial = 0;
      this.log = [];
      this.lastPassImprovement = null;
      return this;
    }

    setSlack(slack) {
      this.slack = clamp(Math.round(Number(slack) || 0), 0, this.nodes.length);
      this.maxSize = Math.min(
        this.nodes.length,
        Math.ceil(this.nodes.length / 2) + this.slack,
      );
      this.minSize = Math.max(1, this.nodes.length - this.maxSize);
      this.reset();
      return this;
    }

    /* ------------------------------------------------------------------ */
    /* FM selection and movement                                          */
    /* ------------------------------------------------------------------ */

    chooseMove() {
      let best = null;

      for (let index = 0; index < this.nodes.length; index += 1) {
        const node = this.nodes[index];
        if (node.locked) continue;
        const from = this.sides[index];
        const to = 1 - from;
        const destinationSize = this.blockSizes[to];
        if (destinationSize + 1 > this.maxSize) continue;
        if (this.blockSizes[from] - 1 < this.minSize) continue;

        const sourceAfter = this.blockSizes[from] - 1;
        const destinationAfter = destinationSize + 1;
        const imbalanceAfter = Math.abs(destinationAfter - sourceAfter);

        if (
          !best ||
          node.gain > best.gain ||
          (node.gain === best.gain && imbalanceAfter < best.imbalanceAfter) ||
          (node.gain === best.gain &&
            imbalanceAfter === best.imbalanceAfter &&
            index < best.index)
        ) {
          best = {
            index,
            nodeId: node.id,
            label: node.label,
            gain: node.gain,
            fs: node.fs,
            te: node.te,
            from,
            to,
            destinationSize,
            destinationAfter,
            imbalanceAfter,
          };
        }
      }

      return best;
    }

    peekMove() {
      if (this.status !== STATUS.ACTIVE) return null;
      return this.chooseMove();
    }

    beginPass() {
      if (this.status === STATUS.ACTIVE) return { type: "noop", state: this.status };
      if (this.status === STATUS.DONE) return { type: "done", cut: this.cut };

      this.pass += 1;
      this.status = STATUS.ACTIVE;
      this.nodes.forEach((node) => {
        node.locked = false;
      });
      this._refreshGains(this.nodes.map((_, index) => index));
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
        cells: this.nodes.length,
        nets: this.nets.length,
        maxSize: this.maxSize,
      };
      this.log.push(event);
      return event;
    }

    _applyMove(candidate) {
      const index = candidate.index;
      const node = this.nodes[index];
      const from = this.sides[index];
      const to = 1 - from;
      const gain = node.gain;
      const cutBefore = this.cut;
      if (node.locked) throw new Error("Attempted to move a locked cell.");
      if (this.blockSizes[to] + 1 > this.maxSize) {
        throw new Error("Attempted a move that violates the balance cap.");
      }
      if (this.blockSizes[from] - 1 < this.minSize) {
        throw new Error("Attempted a move that drains the source block.");
      }

      this.sides[index] = to;
      node.side = to;
      node.locked = true;
      this.blockSizes[from] -= 1;
      this.blockSizes[to] += 1;

      this.incident[index].forEach((netIndex) => {
        this.netCounts[netIndex][from] -= 1;
        this.netCounts[netIndex][to] += 1;
      });
      this._refreshGainsAround(index);
      this.cut = this._computeCut();
      this.passCumulativeGain += gain;
      this.totalMoves += 1;
      this.moveSerial = (this.moveSerial ?? 0) + 1;

      const move = {
        type: "move",
        serial: this.moveSerial,
        pass: this.pass,
        indexInPass: this.passMoves.length + 1,
        index,
        nodeId: node.id,
        label: node.label,
        from,
        to,
        gain,
        cutBefore,
        cut: this.cut,
        cumulativeGain: this.passCumulativeGain,
        lockedCount: this.nodes.filter((item) => item.locked).length,
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

      return { type: "move", pass: this.pass, move, cut: this.cut };
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

      this._loadPartition(this.passBestSides);
      this.cut = bestCut;
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
      };
      this.log.push(event);
      return event;
    }

    /**
     * Advance one meaningful step:
     *   ready/between -> begin a pass
     *   active        -> move the best eligible cell, or close the pass
     *   done          -> no-op
     */
    advance() {
      if (this.status === STATUS.DONE) {
        return { type: "done", cut: this.cut };
      }
      if (this.status === STATUS.READY || this.status === STATUS.BETWEEN) {
        return this.beginPass();
      }
      const candidate = this.chooseMove();
      if (!candidate) return this.finishPass();
      return this._applyMove(candidate);
    }

    /* ------------------------------------------------------------------ */
    /* Inspection helpers                                                 */
    /* ------------------------------------------------------------------ */

    getCellDetails(nodeId) {
      const index = this.indexOf.get(String(nodeId));
      if (index === undefined) return null;
      const node = this.nodes[index];
      const breakdown = this._gainBreakdown(index);
      const incidentNets = this.incident[index].map((netIndex) => {
        const net = this.nets[netIndex];
        const counts = this.netCounts[netIndex];
        const cut = isCutCounts(counts);
        const critical = isCriticalCounts(counts);
        return {
          id: net.id,
          label: net.label,
          cells: net.cells.map((cellIndex) => this.nodes[cellIndex].label),
          cut,
          critical,
          criticalForCell: cut && counts[node.side] === 1,
          criticalSides: [cut && counts[0] === 1, cut && counts[1] === 1],
          counts: counts.slice(),
          size: net.cells.length,
        };
      });

      return {
        id: node.id,
        label: node.label,
        description: node.description,
        side: node.side,
        locked: node.locked,
        gain: breakdown.gain,
        fs: breakdown.fs,
        te: breakdown.te,
        criticalForCell: breakdown.fs,
        cutNets: incidentNets.filter((net) => net.cut).length,
        incidentNets,
        blockSize: this.blockSizes[node.side],
      };
    }

    getNetDetails(netId) {
      const netIndex = this.nets.findIndex((net) => net.id === String(netId));
      if (netIndex === -1) return null;
      const net = this.nets[netIndex];
      const counts = this.netCounts[netIndex];
      const cut = isCutCounts(counts);
      const criticalSides = [cut && counts[0] === 1, cut && counts[1] === 1];
      return {
        id: net.id,
        label: net.label,
        cut,
        critical: isCriticalCounts(counts),
        criticalSides,
        counts: counts.slice(),
        size: net.cells.length,
        cells: net.cells.map((cellIndex) => {
          const node = this.nodes[cellIndex];
          return {
            id: node.id,
            label: node.label,
            side: node.side,
            critical: criticalSides[node.side],
          };
        }),
      };
    }

    getGainQueue(limit = 12) {
      const candidates = [];
      for (let index = 0; index < this.nodes.length; index += 1) {
        const node = this.nodes[index];
        if (node.locked) continue;
        const to = 1 - this.sides[index];
        if (this.blockSizes[to] + 1 > this.maxSize) continue;
        if (this.blockSizes[this.sides[index]] - 1 < this.minSize) continue;
        const imbalanceAfter = Math.abs(
          (this.blockSizes[to] + 1) - (this.blockSizes[this.sides[index]] - 1),
        );
        candidates.push({
          index,
          nodeId: node.id,
          label: node.label,
          gain: node.gain,
          fs: node.fs,
          te: node.te,
          from: this.sides[index],
          to,
          destinationSize: this.blockSizes[to],
          imbalanceAfter,
        });
      }

      candidates.sort(
        (a, b) =>
          b.gain - a.gain ||
          a.imbalanceAfter - b.imbalanceAfter ||
          a.index - b.index,
      );
      return candidates.slice(0, limit);
    }

    getMetrics() {
      return {
        cut: this.cut,
        criticalNets: this.netCounts.reduce(
          (total, counts) => total + (isCriticalCounts(counts) ? 1 : 0),
          0,
        ),
        initialCut: this.initialCut,
        improvement: this.initialCut - this.cut,
        bestCut: this.bestCut,
        pass: this.pass,
        status: this.status,
        slack: this.slack,
        maxSize: this.maxSize,
        minSize: this.minSize,
        blockSizes: this.blockSizes.slice(),
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
    FMEngine,
    STATUS,
    balancedSplit,
    normalizeGraph,
    version: "1.0.0",
  };
});
