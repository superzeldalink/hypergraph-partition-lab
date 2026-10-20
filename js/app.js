(() => {
  "use strict";

  const { FMEngine, STATUS, balancedSplit } = window.FMCore;
  const { PRESETS, getPreset, makeRandomGraph, mulberry32, randomSeed } = window.FMPresets;

  const SVG_NS = "http://www.w3.org/2000/svg";
  const SELECTED_TAB = "log";
  const GRAPH_TOP = 108;
  const GRAPH_BOTTOM = 608;
  const MAX_UNDO = 50;
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
    editBtn: document.getElementById("editBtn"),
    editBtnLabel: document.getElementById("editBtnLabel"),
    editorBar: document.getElementById("editorBar"),
    editorTip: document.getElementById("editorTip"),
    undoEditBtn: document.getElementById("undoEditBtn"),
    clearEditBtn: document.getElementById("clearEditBtn"),
    deleteEditBtn: document.getElementById("deleteEditBtn"),
    doneEditBtn: document.getElementById("doneEditBtn"),
    editorTools: Array.from(document.querySelectorAll(".editor-tool")),
    connectTray: document.getElementById("connectTray"),
    connectTrayLabel: document.getElementById("connectTrayLabel"),
    connectChips: document.getElementById("connectChips"),
    cancelConnectBtn: document.getElementById("cancelConnectBtn"),
    createNetBtn: document.getElementById("createNetBtn"),
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
    editorLayer: document.getElementById("editorLayer"),
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
    selectedNetId: null,
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
    editing: false,
    tool: "select",
    undoStack: [],
    connectIds: [],
    connectPointer: null,
    previewPath: null,
    drag: null,
    renaming: null,
    suppressClick: false,
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

  function clampNumber(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function cloneGraph(graph) {
    return JSON.parse(JSON.stringify(graph));
  }

  function defaultNormalizedY(index, count) {
    const available = GRAPH_BOTTOM - GRAPH_TOP;
    const maxStep = count <= 7 ? 66 : 58;
    const step = count > 1 ? Math.min(maxStep, available / (count - 1)) : 0;
    const span = step * Math.max(0, count - 1);
    const startY = GRAPH_TOP + (available - span) / 2;
    return clampNumber((startY + index * step - GRAPH_TOP) / available, 0, 1);
  }

  function ensureGraphLayout() {
    const existing = state.graph.layout && typeof state.graph.layout === "object"
      ? state.graph.layout
      : {};
    const layout = {};
    const count = state.engine.nodes.length;
    state.engine.nodes.forEach((node, index) => {
      const previous = existing[node.id];
      const y = previous && Number.isFinite(Number(previous.y))
        ? clampNumber(Number(previous.y), 0, 1)
        : defaultNormalizedY(index, count);
      const dx = previous && Number.isFinite(Number(previous.dx))
        ? clampNumber(Number(previous.dx), -0.5, 0.5)
        : 0;
      layout[node.id] = { y, dx };
    });
    state.graph.layout = layout;
  }

  function initialSideMap() {
    const map = new Map();
    state.engine.initialSides.forEach((side, index) => {
      map.set(state.engine.nodes[index].id, side);
    });
    return map;
  }

  function stashInitialSides(map) {
    state.graph.initialPartition = state.graph.nodes.map((node, index) => {
      const side = map.get(String(node.id));
      return side === 0 || side === 1 ? side : index % 2;
    });
  }

  function syncEngineFromGraph({ animate = false, preserveSelection = true } = {}) {
    const selectedId = preserveSelection ? state.selectedId : null;
    const selectedNetId = preserveSelection ? state.selectedNetId : null;
    state.engine = new FMEngine(state.graph, {
      slack: Number(el.slackRange.value),
    });
    ensureGraphLayout();
    state.selectedId = state.engine.indexOf.has(String(selectedId)) ? selectedId : null;
    state.selectedNetId = state.engine.nets.some((net) => net.id === selectedNetId)
      ? selectedNetId
      : null;
    state.connectIds = state.connectIds.filter((id) => state.engine.indexOf.has(String(id)));
    buildScene();
    renderAll({ animate });
  }

  function pushUndo(snapshot = cloneGraph(state.graph)) {
    state.undoStack.push(snapshot);
    if (state.undoStack.length > MAX_UNDO) state.undoStack.shift();
    updateEditorUI();
  }

  function undoGraphEdit() {
    if (!state.editing || !state.undoStack.length) return;
    finishInlineRename(false);
    const graph = state.undoStack.pop();
    state.graph = graph;
    state.tool = state.graph.nodes.length ? "select" : "add";
    state.connectIds = [];
    state.connectPointer = null;
    state.selectedNetId = null;
    state.engine = new FMEngine(state.graph, {
      slack: Number(el.slackRange.value),
    });
    ensureGraphLayout();
    if (state.selectedId && !state.engine.indexOf.has(String(state.selectedId))) {
      state.selectedId = null;
    }
    buildScene();
    renderAll({ animate: false });
    showToast("Undid graph edit");
  }

  function updateGraphSource() {
    state.presetId = "custom";
    state.currentSeed = null;
    el.presetSelect.value = "custom";
  }

  function uniqueCellId() {
    const used = new Set(state.graph.nodes.map((node) => String(node.id)));
    let serial = 1;
    while (used.has(`cell-${serial}`)) serial += 1;
    return `cell-${serial}`;
  }

  function uniqueCellLabel() {
    const used = new Set(state.graph.nodes.map((node) => String(node.label ?? node.id)));
    for (let index = 0; index < 26; index += 1) {
      const letter = String.fromCharCode(65 + index);
      if (!used.has(letter)) return letter;
    }
    let serial = 1;
    while (used.has(`N${serial}`)) serial += 1;
    return `N${serial}`;
  }

  function uniqueNetId() {
    const used = new Set(state.graph.nets.map((net) => String(net.id)));
    let serial = 1;
    while (used.has(`n${serial}`)) serial += 1;
    return `n${serial}`;
  }

  function eventToCanvas(event) {
    const svg = el.graphSvg;
    if (typeof svg.createSVGPoint === "function" && svg.getScreenCTM()) {
      const point = svg.createSVGPoint();
      point.x = event.clientX;
      point.y = event.clientY;
      const mapped = point.matrixTransform(svg.getScreenCTM().inverse());
      return { x: mapped.x, y: mapped.y };
    }
    const rect = svg.getBoundingClientRect();
    const frame = getCanvasFrame();
    return {
      x: ((event.clientX - rect.left) / rect.width) * frame.viewWidth,
      y: ((event.clientY - rect.top) / rect.height) * 640,
    };
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
    customOption.textContent = "Custom graph";
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
    finishInlineRename(false);
    state.editing = false;
    state.tool = "select";
    state.drag = null;
    state.undoStack = [];
    state.connectIds = [];
    state.connectPointer = null;
    state.graph = JSON.parse(JSON.stringify(graph));
    state.selectedId = null;
    state.selectedNetId = null;
    state.lastEvent = null;
    state.engine = new FMEngine(state.graph, {
      slack: Number(el.slackRange.value),
    });
    state.graph.initialPartition = state.engine.initialSides.slice();
    ensureGraphLayout();
    buildScene();
    renderAll({ animate: false });
  }

  function resplitStart() {
    if (!state.engine) return;
    stopPlayback();
    finishInlineRename(false);
    const seed = Date.now() % 2147483647;
    const sides = balancedSplit(state.graph.nodes.length, mulberry32(seed));
    state.graph.initialPartition = sides;
    state.selectedId = null;
    state.selectedNetId = null;
    state.lastEvent = null;
    state.engine = new FMEngine(state.graph, {
      slack: Number(el.slackRange.value),
    });
    ensureGraphLayout();
    buildScene();
    renderAll({ animate: false });
    showToast("Balanced start re-split");
  }

  /* ------------------------------------------------------------------ */
  /* Graph JSON                                                          */
  /* ------------------------------------------------------------------ */

  function serializeGraph() {
    const engine = state.engine;
    const layout = state.graph.layout || {};
    const serializedLayout = {};
    Object.entries(layout).forEach(([id, position]) => {
      if (!position || !Number.isFinite(position.y)) return;
      serializedLayout[id] = {
        y: Number(position.y.toFixed(5)),
        dx: Number((Number(position.dx) || 0).toFixed(5)),
      };
    });
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
    if (Object.keys(serializedLayout).length) data.layout = serializedLayout;
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
      if (parsed.layout && typeof parsed.layout === "object") {
        imported.layout = parsed.layout;
      }

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

  function bindNetHit(element, net) {
    element.addEventListener("click", (event) => {
      if (!state.editing) return;
      event.stopPropagation();
      selectNet(net.id);
    });
    element.addEventListener("pointerdown", (event) => {
      if (state.editing) event.stopPropagation();
    });
  }

  function buildScene() {
    cancelAnimation();
    closeInlineRename(false);
    state.nodeEls.clear();
    state.edgeEls = [];
    state.positions.clear();
    state.previewPath = null;
    el.edgesLayer.replaceChildren();
    el.editorLayer.replaceChildren();
    el.nodesLayer.replaceChildren();

    const frame = getCanvasFrame();
    applyCanvasFrame(frame);

    const nodes = state.engine.nodes;
    const count = nodes.length;
    const top = GRAPH_TOP;
    const bottom = GRAPH_BOTTOM;
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
      divider: frame.divider,
      labelX: frame.labelX,
      top,
      available,
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
        const hit = svgElement("path", {
          class: "net-hit",
          fill: "none",
          "vector-effect": "non-scaling-stroke",
        });
        group.appendChild(hit);
        bindNetHit(hit, net);
        state.edgeEls.push({
          net,
          netIndex,
          group,
          title,
          twoTerminal: true,
          paths: [path],
          hitPaths: [hit],
          hub: null,
          hitHub: null,
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
        const hits = net.cells.map(() => {
          const hit = svgElement("path", {
            class: "net-hit",
            fill: "none",
            "vector-effect": "non-scaling-stroke",
          });
          group.appendChild(hit);
          bindNetHit(hit, net);
          return hit;
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
        const hitHub = svgElement("circle", {
          class: "net-hit-hub",
          r: 12,
          "vector-effect": "non-scaling-stroke",
        });
        group.appendChild(hitHub);
        bindNetHit(hitHub, net);
        state.edgeEls.push({
          net,
          netIndex,
          group,
          title,
          twoTerminal: false,
          paths,
          hitPaths: hits,
          hub,
          hitHub,
        });
      }
      el.edgesLayer.appendChild(group);
    });

    state.previewPath = svgElement("path", { class: "connect-preview", d: "" });
    el.editorLayer.appendChild(state.previewPath);

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
        if (state.suppressClick) return;
        if (state.editing && state.tool === "connect") {
          toggleConnectNode(node.id);
          return;
        }
        selectNode(node.id);
      });
      group.addEventListener("dblclick", (event) => {
        if (!state.editing || state.tool !== "select") return;
        event.preventDefault();
        event.stopPropagation();
        startInlineRename(node.id);
      });
      group.addEventListener("pointerdown", (event) => {
        startCellDrag(event, node.id);
      });
      group.addEventListener("pointermove", handleCellPointerMove);
      group.addEventListener("pointerup", handleCellPointerUp);
      group.addEventListener("pointercancel", handleCellPointerUp);
      group.addEventListener("keydown", (event) => {
        if (event.key === "Enter" && state.editing && state.tool === "connect") {
          event.preventDefault();
          createNetFromSelection();
          return;
        }
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          selectNode(node.id);
        } else if (event.key === "F2" && state.editing) {
          event.preventDefault();
          startInlineRename(node.id);
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
    const {
      radius,
      leftX,
      rightX,
      viewWidth,
      divider,
      labelX,
      top,
      available,
    } = state.layout;
    const layout = state.graph.layout || {};
    nodes.forEach((node, index) => {
      const entry = layout[node.id];
      const rawY = entry && Number.isFinite(Number(entry.y))
        ? Number(entry.y)
        : defaultNormalizedY(index, nodes.length);
      const rawDx = entry && Number.isFinite(Number(entry.dx)) ? Number(entry.dx) : 0;
      const baseX = node.side === 0 ? leftX : rightX;
      const minX = node.side === 0
        ? labelX + radius + 8
        : divider + radius + 16;
      const maxX = node.side === 0
        ? divider - radius - 16
        : viewWidth - labelX - radius - 8;
      const wantedX = baseX + rawDx * viewWidth;
      targets.set(node.id, {
        x: clampNumber(wantedX, minX, maxX),
        y: top + clampNumber(rawY, 0, 1) * available,
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
    const selectedNetId = state.editing ? state.selectedNetId : null;
    el.graphSvg.classList.toggle(
      "has-net-selection",
      state.editing && selectedNetId !== null,
    );

    state.edgeEls.forEach((edge) => {
      const { net, netIndex } = edge;
      const netSelected = selectedNetId === net.id;
      edge.group.classList.toggle("is-selected-net", netSelected);
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
        const pathData = `M ${p1.x.toFixed(2)} ${p1.y.toFixed(2)} Q ${controlX.toFixed(
          2,
        )} ${controlY.toFixed(2)} ${p2.x.toFixed(2)} ${p2.y.toFixed(2)}`;
        path.setAttribute("d", pathData);
        path.classList.toggle("is-cut", cut);
        path.classList.toggle("is-incident", incident);
        if (edge.hitPaths[0]) edge.hitPaths[0].setAttribute("d", pathData);
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
          const pathData = `M ${point.x.toFixed(2)} ${point.y.toFixed(
            2,
          )} L ${hubX.toFixed(2)} ${hubY.toFixed(2)}`;
          path.setAttribute("d", pathData);
          path.classList.toggle("is-cut", cut);
          path.classList.toggle("is-incident", incident);
          if (edge.hitPaths[pointIndex]) {
            edge.hitPaths[pointIndex].setAttribute("d", pathData);
          }
        });
        edge.hub.setAttribute("transform", `translate(${hubX.toFixed(2)} ${hubY.toFixed(2)}) rotate(45)`);
        edge.hub.classList.toggle("is-cut", cut);
        edge.hub.classList.toggle("is-incident", incident);
        if (edge.hitHub) {
          edge.hitHub.setAttribute(
            "transform",
            `translate(${hubX.toFixed(2)} ${hubY.toFixed(2)})`,
          );
        }
      }
    });
    drawConnectPreview();
  }

  function drawConnectPreview() {
    if (!state.previewPath) return;
    if (!state.editing || state.tool !== "connect" || !state.connectIds.length) {
      state.previewPath.setAttribute("d", "");
      return;
    }
    const points = state.connectIds
      .map((id) => state.positions.get(String(id)))
      .filter(Boolean);
    if (!points.length) {
      state.previewPath.setAttribute("d", "");
      return;
    }
    if (state.connectPointer) points.push(state.connectPointer);
    if (points.length < 2) {
      state.previewPath.setAttribute("d", "");
      return;
    }
    const path = points
      .map((point, index) => `${index === 0 ? "M" : "L"} ${point.x.toFixed(2)} ${point.y.toFixed(2)}`)
      .join(" ");
    state.previewPath.setAttribute("d", path);
  }

  /* ------------------------------------------------------------------ */
  /* Selection                                                           */
  /* ------------------------------------------------------------------ */

  function selectNode(id) {
    if (!state.engine) return;
    const next = state.selectedId === id ? null : id;
    state.selectedId = next;
    state.selectedNetId = null;
    renderSceneState();
    updateInspector();
    drawEdges();
    updateEditorUI();
  }

  function selectNet(id) {
    if (!state.editing || !state.engine) return;
    const next = state.selectedNetId === id ? null : id;
    state.selectedNetId = next;
    if (next !== null) state.selectedId = null;
    renderSceneState();
    updateInspector();
    drawEdges();
    updateEditorUI();
  }

  function clearSelection() {
    if (state.selectedId === null && state.selectedNetId === null) return;
    state.selectedId = null;
    state.selectedNetId = null;
    renderSceneState();
    updateInspector();
    drawEdges();
    updateEditorUI();
  }

  /* ------------------------------------------------------------------ */
  /* Direct graph editing                                                */
  /* ------------------------------------------------------------------ */

  function updateEditorUI() {
    const editing = state.editing;
    const boardCard = el.graphSvg.closest(".board-card");
    if (boardCard) boardCard.classList.toggle("is-editing", editing);
    el.editBtn.classList.toggle("is-active", editing);
    el.editBtn.setAttribute("aria-pressed", editing ? "true" : "false");
    el.editBtn.title = editing
      ? "Finish editing and return to the solver"
      : "Edit this graph directly on the board";
    el.editBtnLabel.textContent = editing ? "Done editing" : "Edit graph";
    el.editorBar.hidden = !editing;
    el.graphSvg.classList.toggle("is-editing", editing);
    el.graphSvg.classList.toggle("tool-select", editing && state.tool === "select");
    el.graphSvg.classList.toggle("tool-add", editing && state.tool === "add");
    el.graphSvg.classList.toggle("tool-connect", editing && state.tool === "connect");

    el.editorTools.forEach((button) => {
      const active = button.dataset.tool === state.tool;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-pressed", active ? "true" : "false");
    });

    const tips = {
      select: "Drag cells · double-click a name to rename · drag across the cut to change start block",
      add: "Click empty canvas to drop a new cell · press V to select",
      connect: "Click cells in order · press Enter or Create net when finished",
    };
    el.editorTip.textContent = tips[state.tool] || tips.select;

    el.undoEditBtn.disabled = !editing || state.undoStack.length === 0;
    const hasSelection = Boolean(state.selectedId || state.selectedNetId);
    el.deleteEditBtn.disabled = !editing || !hasSelection;
    el.clearEditBtn.disabled =
      !editing ||
      (state.engine && state.engine.nodes.length === 0 && state.engine.nets.length === 0);

    const connectOpen = editing && state.tool === "connect";
    el.connectTray.hidden = !connectOpen;
    if (connectOpen) {
      const chips = state.connectIds.map((id, index) => {
        const node = state.engine.indexOf.has(String(id))
          ? state.engine.nodes[state.engine.indexOf.get(String(id))]
          : null;
        return `<span class="connect-chip">${index + 1} · ${escapeHtml(
          node ? node.label : id,
        )}</span>`;
      });
      el.connectChips.innerHTML = chips.join("");
      el.connectTrayLabel.textContent =
        state.connectIds.length === 0
          ? "Pick two or more cells"
          : `${state.connectIds.length} selected`;
      el.createNetBtn.disabled = state.connectIds.length < 2;
    }
  }

  function setTool(tool, { silent = false } = {}) {
    if (!state.editing) return;
    if (!["select", "add", "connect"].includes(tool)) return;
    const changed = state.tool !== tool;
    state.tool = tool;
    if (tool !== "connect") {
      state.connectIds = [];
      state.connectPointer = null;
    }
    if (tool === "add") {
      state.selectedNetId = null;
    }
    updateEditorUI();
    renderSceneState();
    updateInspector();
    drawEdges();
    if (changed && !silent) {
      const messages = {
        select: "Select tool · drag cells to move them",
        add: "Add tool · click the board to place a cell",
        connect: "Connect tool · click two or more cells",
      };
      showToast(messages[tool]);
    }
  }

  function toggleConnectNode(id) {
    if (!state.editing || state.tool !== "connect") return;
    const stringId = String(id);
    if (!state.engine.indexOf.has(stringId)) return;
    const position = state.connectIds.indexOf(stringId);
    if (position === -1) state.connectIds.push(stringId);
    else state.connectIds.splice(position, 1);
    state.selectedId = stringId;
    state.selectedNetId = null;
    state.connectPointer = null;
    renderSceneState();
    updateInspector();
    drawEdges();
    updateEditorUI();
  }

  function cancelConnect() {
    state.connectIds = [];
    state.connectPointer = null;
    setTool("select", { silent: true });
    showToast("Connection cancelled");
  }

  function createNetFromSelection() {
    if (!state.editing) return;
    if (state.connectIds.length < 2) {
      showToast("Pick at least two cells to create a net");
      return;
    }
    const cells = state.connectIds.slice();
    const key = cells.slice().sort().join("|");
    const duplicate = state.graph.nets.find((net) => {
      if (!Array.isArray(net.cells) || net.cells.length !== cells.length) return false;
      return net.cells.map(String).slice().sort().join("|") === key;
    });
    if (duplicate) {
      showToast(`Those cells are already connected by ${duplicate.id}`);
      return;
    }
    pushUndo();
    const id = uniqueNetId();
    state.graph.nets.push({ id, label: id, cells });
    state.selectedId = null;
    state.selectedNetId = id;
    state.tool = "select";
    state.connectIds = [];
    state.connectPointer = null;
    updateGraphSource();
    syncEngineFromGraph({ preserveSelection: true });
    showToast(`Created net ${id} · ${cells.length} cells`);
  }

  function enterEditMode() {
    if (!state.engine || state.editing) return;
    stopPlayback();
    finishInlineRename(false);
    state.editing = true;
    state.tool = "select";
    state.undoStack = [];
    state.connectIds = [];
    state.connectPointer = null;
    state.selectedNetId = null;
    state.lastEvent = null;
    state.engine.reset();
    ensureGraphLayout();
    buildScene();
    renderAll({ animate: true });
    showToast("Graph editor on · changes restart the FM run");
  }

  function exitEditMode() {
    if (!state.editing) return;
    if (!state.engine || state.engine.nodes.length < 2) {
      showToast("Add at least two cells before finishing");
      return;
    }
    finishInlineRename(true);
    state.editing = false;
    state.tool = "select";
    state.connectIds = [];
    state.connectPointer = null;
    state.selectedNetId = null;
    state.drag = null;
    state.engine = new FMEngine(state.graph, {
      slack: Number(el.slackRange.value),
    });
    ensureGraphLayout();
    buildScene();
    renderAll({ animate: true });
    showToast("Editor closed · FM run reset");
  }

  function addCellAt(x, y) {
    if (!state.editing || !state.engine) return;
    const frame = getCanvasFrame();
    const side = x < frame.divider ? 0 : 1;
    const id = uniqueCellId();
    const label = uniqueCellLabel();
    const map = initialSideMap();
    map.set(id, side);
    pushUndo();
    state.graph.nodes.push({ id, label });
    if (!state.graph.layout) state.graph.layout = {};
    const normalizedY = clampNumber(
      (y - GRAPH_TOP) / (GRAPH_BOTTOM - GRAPH_TOP),
      0,
      1,
    );
    const baseX = side === 0 ? frame.leftX : frame.rightX;
    state.graph.layout[id] = {
      y: normalizedY,
      dx: clampNumber((x - baseX) / frame.viewWidth, -0.5, 0.5),
    };
    stashInitialSides(map);
    state.selectedId = id;
    state.selectedNetId = null;
    updateGraphSource();
    syncEngineFromGraph({ preserveSelection: true });
    showToast(`Added cell ${label} in Block ${blockName(side)}`);
  }

  function renameNode(id, nextLabel) {
    if (!state.editing) return false;
    const node = state.graph.nodes.find((item) => String(item.id) === String(id));
    if (!node) return false;
    const label = String(nextLabel).trim().slice(0, 32);
    if (!label) {
      showToast("A cell name cannot be empty");
      return false;
    }
    if (label === node.label) return false;
    pushUndo();
    node.label = label;
    updateGraphSource();
    syncEngineFromGraph({ preserveSelection: true });
    showToast(`Renamed cell to ${label}`);
    return true;
  }

  function renameNet(id, nextLabel) {
    if (!state.editing) return false;
    const net = state.graph.nets.find((item) => String(item.id) === String(id));
    if (!net) return false;
    const label = String(nextLabel).trim().slice(0, 32);
    if (!label) {
      showToast("A net name cannot be empty");
      return false;
    }
    if (label === (net.label ?? net.id)) return false;
    pushUndo();
    net.label = label;
    updateGraphSource();
    syncEngineFromGraph({ preserveSelection: true });
    showToast(`Renamed net to ${label}`);
    return true;
  }

  function changeCellSide(id, side) {
    if (!state.editing) return;
    const map = initialSideMap();
    const current = map.get(String(id));
    if (current === undefined || current === side) return;
    const sourceCount = Array.from(map.values()).filter((item) => item === current).length;
    if (sourceCount <= 1) {
      showToast("Each block needs at least one cell");
      return;
    }
    pushUndo();
    map.set(String(id), side);
    stashInitialSides(map);
    state.selectedId = String(id);
    state.selectedNetId = null;
    updateGraphSource();
    syncEngineFromGraph({ preserveSelection: true });
    showToast(`Start block changed to ${blockName(side)}`);
  }

  function deleteNodeById(id) {
    if (!state.editing || !state.engine) return;
    const stringId = String(id);
    const map = initialSideMap();
    map.delete(stringId);
    pushUndo();
    const removedNets = state.graph.nets.filter(
      (net) => net.cells.some((cell) => String(cell) === stringId) &&
        net.cells.filter((cell) => String(cell) !== stringId).length < 2,
    ).length;
    state.graph.nodes = state.graph.nodes.filter(
      (node) => String(node.id) !== stringId,
    );
    state.graph.nets = state.graph.nets
      .map((net) => ({
        ...net,
        cells: net.cells.filter((cell) => String(cell) !== stringId),
      }))
      .filter((net) => net.cells.length >= 2);
    if (state.graph.layout) delete state.graph.layout[stringId];
    stashInitialSides(map);
    state.selectedId = null;
    state.selectedNetId = null;
    state.connectIds = state.connectIds.filter((cell) => cell !== stringId);
    updateGraphSource();
    syncEngineFromGraph({ preserveSelection: false });
    showToast(
      removedNets
        ? `Deleted cell · removed ${removedNets} collapsed ${removedNets === 1 ? "net" : "nets"}`
        : "Deleted cell",
    );
  }

  function deleteNetById(id) {
    if (!state.editing) return;
    const net = state.graph.nets.find((item) => String(item.id) === String(id));
    if (!net) return;
    pushUndo();
    state.graph.nets = state.graph.nets.filter(
      (item) => String(item.id) !== String(id),
    );
    state.selectedNetId = null;
    updateGraphSource();
    syncEngineFromGraph({ preserveSelection: true });
    showToast(`Deleted net ${net.id}`);
  }

  function deleteSelectedGraphItem() {
    if (!state.editing) return;
    if (state.selectedNetId) deleteNetById(state.selectedNetId);
    else if (state.selectedId) deleteNodeById(state.selectedId);
  }

  function clearGraph() {
    if (!state.editing) return;
    if (state.engine.nodes.length === 0 && state.engine.nets.length === 0) return;
    finishInlineRename(false);
    pushUndo();
    state.graph.nodes = [];
    state.graph.nets = [];
    state.graph.layout = {};
    state.graph.initialPartition = [];
    state.graph.name = "Untitled hypergraph";
    state.graph.description = "";
    state.selectedId = null;
    state.selectedNetId = null;
    state.connectIds = [];
    state.connectPointer = null;
    state.tool = "add";
    updateGraphSource();
    syncEngineFromGraph({ preserveSelection: false });
    updateEditorUI();
    showToast("Canvas cleared · click to add cells · Undo to restore");
  }

  function startInlineRename(id) {
    if (!state.editing || !state.engine) return;
    const index = state.engine.indexOf.get(String(id));
    const entry = state.nodeEls.get(String(id));
    if (index === undefined || !entry) return;
    finishInlineRename(false);
    const node = state.graph.nodes.find((item) => String(item.id) === String(id));
    if (!node) return;
    state.selectedId = String(id);
    state.selectedNetId = null;
    renderSceneState();
    updateInspector();
    drawEdges();
    updateEditorUI();

    const body = entry.group.querySelector(".cell-body");
    const bodyRect = body.getBoundingClientRect();
    const stageRect = el.boardStage.getBoundingClientRect();
    const input = document.createElement("input");
    input.className = "node-rename-input";
    input.type = "text";
    input.maxLength = 32;
    input.value = node.label;
    input.setAttribute("aria-label", `Rename cell ${node.label}`);
    input.style.left = `${bodyRect.left - stageRect.left + bodyRect.width / 2}px`;
    input.style.top = `${bodyRect.top - stageRect.top + bodyRect.height / 2}px`;
    const session = { id: String(id), input, closed: false };
    state.renaming = session;
    el.boardStage.appendChild(input);
    input.addEventListener("pointerdown", (event) => event.stopPropagation());
    input.addEventListener("click", (event) => event.stopPropagation());
    input.addEventListener("keydown", (event) => {
      event.stopPropagation();
      if (event.key === "Enter") {
        event.preventDefault();
        finishInlineRename(true);
      } else if (event.key === "Escape") {
        event.preventDefault();
        finishInlineRename(false);
      }
    });
    input.addEventListener("blur", () => {
      if (!session.closed) finishInlineRename(true);
    });
    input.focus({ preventScroll: true });
    input.select();
  }

  function finishInlineRename(commit) {
    const session = state.renaming;
    if (!session) return;
    session.closed = true;
    state.renaming = null;
    const value = session.input.value;
    session.input.remove();
    if (commit) {
      const node = state.graph.nodes.find(
        (item) => String(item.id) === session.id,
      );
      if (node && value.trim() && value.trim() !== node.label) {
        renameNode(session.id, value);
      }
    }
  }

  function closeInlineRename(commit = false) {
    if (state.renaming) finishInlineRename(commit);
  }

  function startCellDrag(event, id) {
    if (!state.editing || state.tool !== "select" || event.button !== 0) return;
    if (event.target.closest(".node-rename-input")) return;
    event.preventDefault();
    const entry = state.nodeEls.get(String(id));
    if (!entry) return;
    const point = eventToCanvas(event);
    state.drag = {
      id: String(id),
      pointerId: event.pointerId,
      startClientX: event.clientX,
      startClientY: event.clientY,
      lastPoint: point,
      moved: false,
      undoPushed: false,
      snapshot: cloneGraph(state.graph),
      group: entry.group,
    };
    try {
      entry.group.setPointerCapture(event.pointerId);
    } catch (error) {
      // Pointer capture is best-effort; mouse events still work without it.
    }
  }

  function handleCellPointerMove(event) {
    const drag = state.drag;
    if (!drag || drag.pointerId !== event.pointerId) return;
    const distance = Math.hypot(
      event.clientX - drag.startClientX,
      event.clientY - drag.startClientY,
    );
    if (!drag.moved && distance < 3) return;
    if (!drag.moved) {
      drag.moved = true;
      drag.group.classList.add("is-dragging");
      state.selectedId = drag.id;
      state.selectedNetId = null;
      if (!drag.undoPushed) {
        pushUndo(drag.snapshot);
        drag.undoPushed = true;
      }
      renderSceneState();
      updateInspector();
    }
    const point = eventToCanvas(event);
    drag.lastPoint = point;
    const frame = getCanvasFrame();
    const radius = state.layout ? state.layout.radius : 16;
    const x = clampNumber(point.x, radius + 12, frame.viewWidth - radius - 12);
    const y = clampNumber(point.y, GRAPH_TOP - 20, GRAPH_BOTTOM + 20);
    state.positions.set(drag.id, { x, y });
    applyPositions();
    drawEdges();
  }

  function handleCellPointerUp(event) {
    const drag = state.drag;
    if (!drag || drag.pointerId !== event.pointerId) return;
    const group = drag.group;
    try {
      if (group.hasPointerCapture(event.pointerId)) {
        group.releasePointerCapture(event.pointerId);
      }
    } catch (error) {
      // Ignore capture cleanup failures.
    }
    group.classList.remove("is-dragging");
    state.drag = null;
    if (!drag.moved) return;
    state.suppressClick = true;
    setTimeout(() => {
      state.suppressClick = false;
    }, 0);
    commitCellDrag(drag.id, drag.lastPoint);
  }

  function commitCellDrag(id, point) {
    const index = state.engine.indexOf.get(String(id));
    if (index === undefined) return;
    const node = state.engine.nodes[index];
    const frame = getCanvasFrame();
    const radius = state.layout.radius;
    let nextSide = node.side;
    if (point.x < frame.divider - 12) nextSide = 0;
    else if (point.x > frame.divider + 12) nextSide = 1;

    if (nextSide !== node.side) {
      const map = initialSideMap();
      const sourceCount = Array.from(map.entries()).filter(
        ([cellId, side]) => side === node.side && cellId !== String(id),
      ).length;
      if (sourceCount < 1) {
        nextSide = node.side;
        showToast("Each block needs at least one cell");
      } else {
        map.set(String(id), nextSide);
        stashInitialSides(map);
        updateGraphSource();
        const baseX = nextSide === 0 ? frame.leftX : frame.rightX;
        const minX = nextSide === 0
          ? frame.labelX + radius + 8
          : frame.divider + radius + 16;
        const maxX = nextSide === 0
          ? frame.divider - radius - 16
          : frame.viewWidth - frame.labelX - radius - 8;
        const targetX = clampNumber(point.x, minX, maxX);
        const normalizedY = clampNumber(
          (point.y - GRAPH_TOP) / (GRAPH_BOTTOM - GRAPH_TOP),
          0,
          1,
        );
        if (!state.graph.layout) state.graph.layout = {};
        state.graph.layout[id] = {
          y: normalizedY,
          dx: (targetX - baseX) / frame.viewWidth,
        };
        state.selectedId = id;
        state.selectedNetId = null;
        syncEngineFromGraph({ preserveSelection: true });
        showToast(`Cell ${node.label} now starts in Block ${blockName(nextSide)}`);
        return;
      }
    }

    const baseX = node.side === 0 ? frame.leftX : frame.rightX;
    const minX = node.side === 0
      ? frame.labelX + radius + 8
      : frame.divider + radius + 16;
    const maxX = node.side === 0
      ? frame.divider - radius - 16
      : frame.viewWidth - frame.labelX - radius - 8;
    const targetX = clampNumber(point.x, minX, maxX);
    if (!state.graph.layout) state.graph.layout = {};
    state.graph.layout[id] = {
      y: clampNumber(
        (point.y - GRAPH_TOP) / (GRAPH_BOTTOM - GRAPH_TOP),
        0,
        1,
      ),
      dx: (targetX - baseX) / frame.viewWidth,
    };
    updateGraphSource();
    moveScene(false);
    renderSceneState();
    updateInspector();
    updateEditorUI();
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
    updateEditorUI();

    el.svgDesc.textContent = state.editing
      ? `Graph editor with ${state.engine.nodes.length} cells and ${state.engine.nets.length} nets. Drag cells, add or connect cells, or rename a cell.`
      : `Partition with ${state.engine.blockSizes[0]} cells in block A and ${
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
    const active = engine.status === STATUS.ACTIVE && !state.editing;
    const connecting = state.editing && state.tool === "connect";
    const connectSet = new Set(state.connectIds.map(String));

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
      entry.group.classList.toggle(
        "is-connect-target",
        connecting && connectSet.has(String(node.id)),
      );

      const gainClass =
        node.gain > 0 ? "is-positive" : node.gain < 0 ? "is-negative" : "is-zero";
      entry.gainGroup.classList.remove("is-positive", "is-negative", "is-zero");
      entry.gainGroup.classList.add(gainClass);
      entry.gainText.textContent = signed(node.gain);

      entry.group.setAttribute(
        "aria-label",
        state.editing
          ? `Cell ${node.label}, starts in ${blockWord(node.side)}. Drag to move, double-click to rename.`
          : `Cell ${node.label}, ${blockWord(node.side)}, gain ${signed(node.gain)}, ${
              node.locked ? "locked" : "unlocked"
            }. Select to inspect.`,
      );
      entry.group.setAttribute(
        "aria-pressed",
        isSelected ? "true" : "false",
      );
      entry.title.textContent = state.editing
        ? `Cell ${node.label} · drag to move · double-click to rename`
        : `Cell ${node.label} · ${blockWord(node.side)} · gain ${signed(node.gain)}${
            node.locked ? " · locked" : ""
          }`;
    });
  }

  function renderBoardSummary() {
    const metrics = state.engine.getMetrics();
    const [sizeA, sizeB] = metrics.blockSizes;
    const count = state.graph.nodes.length;
    const percentA = count ? (sizeA / count) * 100 : 0;
    const percentB = count ? 100 - percentA : 0;
    const markerLeft = count ? (metrics.maxSize / count) * 100 : 50;
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

    const statusClass = state.editing
      ? "is-editing"
      : metrics.status === STATUS.ACTIVE
        ? "is-active"
        : metrics.status === STATUS.BETWEEN
          ? "is-between"
          : metrics.status === STATUS.DONE
            ? "is-done"
            : "";
    el.statusPill.className = `status-pill ${statusClass}`.trim();

    if (state.editing) {
      el.statusText.textContent = "Editing";
    } else if (metrics.status === STATUS.READY) {
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
    el.stepBtn.disabled = state.editing || state.playing || done;
    el.passBtn.disabled = state.editing || state.playing || done;
    el.playBtn.disabled = state.editing;
    el.resetBtn.disabled = state.editing;
    el.resplitBtn.disabled = state.editing;
    el.slackRange.disabled = state.editing;
    el.playBtn.title = state.editing
      ? "Finish editing to run the solver"
      : state.playing
        ? "Pause (Space)"
        : done
          ? "Replay run (Space)"
          : "Play (Space)";
  }

  function renderNextStep(candidate) {
    const engine = state.engine;
    const metrics = engine.getMetrics();
    let html = "";

    if (state.editing) {
      const message =
        state.tool === "add"
          ? "Click empty canvas to add a cell. Use the inspector to rename or change its starting block."
          : state.tool === "connect"
            ? "Click two or more cells, then <strong>Create net</strong>. Press Esc to cancel."
            : "Drag cells to move them. Double-click a name to rename. Click a net line to inspect or delete it.";
      el.nextStep.innerHTML = message;
      return;
    }

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

    if (state.editing) {
      phaseEls.forEach((phase) => {
        phase.classList.remove("is-active", "is-complete");
      });
      return;
    }

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
    const count = state.graph.nodes.length;
    if (count < 2) {
      el.slackHelp.textContent =
        count === 0
          ? "Add at least two cells before finishing the graph."
          : "Add one more cell before finishing the graph.";
    } else if (metrics.minSize === metrics.maxSize) {
      el.slackHelp.textContent = `Strict ${metrics.maxSize}/${count} split. Single-cell moves are blocked.`;
    } else {
      el.slackHelp.textContent = `Blocks stay between ${metrics.minSize} and ${metrics.maxSize} of ${count} cells.`;
    }
  }

  function updateInspector() {
    if (!state.engine) return;
    if (state.editing) {
      renderEditingInspector();
      return;
    }

    if (!state.selectedId) {
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

  function renderEditingInspector() {
    const engine = state.engine;
    if (state.selectedNetId) {
      const netIndex = engine.nets.findIndex((net) => net.id === state.selectedNetId);
      if (netIndex === -1) {
        state.selectedNetId = null;
        renderEditingInspector();
        return;
      }
      const net = engine.nets[netIndex];
      const counts = engine.netCounts[netIndex];
      const cut = counts[0] > 0 && counts[1] > 0;
      const members = net.cells
        .map((cellIndex) => engine.nodes[cellIndex])
        .map(
          (node) => `
            <button class="net-member${node.side === 1 ? " is-b" : ""}" type="button"
              data-edit-action="select-cell" data-cell-id="${escapeHtml(node.id)}"
              title="Select ${escapeHtml(node.label)}">
              ${escapeHtml(node.label)}
            </button>`,
        )
        .join("");
      el.inspectorHint.textContent = "net selected";
      el.inspectorBody.innerHTML = `
        <div class="inspector-header">
          <div class="cell-orb net-orb">${escapeHtml(net.id.slice(0, 3))}</div>
          <div class="inspector-identity">
            <label class="inspector-edit-name">
              <span>Net name</span>
              <input class="inspector-name-input" data-edit-field="net-label"
                data-id="${escapeHtml(net.id)}" value="${escapeHtml(net.label ?? net.id)}"
                maxlength="32" autocomplete="off">
            </label>
            <div class="inspector-sub">
              ${net.cells.length} cells · ${cut ? "crosses the cut" : "internal to a block"}
            </div>
          </div>
        </div>
        <div class="edit-controls">
          <button class="edit-control edit-danger" type="button" data-edit-action="delete-net">
            Delete net
          </button>
        </div>
        <div class="net-section-head"><span>Connected cells</span><span>${net.cells.length}</span></div>
        <div class="net-member-grid">${members}</div>
        <div class="edit-note"><strong>Tip:</strong> drag a net line? Select cells and use <strong>Connect</strong> to create a new hyperedge. Delete and rebuild to change membership.</div>`;
      return;
    }

    if (state.selectedId) {
      const details = engine.getCellDetails(state.selectedId);
      if (!details) {
        state.selectedId = null;
        renderEditingInspector();
        return;
      }
      const sideClass = details.side === 1 ? " is-b" : "";
      const netRows = details.incidentNets.length
        ? details.incidentNets
            .map(
              (net) => `
              <button class="net-row net-row-button" type="button"
                data-edit-action="select-net" data-net-id="${escapeHtml(net.id)}">
                <span class="net-id">${escapeHtml(net.id)}</span>
                <span class="net-cells">${net.cells.map(escapeHtml).join(" · ")}</span>
                <span class="net-state ${net.cut ? "is-cut" : ""}">${
                  net.cut ? "cut" : "internal"
                }</span>
              </button>`,
            )
            .join("")
        : `<div class="net-row"><span class="net-cells">No incident nets — use Connect</span></div>`;
      el.inspectorHint.textContent = "editing";
      el.inspectorBody.innerHTML = `
        <div class="inspector-header">
          <div class="cell-orb${sideClass}">${escapeHtml(details.label)}</div>
          <div class="inspector-identity">
            <label class="inspector-edit-name">
              <span>Cell name</span>
              <input class="inspector-name-input" data-edit-field="cell-label"
                data-id="${escapeHtml(details.id)}" value="${escapeHtml(details.label)}"
                maxlength="32" autocomplete="off">
            </label>
            <div class="inspector-sub">${details.incidentNets.length} incident ${
              details.incidentNets.length === 1 ? "net" : "nets"
            } · drag on board to move</div>
          </div>
        </div>
        <div class="edit-controls">
          <div class="edit-segment" role="group" aria-label="Starting block">
            <button class="edit-control${details.side === 0 ? " is-active" : ""}" type="button"
              data-edit-action="set-side" data-side="0">Block A</button>
            <button class="edit-control${details.side === 1 ? " is-active is-b" : ""}" type="button"
              data-edit-action="set-side" data-side="1">Block B</button>
          </div>
          <button class="edit-control edit-connect" type="button" data-edit-action="connect-cell">Connect…</button>
          <button class="edit-control edit-danger" type="button" data-edit-action="delete-cell">Delete</button>
        </div>
        <div class="edit-note"><strong>Tip:</strong> double-click the cell on the board to rename it. Drag across the cut line to change its starting block.</div>
        <div class="net-section-head"><span>Incident nets (${details.incidentNets.length})</span><span>click to inspect</span></div>
        <div class="net-list">${netRows}</div>`;
      return;
    }

    el.inspectorHint.textContent = "direct edit";
    if (engine.nodes.length === 0) {
      el.inspectorHint.textContent = "empty canvas";
      el.inspectorBody.innerHTML = `
        <div class="empty-state">
          <span class="empty-glyph" aria-hidden="true">＋</span>
          <p>Click anywhere on the board to add your first cell. The add-cell tool is already active, or press <kbd>N</kbd>.</p>
        </div>`;
      return;
    }
    el.inspectorBody.innerHTML = `
      <div class="empty-state">
        <span class="empty-glyph" aria-hidden="true">✎</span>
        <p>Drag a cell to move it. Double-click to rename. Select a cell or net for detailed editing.</p>
      </div>`;
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
    if (state.editing) {
      el.tabPanel.innerHTML = `
        <div class="tab-empty">
          <b>Graph editor is open</b>
          <span>Add, rename, move, connect, or delete cells on the board. Finish editing to run FM on the revised graph.</span>
        </div>`;
      return;
    }
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
    if (engine.status !== STATUS.ACTIVE || state.editing) {
      const statusText = state.editing
        ? "Finish editing the graph to compute gains."
        : engine.status === STATUS.READY
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
    if (!state.engine || state.editing) return;
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
    if (!state.engine || state.editing) return;
    stopPlayback();
    if (state.engine.status === STATUS.DONE) return;
    const event = state.engine.advance();
    state.lastEvent = event;
    renderAll({ animate: true });
  }

  function resetRun() {
    if (!state.engine || state.editing) return;
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

  el.editBtn.addEventListener("click", () => {
    if (state.editing) exitEditMode();
    else enterEditMode();
  });
  el.doneEditBtn.addEventListener("click", exitEditMode);
  el.undoEditBtn.addEventListener("click", undoGraphEdit);
  el.clearEditBtn.addEventListener("click", clearGraph);
  el.deleteEditBtn.addEventListener("click", deleteSelectedGraphItem);
  el.editorTools.forEach((button) => {
    button.addEventListener("click", () => setTool(button.dataset.tool));
  });
  el.cancelConnectBtn.addEventListener("click", cancelConnect);
  el.createNetBtn.addEventListener("click", createNetFromSelection);

  el.inspectorBody.addEventListener("click", (event) => {
    if (!state.editing) return;
    const actionEl = event.target.closest("[data-edit-action]");
    if (!actionEl) return;
    const action = actionEl.dataset.editAction;
    if (action === "set-side") {
      changeCellSide(state.selectedId, Number(actionEl.dataset.side));
    } else if (action === "connect-cell") {
      if (!state.selectedId) return;
      setTool("connect", { silent: true });
      toggleConnectNode(state.selectedId);
    } else if (action === "delete-cell") {
      if (state.selectedId) deleteNodeById(state.selectedId);
    } else if (action === "delete-net") {
      if (state.selectedNetId) deleteNetById(state.selectedNetId);
    } else if (action === "select-net") {
      selectNet(actionEl.dataset.netId);
    } else if (action === "select-cell") {
      selectNode(actionEl.dataset.cellId);
    }
  });

  el.inspectorBody.addEventListener("change", (event) => {
    const field = event.target.dataset.editField;
    if (!field) return;
    const value = event.target.value;
    if (field === "cell-label") {
      if (!renameNode(event.target.dataset.id, value)) updateInspector();
    } else if (field === "net-label") {
      if (!renameNet(event.target.dataset.id, value)) updateInspector();
    }
  });

  el.inspectorBody.addEventListener("keydown", (event) => {
    if ((event.key === "Enter" || event.key === "Escape") && event.target.dataset.editField) {
      event.preventDefault();
      if (event.key === "Escape") {
        updateInspector();
      } else {
        event.target.blur();
      }
    }
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
    if (!state.engine || state.editing) return;
    stopPlayback();
    state.engine.setSlack(Number(el.slackRange.value));
    state.lastEvent = null;
    renderAll({ animate: true });
  });

  el.graphSvg.addEventListener("click", (event) => {
    if (event.target.closest(".cell") || event.target.closest(".net-hit") || event.target.closest(".net-hit-hub")) {
      return;
    }
    if (state.editing) {
      if (state.tool === "add") {
        const point = eventToCanvas(event);
        addCellAt(point.x, point.y);
      } else if (state.tool === "select") {
        clearSelection();
      }
      return;
    }
    clearSelection();
  });

  el.graphSvg.addEventListener("dblclick", (event) => {
    if (!state.editing || state.tool !== "select") return;
    if (event.target.closest(".cell") || event.target.closest(".net-hit")) return;
    const point = eventToCanvas(event);
    addCellAt(point.x, point.y);
  });

  el.graphSvg.addEventListener("pointermove", (event) => {
    if (!state.editing || state.tool !== "connect") return;
    state.connectPointer = eventToCanvas(event);
    drawConnectPreview();
  });

  el.graphSvg.addEventListener("pointerleave", () => {
    if (!state.editing || state.tool !== "connect") return;
    state.connectPointer = null;
    drawConnectPreview();
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
    const isTyping =
      tag === "INPUT" ||
      tag === "TEXTAREA" ||
      tag === "SELECT" ||
      target.isContentEditable;

    if (state.editing && !isTyping) {
      const key = event.key.toLowerCase();
      if ((event.metaKey || event.ctrlKey) && key === "z") {
        event.preventDefault();
        undoGraphEdit();
        return;
      }
      if (event.key === "Escape") {
        if (state.renaming) {
          finishInlineRename(false);
        } else if (state.tool === "connect") {
          cancelConnect();
        } else if (state.selectedId || state.selectedNetId) {
          clearSelection();
        } else if (state.tool !== "select") {
          setTool("select", { silent: true });
        }
        event.preventDefault();
        return;
      }
      if (event.key === "Delete" || event.key === "Backspace") {
        if (state.selectedId || state.selectedNetId) {
          event.preventDefault();
          deleteSelectedGraphItem();
        }
        return;
      }
      if (key === "v") {
        event.preventDefault();
        setTool("select");
        return;
      }
      if (key === "n") {
        event.preventDefault();
        setTool("add");
        return;
      }
      if (key === "c") {
        event.preventDefault();
        setTool("connect");
        return;
      }
      if (event.key === "Enter" && state.tool === "connect") {
        if (tag === "BUTTON" || tag === "A") return;
        event.preventDefault();
        createNetFromSelection();
        return;
      }
      return;
    }

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
        closeInlineRename(false);
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
