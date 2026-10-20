/*
 * Example hypergraphs and a seeded random netlist generator for FM Lab.
 */
(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.FMPresets = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  function ids(labels) {
    return labels.split("").map((id) => ({ id }));
  }

  function netsFrom(rows) {
    return rows.map((cells, index) => ({
      id: `n${index + 1}`,
      cells,
    }));
  }

  const signalNodes = ids("ABCDEFGHIJKL");
  const signalNets = netsFrom([
    ["A", "B", "C"],
    ["A", "D"],
    ["B", "E"],
    ["C", "F"],
    ["D", "E", "H"],
    ["E", "G"],
    ["F", "G", "I"],
    ["G", "H"],
    ["H", "J", "K"],
    ["I", "J"],
    ["J", "L"],
    ["K", "L"],
    ["A", "L"],
    ["C", "K"],
    ["D", "I"],
  ]);

  const clusterNodes = ids("ABCDEFGH");
  const clusterNets = netsFrom([
    ["A", "B"],
    ["B", "C"],
    ["C", "D"],
    ["D", "A"],
    ["E", "F"],
    ["F", "G"],
    ["G", "H"],
    ["H", "E"],
    ["A", "E"],
    ["B", "F"],
    ["D", "H"],
  ]);

  const gridNodes = ids("ABCDEFGHIJKL");
  const gridEdges = [];
  const width = 4;
  const height = 3;
  for (let row = 0; row < height; row += 1) {
    for (let col = 0; col < width; col += 1) {
      const index = row * width + col;
      if (col < width - 1) {
        gridEdges.push([gridNodes[index].id, gridNodes[index + 1].id]);
      }
      if (row < height - 1) {
        gridEdges.push([gridNodes[index].id, gridNodes[index + width].id]);
      }
    }
  }
  const gridNets = gridEdges.map((cells, index) => ({
    id: `n${index + 1}`,
    cells,
  }));

  const PRESETS = [
    {
      id: "signal",
      title: "Signal hypergraph",
      short: "12 cells · 15 nets",
      description:
        "A mixed-size netlist. Alternating cells start mixed together; FM pulls the clusters apart.",
      graph: {
        name: "Signal hypergraph",
        description:
          "A 12-cell, 15-net hypergraph with three loosely coupled clusters and two bridge nets.",
        nodes: signalNodes,
        nets: signalNets,
        initialPartition: signalNodes.map((_, index) => index % 2),
      },
    },
    {
      id: "clusters",
      title: "Two clusters",
      short: "8 cells · 11 nets",
      description:
        "Two four-cell rings joined by bridges. A compact tutorial for watching gains and rollback.",
      graph: {
        name: "Two clusters",
        description:
          "Two tightly connected rings linked by three bridge nets. Alternating blocks cut every ring.",
        nodes: clusterNodes,
        nets: clusterNets,
        initialPartition: clusterNodes.map((_, index) => index % 2),
      },
    },
    {
      id: "grid",
      title: "4 × 3 grid",
      short: "12 cells · 17 nets",
      description:
        "A planar mesh. The alternating start slices the grid; FM finds a clean spatial split.",
      graph: {
        name: "4 × 3 grid",
        description:
          "A planar 4 by 3 mesh with 17 two-terminal nets and an alternating initial cut.",
        nodes: gridNodes,
        nets: gridNets,
        initialPartition: gridNodes.map((_, index) => index % 2),
      },
    },
  ];

  /* ---------------------------------------------------------------- */
  /* Seeded random generation                                         */
  /* ---------------------------------------------------------------- */

  function mulberry32(seed) {
    let value = seed >>> 0;
    return function rng() {
      value += 0x6d2b79f5;
      let t = value;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function randomSeed() {
    return 100000 + Math.floor(Math.random() * 900000);
  }

  function shuffle(items, rng) {
    for (let i = items.length - 1; i > 0; i -= 1) {
      const j = Math.floor(rng() * (i + 1));
      [items[i], items[j]] = [items[j], items[i]];
    }
    return items;
  }

  function edgeKey(a, b) {
    return a < b ? `${a}|${b}` : `${b}|${a}`;
  }

  /**
   * Build a connected random graph (with a few three-terminal hypernets),
   * plus a balanced random initial partition.
   */
  function makeRandomGraph(seedInput) {
    const seed = Number(seedInput) || randomSeed();
    const rng = mulberry32(seed);
    const count = 10 + Math.floor(rng() * 5);
    const labels = Array.from({ length: count }, (_, index) =>
      String.fromCharCode(65 + index),
    );
    const nodes = labels.map((id) => ({ id }));
    const edgePairs = [];
    const seenEdges = new Set();
    const seenNets = new Set();

    function addEdge(a, b) {
      if (a === b) return false;
      const key = edgeKey(a, b);
      if (seenEdges.has(key)) return false;
      seenEdges.add(key);
      edgePairs.push([a, b]);
      seenNets.add(key);
      return true;
    }

    // A random spanning tree guarantees a connected netlist.
    const order = shuffle(labels.slice(), rng);
    for (let i = 1; i < order.length; i += 1) {
      const parent = order[Math.floor(rng() * i)];
      addEdge(parent, order[i]);
    }

    // Add local and cross-cluster connections.
    const extraTarget = Math.round(count * 0.85);
    let guard = 0;
    while (edgePairs.length < extraTarget && guard < 400) {
      guard += 1;
      const a = labels[Math.floor(rng() * count)];
      const b = labels[Math.floor(rng() * count)];
      const distance = Math.abs(labels.indexOf(a) - labels.indexOf(b));
      if (distance > 4 && rng() > 0.35) continue;
      addEdge(a, b);
    }

    const rawNets = edgePairs.map((cells, index) => ({
      id: `e${index + 1}`,
      cells,
    }));

    // A couple of hypernets give the solver more than graph edges to chew on.
    const hyperCount = 1 + Math.floor(rng() * 3);
    for (let h = 0; h < hyperCount; h += 1) {
      const picks = shuffle(labels.slice(), mulberry32(seed + h * 997)).slice(0, 3);
      const key = picks.slice().sort().join("|");
      if (seenNets.has(key)) continue;
      seenNets.add(key);
      rawNets.push({
        id: `h${h + 1}`,
        cells: picks,
        label: `hyper ${h + 1}`,
      });
    }

    const splitOrder = shuffle(
      Array.from({ length: count }, (_, index) => index),
      mulberry32(seed + 7919),
    );
    const initialPartition = new Array(count).fill(0);
    splitOrder.forEach((index, ordinal) => {
      initialPartition[index] = ordinal % 2;
    });

    return {
      seed,
      graph: {
        name: `Random netlist #${seed}`,
        description: `${count} cells, ${edgePairs.length} two-terminal nets and ${hyperCount} hypernets. Generated from seed ${seed}.`,
        nodes,
        nets: rawNets,
        initialPartition,
      },
    };
  }

  function getPreset(id) {
    return PRESETS.find((preset) => preset.id === id) ?? PRESETS[0];
  }

  return {
    PRESETS,
    getPreset,
    makeRandomGraph,
    mulberry32,
    randomSeed,
  };
});
