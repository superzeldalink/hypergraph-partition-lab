(() => {
  "use strict";

  const { FMEngine, STATUS, balancedSplit } = window.FMCore;
  const { PRESETS, getPreset, makeRandomGraph, mulberry32, randomSeed } = window.FMPresets;

  const SVG_NS = "http://www.w3.org/2000/svg";
  const SELECTED_TAB = "log";
  const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

  const el = {
    presetSelect: document.getElementById("presetSelect"),
    randomBtn: document.getElementById("randomBtn"),
    dataBtn: document.getElementById("dataBtn"),
    helpBtn: document.getElementById("helpBtn"),
    helpDialog: document.getElementById("helpDialog"),
    dataDialog: document.getElementById("dataDialog"),
    graphJson: document.getElementById("graphJson"),
    dataError: document.getElementById("dataError"),
    applyGraphBtn: document.getElementById("applyGraphBtn"),
    copyGraphBtn: document.getElementById("copyGraphBtn"),
    graphTitle: document.getElementById("graphTitle"),
    graphMeta: document.getElementById("graphMeta"),
    statusPill: document.getElementById("statusPill"),
    statusText: document.getElementById("statusText"),
    cutValue: document.getElementById("cutValue"),
    cutDelta: document.getElementById("cutDelta"),
    countA: document.getElementById("countA"),
    countB: document.getElementById("countB"),
    capNote: document.getElementById("capNote"),
    balanceA: document.getElementById("balanceA"),
    balanceB: document.getElementById("balanceB"),
    capMarkerLeft: document.getElementById("capMarkerLeft"),
    capMarkerRight: document.getElementById("capMarkerRight"),
    blockACountLabel: document.getElementById("blockACountLabel"),
    blockBCountLabel: document.getElementById("blockBCountLabel"),
    graphSvg: document.getElementById("graphSvg"),
    boardStage: document.getElementById("boardStage"),
    blockABg: document.getElementById("blockABg"),
    blockBBg: document.getElementById("blockBBg"),
    cutLine: document.getElementById("cutLine"),
    blockAKicker: document.getElementById("blockAKicker"),
    blockBKicker: document.getElementById("blockBKicker"),
    cutFlag: document.getElementById("cutFlag"),
    edgesLayer: document.getElementById("edgesLayer"),
    nodesLayer: document.getElementById("nodesLayer"),
    nextStep: document.getElementById("nextStep"),
    phaseStrip: document.getElementById("phaseStrip"),
    playBtn: document.getElementById("playBtn"),
    playLabel: document.getElementById("playLabel"),
    stepBtn: document.getElementById("stepBtn"),
    passBtn: document.getElementById("passBtn"),
    resetBtn: document.getElementById("resetBtn"),
    resplitBtn: document.getElementById("resplitBtn"),
    speedRange: document.getElementById("speedRange"),
    speedOut: document.getElementById("speedOut"),
    slackRange: document.getElementById("slackRange"),
    slackOut: document.getElementById("slackOut"),
    slackHelp: document.getElementById("slackHelp"),
    metricCut: document.getElementById("metricCut"),
    metricImprovement: document.getElementById("metricImprovement"),
    metricPass: document.getElementById("metricPass"),
    metricPassState: document.getElementById("metricPassState"),
    metricKept: document.getElementById("metricKept"),
    metricAttempted: document.getElementById("metricAttempted"),
    metricGain: document.getElementById("metricGain"),
    metricBestPrefix: document.getElementById("metricBestPrefix"),
    inspectorHint: document.getElementById("inspectorHint"),
    inspectorBody: document.getElementById("inspectorBody"),
    tabPanel: document.getElementById("tabPanel"),
    tabs: Array.from(document.querySelectorAll(".tab")),
    toast: document.getElementById("toast"),
    svgDesc: document.getElementById("svgDesc"),
  };

  const state = {
    engine: null,
    graph: null,
    presetId: "signal",
    currentSeed: null,
    selectedId: null,
    tab: SELECTED_TAB,
    playing: false,
    playMode: "all",
    timer: null,
    raf: null,
    speed: 1,
    lastEvent: null,
    positions: new Map(),
    nodeEls: new Map(),
    edgeEls: [],
    layout: null,
    toastTimer: null,
  };

  const phaseEls = Array.from(el.phaseStrip.querySelectorAll(".phase"));

  /* ------------------------------------------------------------------ */
  /* Small utilities                                                     */
  /* ------------------------------------------------------------------ */

  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, (character) => {
      const entities = {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      };
      return entities[character];
    });
  }

  function signed(value) {
    return value > 0 ? `+${value}` : String(value);
  }

  function blockName(side) {
    return side === 0 ? "A" : "B";
  }

  function blockWord(side) {
    return side === 0 ? "Block A" : "Block B";
  }

  function svgElement(tag, attributes = {}) {
    const element = document.createElementNS(SVG_NS, tag);
    Object.entries(attributes).forEach(([key, value]) => {
      element.setAttribute(key, value);
    });
    return element;
  }

  function showToast(message) {
    el.toast.textContent = message;
    el.toast.classList.add("is-visible");
    clearTimeout(state.toastTimer);
    state.toastTimer = setTimeout(() => {
      el.toast.classList.remove("is-visible");
    }, 2400);
  }

  function prefersReducedMotion() {
    return motionQuery.matches;
  }

  function queueLabel(details) {
    return details.locked ? "locked" : "unlocked";
  }

  /* ------------------------------------------------------------------ */
  /* Loading examples                                                    */
  /* ------------------------------------------------------------------ */

  function populatePresetSelect() {
    const fragment = document.createDocumentFragment();
    PRESETS.forEach((preset) => {
      const option = document.createElement("option");
      option.value = preset.id;
      option.textContent = preset.title;
      fragment.appendChild(option);
    });
    const randomOption = document.createElement("option");
    randomOption.value = "random";
    randomOption.textContent = "Random netlist";
    fragment.appendChild(randomOption);
    const customOption = document.createElement("option");
    customOption.value = "custom";
    customOption.textContent = "Custom JSON…";
    fragment.appendChild(customOption);
    el.presetSelect.appendChild(fragment);
  }

  function loadPreset(id) {
    const preset = getPreset(id);
    state.presetId = preset.id;
    state.currentSeed = null;
    el.presetSelect.value = preset.id;
    loadGraph(preset.graph);
  }

  function loadRandom(seed) {
    const generated = makeRandomGraph(seed);
    state.presetId = "random";
    state.currentSeed = generated.seed;
    el.presetSelect.value = "random";
    loadGraph(generated.graph);
    showToast(`Generated random netlist #${generated.seed}`);
  }

  function loadGraph(graph) {
    stopPlayback();
    state.graph = JSON.parse(JSON.stringify(graph));
    state.selectedId = null;
    state.lastEvent = null;
    state.engine = new FMEngine(state.graph, {
      slack: Number(el.slackRange.value),
    });
    buildScene();
    renderAll({ animate: false });
  }

  function resplitStart() {
    if (!state.engine) return;
    stopPlayback();
    const seed = Date.now() % 2147483647;
    const sides = balancedSplit(state.graph.nodes.length, mulberry32(seed));
    state.graph.initialPartition = sides;
    state.selectedId = null;
    state.lastEvent = null;
    state.engine = new FMEngine(state.graph, {
      slack: Number(el.slackRange.value),
    });
    buildScene();
    renderAll({ animate: false });
    showToast("Balanced start re-split");
  }

  /* ------------------------------------------------------------------ */
  /* Graph JSON                                                          */
  /* ------------------------------------------------------------------ */

  function serializeGraph() {
    const engine = state.engine;
    const data = {
      name: state.graph.name || "Hypergraph",
      description: state.graph.description || "",
      nodes: engine.nodes.map((node) => ({ id: node.id, label: node.label })),
      nets: engine.nets.map((net) => ({
        id: net.id,
        label: net.label,
        cells: net.cells.map((index) => engine.nodes[index].id),
      })),
      initialPartition: engine.initialSides.slice(),
    };
    return JSON.stringify(data, null, 2);
  }

  function openDataDialog() {
    el.graphJson.value = serializeGraph();
    el.dataError.textContent = "";
    if (typeof el.dataDialog.showModal === "function") {
      el.dataDialog.showModal();
    } else {
      el.dataDialog.setAttribute("open", "");
    }
    el.graphJson.focus();
    el.graphJson.setSelectionRange(0, 0);
    requestAnimationFrame(() => {
      el.graphJson.scrollTop = 0;
    });
  }

  function applyGraphData() {
    el.dataError.textContent = "";
    let parsed;
    try {
      parsed = JSON.parse(el.graphJson.value);
    } catch (error) {
      el.dataError.textContent = `JSON error: ${error.message}`;
      return;
    }

    try {
      if (!parsed || !Array.isArray(parsed.nodes) || parsed.nodes.length === 0) {
        throw new Error("The graph needs a non-empty nodes array.");
      }
      if (!Array.isArray(parsed.nets) && !Array.isArray(parsed.edges)) {
        throw new Error("The graph needs a nets array.");
      }
      const temp = new FMEngine(parsed, { slack: Number(el.slackRange.value) });
      if (temp.nets.length === 0) {
        throw new Error("Add at least one net with two or more valid cell IDs.");
      }

      const imported = {
        name: String(parsed.name || "Imported hypergraph"),
        description: String(
          parsed.description ||
            `Imported hypergraph with ${temp.nodes.length} cells and ${temp.nets.length} nets.`,
        ),
        nodes: temp.nodes.map((node) => ({ id: node.id, label: node.label })),
        nets: temp.nets.map((net) => ({
          id: net.id,
          label: net.label,
          cells: net.cells.map((index) => temp.nodes[index].id),
        })),
        initialPartition: temp.initialSides.slice(),
      };

      state.presetId = "custom";
      state.currentSeed = null;
      el.presetSelect.value = "custom";
      el.dataDialog.close();
      loadGraph(imported);
      showToast(`Loaded ${imported.nodes.length} cells · ${imported.nets.length} nets`);
    } catch (error) {
      el.dataError.textContent = error.message || "Could not load this graph.";
    }
  }

  async function copyGraphData() {
    const text = serializeGraph();
    try {
      await navigator.clipboard.writeText(text);
      showToast("Copied graph JSON");
    } catch (error) {
      el.graphJson.focus();
      el.graphJson.select();
      try {
        document.execCommand("copy");
        showToast("Copied graph JSON");
      } catch (copyError) {
        showToast("Clipboard access was blocked");
      }
    }
  }

  /* ------------------------------------------------------------------ */
  /* Scene construction                                                  */
  /* ------------------------------------------------------------------ */

  function getCanvasFrame() {
    const stageWidth = el.boardStage.clientWidth || 1000;
    if (stageWidth < 620) {
      return {
        viewWidth: 560,
        divider: 280,
        leftX: 150,
        rightX: 410,
        labelX: 24,
        labelRight: 536,
      };
    }
    return {
      viewWidth: 1000,
      divider: 500,
      leftX: 270,
      rightX: 730,
      labelX: 48,
      labelRight: 952,
    };
  }

  function applyCanvasFrame(frame) {
    const { viewWidth, divider, labelX, labelRight } = frame;
    el.graphSvg.setAttribute("viewBox", `0 0 ${viewWidth} 640`);
    el.blockABg.setAttribute("width", divider);
    el.blockBBg.setAttribute("x", divider);
    el.blockBBg.setAttribute("width", viewWidth - divider);
    el.cutLine.setAttribute("x1", divider);
    el.cutLine.setAttribute("x2", divider);
    el.cutFlag.setAttribute("x", divider);
    el.blockAKicker.setAttribute("x", labelX);
    el.blockBKicker.setAttribute("x", labelRight);
    el.blockACountLabel.setAttribute("x", labelX);
    el.blockBCountLabel.setAttribute("x", labelRight);
  }

  function buildScene() {
    cancelAnimation();
    state.nodeEls.clear();
    state.edgeEls = [];
    state.positions.clear();
    el.edgesLayer.replaceChildren();
    el.nodesLayer.replaceChildren();

    const frame = getCanvasFrame();
    applyCanvasFrame(frame);

    const nodes = state.engine.nodes;
    const count = nodes.length;
    const top = 108;
    const bottom = 608;
    const available = bottom - top;
    const maxStep = count <= 7 ? 66 : 58;
    const step = count > 1 ? Math.min(maxStep, available / (count - 1)) : 0;
    const span = step * Math.max(0, count - 1);
    const startY = top + (available - span) / 2;
    const radius =
      count <= 7
        ? 21
        : count <= 9
          ? 19
          : count <= 11
            ? 18
            : count <= 12
              ? 17
              : count <= 14
                ? 15
                : Math.min(13, Math.max(5.5, step * 0.36));

    state.layout = {
      step,
      startY,
      radius,
      leftX: frame.leftX,
      rightX: frame.rightX,
      gainWidth: 36,
      viewWidth: frame.viewWidth,
    };

    state.engine.nets.forEach((net, netIndex) => {
      const group = svgElement("g", { class: "net-group" });
      const title = svgElement("title");
      group.appendChild(title);

      if (net.cells.length === 2) {
        const path = svgElement("path", {
          class: "net",
          "vector-effect": "non-scaling-stroke",
        });
        group.appendChild(path);
        state.edgeEls.push({
          net,
          netIndex,
          title,
          twoTerminal: true,
          paths: [path],
          hub: null,
        });
      } else {
        const paths = net.cells.map(() => {
          const path = svgElement("path", {
            class: "net",
            "vector-effect": "non-scaling-stroke",
          });
          group.appendChild(path);
          return path;
        });
        const hub = svgElement("rect", {
          class: "net-hub",
          x: -4,
          y: -4,
          width: 8,
          height: 8,
          rx: 1,
          "vector-effect": "non-scaling-stroke",
        });
        group.appendChild(hub);
        state.edgeEls.push({
          net,
          netIndex,
          title,
          twoTerminal: false,
          paths,
          hub,
        });
      }
      el.edgesLayer.appendChild(group);
    });

    const initialTargets = computeTargets();
    nodes.forEach((node, index) => {
      const y = initialTargets.get(node.id).y;
      const x = initialTargets.get(node.id).x;
      state.positions.set(node.id, { x, y });

      const group = svgElement("g", {
        class: "cell block-a",
        "data-id": node.id,
        tabindex: "0",
        role: "button",
      });

      const title = svgElement("title");
      group.appendChild(title);

      const candidateRing = svgElement("circle", {
        class: "candidate-ring",
        r: radius + 11,
      });
      const halo = svgElement("circle", {
        class: "cell-halo",
        r: radius + 7,
      });
      const body = svgElement("circle", {
        class: "cell-body",
        r: radius,
      });
      const inner = svgElement("circle", {
        class: "cell-inner",
        r: Math.max(7, radius - 4),
      });
      const baseFont = Math.min(15, Math.max(6, radius * 0.9));
      const labelFont =
        node.label.length > 2
          ? Math.min(10, Math.max(5, baseFont * 0.72))
          : node.label.length === 2
            ? Math.min(12, Math.max(6, baseFont * 0.85))
            : baseFont;
      const label = svgElement("text", {
        class: "cell-label",
        x: 0,
        y: 0,
        "font-size": labelFont.toFixed(1),
      });
      label.textContent = node.label;

      const gainGroup = svgElement("g", {
        class: "gain-badge",
        transform: `translate(${radius + 4} -9)`,
      });
      const gainRect = svgElement("rect", {
        x: 0,
        y: 0,
        width: state.layout.gainWidth,
        height: 18,
        rx: 9,
      });
      const gainText = svgElement("text", {
        x: state.layout.gainWidth / 2,
        y: 9.5,
      });
      gainGroup.append(gainRect, gainText);

      const lockGroup = svgElement("g", {
        class: "lock-icon",
        transform: `translate(${radius - 4} ${radius - 4})`,
      });
      const lockBg = svgElement("circle", { class: "lock-bg", r: 7 });
      const lockShackle = svgElement("path", {
        class: "lock-shackle",
        d: "M-2.4 -0.6v-1.3a2.4 2.4 0 0 1 4.8 0v1.3",
      });
      const lockBody = svgElement("path", {
        class: "lock-body",
        d: "M-3.2 -0.6h6.4v3.8h-6.4z",
      });
      lockGroup.append(lockBg, lockShackle, lockBody);

      group.append(candidateRing, halo, body, inner, label, gainGroup, lockGroup);
      group.dataset.title = title;
      group.addEventListener("click", (event) => {
        event.stopPropagation();
        selectNode(node.id);
      });
      group.addEventListener("keydown", (event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          selectNode(node.id);
        }
      });

      state.nodeEls.set(node.id, {
        group,
        title,
        label,
        gainGroup,
        gainText,
        candidateRing,
      });
      el.nodesLayer.appendChild(group);
    });

    applyPositions();
    drawEdges();
  }

  function computeTargets() {
    const targets = new Map();
    const nodes = state.engine.nodes;
    const { startY, step, radius, leftX, rightX } = state.layout;
    nodes.forEach((node, index) => {
      targets.set(node.id, {
        x: node.side === 0 ? leftX : rightX,
        y: startY + index * step,
        radius,
      });
    });
    return targets;
  }

  function applyPositions() {
    state.nodeEls.forEach((entry, id) => {
      const position = state.positions.get(id);
      if (!position) return;
      entry.group.setAttribute(
        "transform",
        `translate(${position.x.toFixed(2)} ${position.y.toFixed(2)})`,
      );
    });
  }

  function moveScene(animate) {
    const targets = computeTargets();
    const duration = prefersReducedMotion()
      ? 0
      : Math.max(120, Math.min(430, 520 / state.speed));

    if (!animate || duration === 0) {
      cancelAnimation();
      targets.forEach((target, id) => {
        state.positions.set(id, { x: target.x, y: target.y });
      });
      applyPositions();
      drawEdges();
      return;
    }

    cancelAnimation();
    const starts = new Map();
    targets.forEach((target, id) => {
      const current = state.positions.get(id) || { x: target.x, y: target.y };
      starts.set(id, { x: current.x, y: current.y });
    });
    const started = performance.now();

    const frame = (now) => {
      const progress = Math.min(1, (now - started) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      targets.forEach((target, id) => {
        const start = starts.get(id);
        state.positions.set(id, {
          x: start.x + (target.x - start.x) * eased,
          y: start.y + (target.y - start.y) * eased,
        });
      });
      applyPositions();
      drawEdges();
      if (progress < 1) {
        state.raf = requestAnimationFrame(frame);
      } else {
        state.raf = null;
      }
    };
    state.raf = requestAnimationFrame(frame);
  }

  function cancelAnimation() {
    if (state.raf) {
      cancelAnimationFrame(state.raf);
      state.raf = null;
    }
  }

  /* ------------------------------------------------------------------ */
  /* Edge rendering                                                      */
  /* ------------------------------------------------------------------ */

  function drawEdges() {
    if (!state.engine) return;
    const selectedId = state.selectedId;
    const selectedIndex =
      selectedId !== null ? state.engine.indexOf.get(String(selectedId)) : undefined;
    const selectedNets = new Set(
      selectedIndex === undefined ? [] : state.engine.incident[selectedIndex],
    );

    state.edgeEls.forEach((edge) => {
      const { net, netIndex } = edge;
      let cut = false;
      let hasA = false;
      let hasB = false;
      const labels = [];
      net.cells.forEach((cellIndex) => {
        const node = state.engine.nodes[cellIndex];
        labels.push(node.label);
        if (node.side === 0) hasA = true;
        else hasB = true;
      });
      cut = hasA && hasB;
      const incident = selectedNets.has(netIndex);

      edge.title.textContent = `${net.label} · ${labels.join(" / ")} · ${
        cut ? "cut" : "internal"
      }`;

      if (edge.twoTerminal) {
        const first = state.engine.nodes[net.cells[0]];
        const second = state.engine.nodes[net.cells[1]];
        const p1 = state.positions.get(first.id);
        const p2 = state.positions.get(second.id);
        if (!p1 || !p2) return;
        const sameSide = first.side === second.side;
        let controlX;
        let controlY;
        if (sameSide) {
          // Nodes in one block share an x coordinate. Bow internal nets out
          // toward the page edge so short vertical links stay visible.
          const offset = 42 + (netIndex % 3) * 12;
          controlX = (p1.x + p2.x) / 2 + (first.side === 0 ? -offset : offset);
          controlY = (p1.y + p2.y) / 2;
        } else {
          const dx = p2.x - p1.x;
          const dy = p2.y - p1.y;
          const length = Math.hypot(dx, dy) || 1;
          const curve = ((netIndex % 5) - 2) * 5;
          controlX = (p1.x + p2.x) / 2 + (-dy / length) * curve;
          controlY = (p1.y + p2.y) / 2 + (dx / length) * curve;
        }
        const path = edge.paths[0];
        path.setAttribute(
          "d",
          `M ${p1.x.toFixed(2)} ${p1.y.toFixed(2)} Q ${controlX.toFixed(2)} ${controlY.toFixed(
            2,
          )} ${p2.x.toFixed(2)} ${p2.y.toFixed(2)}`,
        );
        path.classList.toggle("is-cut", cut);
        path.classList.toggle("is-incident", incident);
      } else {
        const points = net.cells
          .map((cellIndex) => state.positions.get(state.engine.nodes[cellIndex].id))
          .filter(Boolean);
        if (points.length !== net.cells.length) return;
        let hubX = points.reduce((sum, point) => sum + point.x, 0) / points.length;
        const hubY = points.reduce((sum, point) => sum + point.y, 0) / points.length;
        if (!cut) {
          const side = state.engine.nodes[net.cells[0]].side;
          hubX += side === 0 ? -44 : 44;
        }
        points.forEach((point, pointIndex) => {
          const path = edge.paths[pointIndex];
          path.setAttribute(
            "d",
            `M ${point.x.toFixed(2)} ${point.y.toFixed(2)} L ${hubX.toFixed(2)} ${hubY.toFixed(
              2,
            )}`,
          );
          path.classList.toggle("is-cut", cut);
          path.classList.toggle("is-incident", incident);
        });
        edge.hub.setAttribute("transform", `translate(${hubX.toFixed(2)} ${hubY.toFixed(2)}) rotate(45)`);
        edge.hub.classList.toggle("is-cut", cut);
        edge.hub.classList.toggle("is-incident", incident);
      }
    });
  }

  /* ------------------------------------------------------------------ */
  /* Selection                                                           */
  /* ------------------------------------------------------------------ */

  function selectNode(id) {
    if (!state.engine) return;
    state.selectedId = state.selectedId === id ? null : id;
    renderSceneState();
    updateInspector();
    drawEdges();
  }

  function clearSelection() {
    if (state.selectedId === null) return;
    state.selectedId = null;
    renderSceneState();
    updateInspector();
    drawEdges();
  }

  /* ------------------------------------------------------------------ */
  /* Rendering                                                           */
  /* ------------------------------------------------------------------ */

  function renderAll({ animate = false } = {}) {
    if (!state.engine) return;
    const candidate = state.engine.peekMove();

    moveScene(animate);
    renderGraphHeader();
    renderSceneState();
    renderBoardSummary();
    renderMetrics();
    renderTransport();
    renderNextStep(candidate);
    renderPhaseStrip(candidate);
    updateInspector();
    renderTab();
    renderSliderLabels();

    el.svgDesc.textContent = `Partition with ${state.engine.blockSizes[0]} cells in block A and ${
      state.engine.blockSizes[1]
    } in block B. ${state.engine.cut} nets cross the cut.`;
  }

  function renderGraphHeader() {
    const graph = state.graph;
    const metrics = state.engine.getMetrics();
    el.graphTitle.textContent = graph.name || "Untitled hypergraph";
    el.graphTitle.title = graph.description || "";
    const seedText = state.currentSeed ? ` · seed ${state.currentSeed}` : "";
    const slackText = ` · cap ${metrics.maxSize}`;
    el.graphMeta.textContent = `${graph.nodes.length} cells · ${graph.nets.length} nets${slackText}${seedText}`;
  }

  function renderSceneState() {
    if (!state.engine) return;
    const engine = state.engine;
    const candidate = engine.peekMove();
    const active = engine.status === STATUS.ACTIVE;

    el.graphSvg.classList.toggle("show-gains", active);

    engine.nodes.forEach((node) => {
      const entry = state.nodeEls.get(node.id);
      if (!entry) return;
      const isSelected = state.selectedId === node.id;
      const isCandidate = Boolean(candidate && candidate.nodeId === node.id);
      entry.group.classList.toggle("block-a", node.side === 0);
      entry.group.classList.toggle("block-b", node.side === 1);
      entry.group.classList.toggle("is-locked", node.locked);
      entry.group.classList.toggle("is-selected", isSelected);
      entry.group.classList.toggle("is-candidate", isCandidate);

      const gainClass =
        node.gain > 0 ? "is-positive" : node.gain < 0 ? "is-negative" : "is-zero";
      entry.gainGroup.classList.remove("is-positive", "is-negative", "is-zero");
      entry.gainGroup.classList.add(gainClass);
      entry.gainText.textContent = signed(node.gain);

      entry.group.setAttribute(
        "aria-label",
        `Cell ${node.label}, ${blockWord(node.side)}, gain ${signed(node.gain)}, ${
          node.locked ? "locked" : "unlocked"
        }. Select to inspect.`,
      );
      entry.group.setAttribute(
        "aria-pressed",
        isSelected ? "true" : "false",
      );
      entry.title.textContent = `Cell ${node.label} · ${blockWord(node.side)} · gain ${signed(
        node.gain,
      )}${node.locked ? " · locked" : ""}`;
    });
  }

  function renderBoardSummary() {
    const metrics = state.engine.getMetrics();
    const [sizeA, sizeB] = metrics.blockSizes;
    const count = state.graph.nodes.length;
    const percentA = count ? (sizeA / count) * 100 : 50;
    const percentB = 100 - percentA;
    const markerLeft = (metrics.maxSize / count) * 100;
    const markerRight = 100 - markerLeft;

    el.countA.textContent = sizeA;
    el.countB.textContent = sizeB;
    el.blockACountLabel.textContent = `${sizeA} ${sizeA === 1 ? "cell" : "cells"}`;
    el.blockBCountLabel.textContent = `${sizeB} ${sizeB === 1 ? "cell" : "cells"}`;
    el.capNote.textContent = `cap ${metrics.maxSize} / block`;
    el.balanceA.style.width = `${percentA}%`;
    el.balanceB.style.width = `${percentB}%`;
    el.capMarkerLeft.style.left = `${markerLeft}%`;
    el.capMarkerRight.style.left = `${markerRight}%`;
    el.capMarkerLeft.title = `Maximum block size: ${metrics.maxSize} cells`;
    el.capMarkerRight.title = `Maximum block size: ${metrics.maxSize} cells`;

    el.cutValue.textContent = metrics.cut;
    if (metrics.improvement > 0) {
      el.cutDelta.textContent = `−${metrics.improvement} from start`;
      el.cutDelta.classList.add("is-good");
    } else {
      el.cutDelta.textContent = `start ${metrics.initialCut}`;
      el.cutDelta.classList.remove("is-good");
    }

    const statusClass =
      metrics.status === STATUS.ACTIVE
        ? "is-active"
        : metrics.status === STATUS.BETWEEN
          ? "is-between"
          : metrics.status === STATUS.DONE
            ? "is-done"
            : "";
    el.statusPill.className = `status-pill ${statusClass}`.trim();

    if (metrics.status === STATUS.READY) {
      el.statusText.textContent = "Ready";
    } else if (metrics.status === STATUS.ACTIVE) {
      el.statusText.textContent =
        metrics.passMoves === 0
          ? `Pass ${metrics.pass} · gains`
          : `Pass ${metrics.pass} · ${metrics.passMoves} ${metrics.passMoves === 1 ? "move" : "moves"}`;
    } else if (metrics.status === STATUS.BETWEEN) {
      el.statusText.textContent = `Pass ${metrics.pass} · improved`;
    } else {
      el.statusText.textContent = "Converged";
    }
  }

  function renderMetrics() {
    const metrics = state.engine.getMetrics();
    el.metricCut.textContent = metrics.cut;
    el.metricImprovement.textContent =
      metrics.improvement > 0 ? `−${metrics.improvement} from start` : `start ${metrics.initialCut}`;
    el.metricImprovement.style.color = metrics.improvement > 0 ? "var(--mint)" : "";

    el.metricPass.textContent = metrics.pass || "0";
    el.metricPassState.textContent =
      metrics.status === STATUS.READY
        ? "ready"
        : metrics.status === STATUS.ACTIVE
          ? "active"
          : metrics.status === STATUS.BETWEEN
            ? "between"
            : "done";

    const keptSoFar =
      metrics.acceptedMoves +
      (metrics.status === STATUS.ACTIVE ? metrics.passBestMoveCount : 0);
    el.metricKept.textContent = keptSoFar;
    el.metricAttempted.textContent = `${metrics.totalMoves} attempted`;

    const passGain =
      metrics.status === STATUS.READY ? 0 : Math.max(0, metrics.passStartCut - metrics.passBestCut);
    el.metricGain.textContent = signed(passGain);
    el.metricGain.classList.toggle("is-positive", passGain > 0);
    el.metricBestPrefix.textContent =
      metrics.status === STATUS.READY ? `start ${metrics.cut}` : `best ${metrics.passBestCut}`;
  }

  function renderTransport() {
    const done = state.engine.status === STATUS.DONE;
    el.playLabel.textContent = state.playing ? "Pause" : done ? "Replay" : "Play";
    el.playBtn.classList.toggle("is-playing", state.playing);
    el.playBtn.title = state.playing ? "Pause (Space)" : done ? "Replay run (Space)" : "Play (Space)";
    el.stepBtn.disabled = state.playing || done;
    el.passBtn.disabled = state.playing || done;
    el.playBtn.disabled = false;
  }

  function renderNextStep(candidate) {
    const engine = state.engine;
    const metrics = engine.getMetrics();
    let html = "";

    if (metrics.status === STATUS.READY) {
      html = `Press <strong>Step</strong> to compute gains for pass 1.`;
    } else if (metrics.status === STATUS.ACTIVE) {
      if (!candidate) {
        html = `All eligible cells are locked. Next step closes the pass and restores its best prefix.`;
      } else if (metrics.passMoves === 0) {
        html = `${engine.nodes.length} gains computed. Next: <strong>${escapeHtml(
          candidate.label,
        )}</strong> (${signed(candidate.gain)}) ${blockName(candidate.from)} → ${blockName(
          candidate.to,
        )}.`;
      } else {
        html = `Next pick: <strong>${escapeHtml(candidate.label)}</strong> (${signed(
          candidate.gain,
        )}) ${blockName(candidate.from)} → ${blockName(candidate.to)} · cut ${metrics.cut}.`;
      }
    } else if (metrics.status === STATUS.BETWEEN) {
      html = `Pass ${metrics.pass} kept <strong>cut ${metrics.cut}</strong> (${metrics.lastPassImprovement} fewer). Next Step starts pass ${metrics.pass + 1}.`;
    } else {
      html = `No improving pass remains. Final cut <strong>${metrics.cut}</strong>, ${metrics.improvement} fewer than the start.`;
    }
    el.nextStep.innerHTML = html;
  }

  function renderPhaseStrip(candidate) {
    const engine = state.engine;
    const status = engine.status;
    let active = -1;
    const complete = new Set();

    if (status === STATUS.READY) {
      active = 0;
    } else if (status === STATUS.ACTIVE) {
      const madeMove = engine.passMoves.length > 0;
      if (!candidate) {
        active = 5;
        [0, 1, 2, 3, 4].forEach((index) => complete.add(index));
      } else if (!madeMove) {
        active = 1;
        complete.add(0);
      } else {
        active = 2;
        [0, 1, 3, 4].forEach((index) => complete.add(index));
      }
    } else if (status === STATUS.BETWEEN) {
      active = 5;
      [0, 1, 2, 3, 4].forEach((index) => complete.add(index));
    } else {
      [0, 1, 2, 3, 4, 5].forEach((index) => complete.add(index));
    }

    phaseEls.forEach((phase, index) => {
      phase.classList.toggle("is-active", index === active);
      phase.classList.toggle("is-complete", complete.has(index));
    });
  }

  function renderSliderLabels() {
    el.speedOut.textContent = `${state.speed.toFixed(1)}×`;
    const metrics = state.engine.getMetrics();
    el.slackOut.textContent =
      metrics.slack === 0 ? "0 cells" : `+${metrics.slack} ${metrics.slack === 1 ? "cell" : "cells"}`;
    if (metrics.minSize === metrics.maxSize) {
      el.slackHelp.textContent = `Strict ${metrics.maxSize}/${state.graph.nodes.length} split. Single-cell moves are blocked.`;
    } else {
      el.slackHelp.textContent = `Blocks stay between ${metrics.minSize} and ${metrics.maxSize} of ${
        state.graph.nodes.length
      } cells.`;
    }
  }

  function updateInspector() {
    if (!state.engine || !state.selectedId) {
      el.inspectorHint.textContent = "click a cell";
      el.inspectorBody.innerHTML = `
        <div class="empty-state">
          <span class="empty-glyph" aria-hidden="true">⌖</span>
          <p>Select any cell to see its gain breakdown and incident nets.</p>
        </div>`;
      return;
    }

    const details = state.engine.getCellDetails(state.selectedId);
    if (!details) {
      state.selectedId = null;
      updateInspector();
      return;
    }

    el.inspectorHint.textContent = queueLabel(details);
    const gainClass =
      details.gain > 0 ? "positive" : details.gain < 0 ? "negative" : "";
    const sideClass = details.side === 1 ? " is-b" : "";
    const netRows = details.incidentNets.length
      ? details.incidentNets
          .map(
            (net) => `
            <div class="net-row">
              <span class="net-id">${escapeHtml(net.id)}</span>
              <span class="net-cells">${net.cells.map(escapeHtml).join(" · ")}</span>
              <span class="net-state ${net.cut ? "is-cut" : ""}">${net.cut ? "cut" : "internal"}</span>
            </div>`,
          )
          .join("")
      : `<div class="net-row"><span class="net-cells">No incident nets</span></div>`;

    el.inspectorBody.innerHTML = `
      <div class="inspector-header">
        <div class="cell-orb${sideClass}">${escapeHtml(details.label)}</div>
        <div class="inspector-identity">
          <div class="inspector-name">
            Cell ${escapeHtml(details.label)}
            <span class="block-chip${sideClass}">Block ${blockName(details.side)}</span>
          </div>
          <div class="inspector-sub">
            <span class="lock-state ${details.locked ? "is-locked" : ""}">${
              details.locked ? "Locked for this pass" : "Unlocked"
            }</span> · ${details.cutNets} incident cut ${details.cutNets === 1 ? "net" : "nets"}
          </div>
        </div>
      </div>
      <div class="inspector-stats">
        <div class="stat-box"><span>Gain</span><b class="${gainClass}">${signed(details.gain)}</b></div>
        <div class="stat-box"><span>FS</span><b>${details.fs}</b></div>
        <div class="stat-box"><span>TE</span><b>${details.te}</b></div>
        <div class="stat-box"><span>Block</span><b>${blockName(details.side)}</b></div>
      </div>
      <div class="net-section-head"><span>Incident nets (${details.incidentNets.length})</span><span>state</span></div>
      <div class="net-list">${netRows}</div>`;
  }

  function renderTab() {
    const engine = state.engine;
    if (!engine) return;
    el.tabs.forEach((tab) => {
      const active = tab.dataset.tab === state.tab;
      tab.classList.toggle("is-active", active);
      tab.setAttribute("aria-selected", active ? "true" : "false");
    });

    if (state.tab === "log") {
      renderLog();
    } else if (state.tab === "gains") {
      renderGainQueue();
    } else {
      renderMethod();
    }
  }

  function renderLog() {
    const log = state.engine.log;
    if (!log.length) {
      el.tabPanel.innerHTML = `
        <div class="tab-empty">
          <b>No moves yet</b>
          <span>Press <kbd>S</kbd> or <kbd>Step</kbd> to open pass 1.</span>
        </div>`;
      return;
    }

    const rows = log
      .map((entry) => {
        if (entry.type === "pass-start") {
          return `<div class="log-divider"><span>Pass ${entry.pass} begins</span><span>cut ${entry.cut}</span></div>`;
        }
        if (entry.type === "move") {
          const gainClass =
            entry.gain > 0 ? "is-positive" : entry.gain < 0 ? "is-negative" : "";
          const fromClass = entry.from === 1 ? " is-b" : "";
          const toClass = entry.to === 1 ? " is-b" : "";
          const rowClasses = [
            "log-row",
            entry.rolledBack ? "is-rolled" : "",
            entry.becameBest ? "is-best" : "",
          ]
            .filter(Boolean)
            .join(" ");
          return `
            <div class="${rowClasses}" title="${
              entry.rolledBack ? "Rolled back at pass end" : "Kept in best prefix"
            }">
              <span class="log-serial">${entry.indexInPass}</span>
              <span class="log-move">
                <span class="log-node">${escapeHtml(entry.label)}</span>
                <span class="side-chip${fromClass}">${blockName(entry.from)}</span>
                <span class="log-route">→</span>
                <span class="side-chip${toClass}">${blockName(entry.to)}</span>
                ${entry.becameBest ? `<span class="log-best-mark">BEST</span>` : ""}
              </span>
              <span class="log-gain ${gainClass}">${signed(entry.gain)}</span>
              <span class="log-cut">${entry.cutBefore}→${entry.cut}</span>
            </div>`;
        }
        if (entry.type === "pass-end") {
          const improved = entry.improvement > 0;
          const summaryClass = improved ? "log-summary" : "log-summary is-stalled";
          return `
            <div class="${summaryClass}">
              <strong>Pass ${entry.pass}: cut ${entry.startCut} → ${entry.bestCut}</strong><br>
              ${
                improved
                  ? `Kept ${entry.acceptedMoves} of ${entry.attemptedMoves} moves; rolled back ${entry.rolledBack}.`
                  : `No improvement; kept the pass-start partition.`
              }
              <span>${entry.attemptedMoves} attempted</span>
            </div>`;
        }
        return "";
      })
      .join("");

    el.tabPanel.innerHTML = `<div class="log-list">${rows}</div>`;
    el.tabPanel.scrollTop = el.tabPanel.scrollHeight;
  }

  function renderGainQueue() {
    const engine = state.engine;
    if (engine.status !== STATUS.ACTIVE) {
      const statusText =
        engine.status === STATUS.READY
          ? "Start a pass to fill the gain buckets."
          : engine.status === STATUS.BETWEEN
            ? "Pass closed. Gains are recomputed when the next pass starts."
            : "Run complete. Reset to inspect the first pass again.";
      el.tabPanel.innerHTML = `<div class="tab-empty"><b>No active gain queue</b><span>${statusText}</span></div>`;
      return;
    }

    const queue = engine.getGainQueue(12);
    if (!queue.length) {
      el.tabPanel.innerHTML = `
        <div class="tab-empty">
          <b>No eligible moves</b>
          <span>Every cell is locked or would violate the block bounds. Close the pass to keep its best prefix.</span>
        </div>`;
      return;
    }

    const rows = queue
      .map((candidate, index) => {
        const gainClass =
          candidate.gain > 0 ? "is-positive" : candidate.gain < 0 ? "is-negative" : "";
        const sideClass = candidate.from === 1 ? " is-b" : "";
        return `
          <div class="queue-row ${index === 0 ? "is-best" : ""}">
            <span class="queue-rank">${index + 1}</span>
            <span class="queue-orb${sideClass}">${escapeHtml(candidate.label)}</span>
            <span class="queue-move">${blockName(candidate.from)} → ${blockName(
              candidate.to,
            )} <em>dest ${candidate.destinationSize}</em></span>
            <span class="queue-gain ${gainClass}">${signed(candidate.gain)}</span>
            <span class="queue-cut">${engine.cut}→${engine.cut - candidate.gain}</span>
          </div>`;
      })
      .join("");

    el.tabPanel.innerHTML = `
      <div class="queue-head"><span>Eligible moves</span><span>${engine.blockSizes[0]}/${engine.blockSizes[1]} · cap ${engine.maxSize}</span></div>
      ${rows}
      <div class="queue-note">Highest gain wins. Ties go to the destination with the smaller block. Cut effect assumes only this move.</div>`;
  }

  function renderMethod() {
    const engine = state.engine;
    const metrics = engine.getMetrics();
    el.tabPanel.innerHTML = `
      <div class="method-content">
        <h3>Gain of a cell</h3>
        <div class="formula">gain(v) = FS(v) − TE(v)</div>
        <p><code>FS</code> counts nets where <em>v</em> is the only cell on its block. <code>TE</code> counts nets entirely on <em>v</em>'s block. Move gain is the exact cut reduction.</p>
        <h3>The pass</h3>
        <ul class="method-list">
          <li>Compute gains, then take the highest-gain eligible cell.</li>
          <li>Move it and lock it for this pass.</li>
          <li>Update only the gains of cells sharing a net with it.</li>
          <li>Record the prefix with the lowest cut.</li>
          <li>Roll back to that prefix; stop if the cut did not improve.</li>
        </ul>
        <h3>Balance</h3>
        <p>This run allows ${metrics.minSize}–${metrics.maxSize} cells per block (slack +${metrics.slack}). Moves that would leave the range are not eligible.</p>
        <p><code>Step</code> advances one move or opens a pass. <code>Run pass</code> finishes the current pass. <code>Play</code> runs to convergence.</p>
      </div>`;
  }

  /* ------------------------------------------------------------------ */
  /* Playback                                                            */
  /* ------------------------------------------------------------------ */

  function scheduleTick(delay) {
    clearTimeout(state.timer);
    state.timer = setTimeout(tick, delay);
  }

  function tick() {
    if (!state.playing || !state.engine) return;
    const event = state.engine.advance();
    state.lastEvent = event;
    renderAll({ animate: true });

    if (event.type === "done" || (state.playMode === "pass" && event.type === "pass-end")) {
      stopPlayback();
      return;
    }

    let base = 760;
    if (event.type === "pass-start") base = 620;
    if (event.type === "pass-end") base = 880;
    if (state.playMode === "pass") base = 560;
    scheduleTick(Math.max(110, base / state.speed));
  }

  function startPlayback(mode = "all") {
    if (!state.engine) return;
    let initialDelay = 140;
    if (state.engine.status === STATUS.DONE) {
      if (mode !== "all") return;
      state.engine.reset();
      state.lastEvent = null;
      renderAll({ animate: true });
      showToast("Replaying from the initial partition");
      initialDelay = Math.max(220, 520 / state.speed);
    }
    if (state.playing) return;
    state.playing = true;
    state.playMode = mode;
    state.lastEvent = null;
    renderTransport();
    scheduleTick(initialDelay);
  }

  function stopPlayback() {
    state.playing = false;
    clearTimeout(state.timer);
    state.timer = null;
    if (state.engine) renderTransport();
  }

  function stepOnce() {
    if (!state.engine) return;
    stopPlayback();
    if (state.engine.status === STATUS.DONE) return;
    const event = state.engine.advance();
    state.lastEvent = event;
    renderAll({ animate: true });
  }

  function resetRun() {
    if (!state.engine) return;
    stopPlayback();
    state.engine.reset();
    state.lastEvent = null;
    renderAll({ animate: true });
  }

  /* ------------------------------------------------------------------ */
  /* Events                                                              */
  /* ------------------------------------------------------------------ */

  el.presetSelect.addEventListener("change", () => {
    if (el.presetSelect.value === "random") {
      loadRandom();
    } else if (el.presetSelect.value === "custom") {
      el.presetSelect.value = state.presetId;
      openDataDialog();
    } else {
      loadPreset(el.presetSelect.value);
    }
  });

  el.randomBtn.addEventListener("click", () => {
    loadRandom(randomSeed());
  });

  el.dataBtn.addEventListener("click", openDataDialog);
  el.applyGraphBtn.addEventListener("click", applyGraphData);
  el.copyGraphBtn.addEventListener("click", copyGraphData);

  el.graphJson.addEventListener("keydown", (event) => {
    if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
      event.preventDefault();
      applyGraphData();
    }
  });

  el.dataDialog.addEventListener("click", (event) => {
    if (event.target === el.dataDialog) el.dataDialog.close();
  });

  el.helpBtn.addEventListener("click", () => {
    if (typeof el.helpDialog.showModal === "function") {
      el.helpDialog.showModal();
    } else {
      el.helpDialog.setAttribute("open", "");
    }
  });

  el.helpDialog.addEventListener("click", (event) => {
    if (event.target === el.helpDialog) el.helpDialog.close();
  });

  el.playBtn.addEventListener("click", () => {
    if (state.playing) stopPlayback();
    else startPlayback("all");
  });

  el.stepBtn.addEventListener("click", stepOnce);
  el.passBtn.addEventListener("click", () => startPlayback("pass"));
  el.resetBtn.addEventListener("click", resetRun);
  el.resplitBtn.addEventListener("click", resplitStart);

  el.speedRange.addEventListener("input", () => {
    state.speed = Number(el.speedRange.value);
    renderSliderLabels();
  });

  el.slackRange.addEventListener("input", () => {
    if (!state.engine) return;
    stopPlayback();
    state.engine.setSlack(Number(el.slackRange.value));
    state.lastEvent = null;
    renderAll({ animate: true });
  });

  el.graphSvg.addEventListener("click", (event) => {
    if (!event.target.closest(".cell")) clearSelection();
  });

  el.tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      state.tab = tab.dataset.tab;
      renderTab();
    });
  });

  document.addEventListener("keydown", (event) => {
    if (event.defaultPrevented) return;
    if (el.helpDialog.open || el.dataDialog.open) return;
    const target = event.target;
    const tag = target.tagName;
    if (tag === "INPUT" || tag === "SELECT" || tag === "TEXTAREA" || tag === "BUTTON" || tag === "A") return;
    if (target.closest && target.closest(".cell")) return;

    if (event.code === "Space") {
      event.preventDefault();
      if (state.playing) stopPlayback();
      else startPlayback("all");
    } else if (event.key.toLowerCase() === "s") {
      event.preventDefault();
      stepOnce();
    } else if (event.key.toLowerCase() === "p") {
      event.preventDefault();
      if (!state.playing) startPlayback("pass");
    } else if (event.key.toLowerCase() === "r") {
      event.preventDefault();
      resetRun();
    }
  });

  motionQuery.addEventListener?.("change", () => {
    if (state.engine) renderAll({ animate: false });
  });

  let resizeTimer = null;
  if (typeof ResizeObserver === "function") {
    const resizeObserver = new ResizeObserver(() => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        if (!state.engine) return;
        const frame = getCanvasFrame();
        if (state.layout && frame.viewWidth === state.layout.viewWidth) return;
        buildScene();
        renderAll({ animate: false });
      }, 140);
    });
    resizeObserver.observe(el.boardStage);
  }

  /* ------------------------------------------------------------------ */
  /* Boot                                                                */
  /* ------------------------------------------------------------------ */

  populatePresetSelect();
  loadPreset("signal");
})();
