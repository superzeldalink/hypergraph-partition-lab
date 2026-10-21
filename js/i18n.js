/*
 * Partition Lab Vietnamese/English copy.
 *
 * The Vietnamese terminology follows the course slides:
 *   phân vùng, siêu đồ thị, net then chốt, cell cơ sở, phân bố pin,
 *   lượt, hoán đổi, cố định, gain, FS/TE, kích thước cắt.
 */
(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.I18N = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  const DEFAULT_LANGUAGE = "vi";
  const STORAGE_KEY = "partition-lab-language";

  const VI = {
    /* ------------------------------------------------------------------ */
    /* Shell and header                                                    */
    /* ------------------------------------------------------------------ */
    "Partition Lab · FM + KL": "Partition Lab · FM + KL",
    "Partition Lab home": "Trang chủ Partition Lab",
    "Fiduccia–Mattheyses + Kernighan–Lin partitioning":
      "Phân vùng Fiduccia–Mattheyses + Kernighan–Lin",
    "Example": "Ví dụ",
    "Choose an example hypergraph": "Chọn một siêu đồ thị ví dụ",
    "Generate a seeded random netlist": "Tạo netlist ngẫu nhiên theo hạt giống",
    "Random": "Ngẫu nhiên",
    "Import or export hypergraph JSON": "Nhập hoặc xuất JSON siêu đồ thị",
    "Data": "Dữ liệu",
    "How FM and KL work": "Cách FM và KL hoạt động",
    "Partition visualization": "Minh họa phân vùng",
    "Partition board": "Bảng phân vùng",
    "Ready": "Sẵn sàng",
    "Edit this graph directly on the board": "Sửa trực tiếp đồ thị trên bảng",
    "Finish editing and return to the solver": "Kết thúc chỉnh sửa và quay lại thuật toán",
    "Edit graph": "Sửa đồ thị",
    "Done editing": "Xong chỉnh sửa",
    "Cut nets": "Net bị cắt",
    "Nets where moving one cell can change whether the net is cut.":
      "Các net mà khi di chuyển một cell có thể làm thay đổi trạng thái cắt của net.",
    "none": "không có",
    "Block balance": "Cân bằng khối",
    "Block A": "Khối A",
    "Block B": "Khối B",
    "Maximum block size": "Kích thước khối tối đa",
    "Graph editing tools": "Công cụ chỉnh sửa đồ thị",
    "Graph editor": "Trình sửa đồ thị",
    "Select": "Chọn",
    "Add cell": "Thêm cell",
    "Connect": "Nối net",
    "Drag cells · double-click a name to rename":
      "Kéo cell · nhấp đúp tên để đổi tên",
    "Undo": "Hoàn tác",
    "Clear": "Xóa hết",
    "Delete": "Xóa",
    "Done": "Xong",
    "Pick two or more cells": "Chọn từ hai cell trở lên",
    "Cancel": "Hủy",
    "Create net": "Tạo net",
    "Hypergraph partition board": "Bảng phân vùng siêu đồ thị",
    "BLOCK A": "KHỐI A",
    "BLOCK B": "KHỐI B",
    "CUT": "CẮT",
    "Legend": "Chú thích",
    "Internal net": "Net nội bộ",
    "Cut net": "Net bị cắt",
    "Critical name": "Tên net then chốt",
    "Other name": "Tên net khác",
    "Unlocked cell": "Cell tự do",
    "Locked": "Đã cố định",
    "Partitioning pass anatomy": "Cấu trúc một lượt phân vùng",
    "Press Step to open pass 1.": "Nhấn Bước để mở lượt 1.",
    "Split": "Chia",
    "Compute D": "Tính D",
    "Best pair": "Cặp tốt nhất",
    "Swap & lock": "Hoán đổi & cố định",
    "Update D": "Cập nhật D",
    "Gain buckets": "Nhóm gain",
    "Pick best": "Chọn tốt nhất",
    "Move & lock": "Di chuyển & cố định",
    "Update gains": "Cập nhật gain",
    "Best prefix": "Chuỗi tốt nhất",

    /* ------------------------------------------------------------------ */
    /* Run panel                                                           */
    /* ------------------------------------------------------------------ */
    "Run control": "Điều khiển",
    "Partitioning algorithm": "Thuật toán phân vùng",
    "Kernighan–Lin: swap a pair and lock both":
      "Kernighan–Lin: hoán đổi một cặp và cố định cả hai",
    "Fiduccia–Mattheyses: move one cell and lock it":
      "Fiduccia–Mattheyses: di chuyển một cell và cố định nó",
    "pair swaps": "hoán đổi cặp",
    "cell moves": "di chuyển cell",
    "Play": "Phát",
    "Pause": "Tạm dừng",
    "Replay": "Phát lại",
    "Step": "Bước",
    "Run pass": "Chạy hết lượt",
    "Reset run": "Đặt lại",
    "Re-split start": "Chia lại phân vùng đầu",
    "Playback speed": "Tốc độ phát",
    "Balance slack": "Độ dư cân bằng",
    "Block sizes": "Kích thước khối",
    "fixed": "cố định",
    "Cut": "Cắt",
    "Cut size": "Kích thước cắt",
    "Pass": "Lượt",
    "Kept moves": "Giữ lại",
    "Kept swaps": "Giữ lại",
    "Pass gain": "Gain lượt",
    "ready": "sẵn sàng",
    "active": "đang chạy",
    "between": "giữa hai lượt",
    "done": "kết thúc",
    "Cell inspector": "Chi tiết cell",
    "Net inspector": "Chi tiết net",
    "click a cell": "chọn một cell",
    "Select any cell to see its gain breakdown and incident nets.":
      "Chọn một cell để xem phân tích gain và các net liên quan.",
    "Select any cell to see its score breakdown and incident nets.":
      "Chọn một cell để xem phân tích điểm và các net liên quan.",
    "Solver details": "Chi tiết thuật toán",
    "Move log": "Nhật ký di chuyển",
    "Gain queue": "Hàng đợi gain",
    "Pair queue": "Hàng đợi cặp",
    "Method": "Phương pháp",

    /* ------------------------------------------------------------------ */
    /* Shared dynamic labels                                               */
    /* ------------------------------------------------------------------ */
    "free": "tự do",
    "locked": "đã cố định",
    "unlocked": "tự do",
    "internal": "nội bộ",
    "close": "đang cắt",
    "open": "chưa cắt",
    "cut": "bị cắt",
    "A {a} · B {b}.": "A {a} · B {b}.",
    "{n} cell": "{n} cell",
    "{n} cells": "{n} cell",
    "{n} net": "{n} net",
    "{n} nets": "{n} net",
    "{n} critical net": "{n} net then chốt",
    "{n} critical nets": "{n} net then chốt",
    "{n} cut-critical": "{n} đang cắt",
    "{n} uncut-critical": "{n} chưa cắt",
    "{n} attempted": "{n} lần thử",
    "{n} fewer": "giảm {n}",
    "{n} selected": "đã chọn {n}",
    "{n} swaps": "{n} hoán đổi",
    "{n} moves": "{n} di chuyển",
    "{n} cells · {nets} nets": "{n} cell · {nets} net",
    "· seed {seed}": "· hạt giống {seed}",
    " · fixed {a}/{b}": " · cố định {a}/{b}",
    " · cap {max}": " · trần {max}",
    "fixed {a} / {b}": "cố định {a} / {b}",
    "cap {max} / block": "trần {max} / khối",
    "Maximum block size: {max} cells": "Kích thước khối tối đa: {max} cell",
    "−{n} from start": "−{n} so với đầu",
    "start {n}": "đầu {n}",
    "best {cut}": "tốt nhất {cut}",
    "Pass {pass} · improved": "Lượt {pass} · đã cải thiện",
    "Pass {pass} · {mode}": "Lượt {pass} · {mode}",
    "Pass {pass} · {count} {unit}": "Lượt {pass} · {count} {unit}",
    "Editing": "Đang chỉnh sửa",
    "Converged": "Đã hội tụ",
    "D scores": "điểm D",
    "gains": "gain",
    "swap": "hoán đổi",
    "swaps": "hoán đổi",
    "move": "di chuyển",
    "moves": "di chuyển",
    "Start a pass to compute D(v) and the free swap pairs.":
      "Bắt đầu một lượt để tính D(v) và các cặp hoán đổi tự do.",
    "Start a pass to compute D(v) and the pair queue for pass 1.":
      "Bắt đầu một lượt để tính D(v) và hàng đợi cặp cho lượt 1.",
    "Run complete. Reset to inspect swap candidates again.":
      "Đã chạy xong. Đặt lại để xem lại các cặp hoán đổi.",
    "Fixed for this pass. It becomes available again at the next pass boundary.":
      "Đã cố định trong lượt này. Cell sẽ tự do trở lại ở ranh giới lượt tiếp theo.",
    "No free partner in the other block.":
      "Không có cell tự do ở khối còn lại để ghép cặp.",
    "Best free swap: <strong>{label}</strong> ({gain}) · cut {before}→{after}.":
      "Cặp hoán đổi tự do tốt nhất: <strong>{label}</strong> ({gain}) · cắt {before}→{after}.",

    /* ------------------------------------------------------------------ */
    /* Criticality / net badges                                            */
    /* ------------------------------------------------------------------ */
    "Cut-critical: both blocks hold one cell; moving either one closes the net (FS).":
      "Then chốt đang cắt: cả hai khối đều có một cell; di chuyển cell nào cũng đóng net (FS).",
    "Cut-critical: the lone Block {block} cell can close the net by moving (FS).":
      "Then chốt đang cắt: cell đơn độc ở Khối {block} có thể đóng net bằng cách di chuyển (FS).",
    "This cell is that lone cell.": "Cell này chính là cell đơn độc đó.",
    "This cell is not the lone cell.": "Cell này không phải cell đơn độc đó.",
    "Uncut-critical: moving a cell in Block {block} across cuts the net (TE).":
      "Then chốt chưa cắt: di chuyển một cell ở Khối {block} sang khối kia sẽ cắt net (TE).",
    "This cell can open it.": "Cell này có thể làm net bị cắt.",
    "Cut, but no single-cell move changes its status.":
      "Net bị cắt, nhưng không có lần di chuyển một cell nào làm thay đổi trạng thái.",
    "A net is critical when moving one cell can change whether it is cut: A=0, A=1, B=0, or B=1. Cut-critical nets are cut and one move can uncut them; uncut-critical nets are internal and one move can cut them.":
      "Một net là then chốt khi di chuyển một cell có thể làm thay đổi trạng thái cắt: A=0, A=1, B=0 hoặc B=1. Net then chốt đang cắt đang bị cắt và một lần di chuyển có thể làm nó không còn bị cắt; net then chốt chưa cắt nằm nội bộ và một lần di chuyển có thể cắt nó.",
    "{n} critical net: {cutCritical} cut-critical, {uncutCritical} uncut-critical.":
      "{n} net then chốt: {cutCritical} đang cắt, {uncutCritical} chưa cắt.",
    "{n} critical nets: {cutCritical} cut-critical, {uncutCritical} uncut-critical.":
      "{n} net then chốt: {cutCritical} đang cắt, {uncutCritical} chưa cắt.",
    "No critical nets.": "Không có net then chốt.",
    "Critical nets: {names}. {definition}":
      "Các net then chốt: {names}. {definition}",
    "No critical nets. {definition}": "Không có net then chốt. {definition}",

    /* ------------------------------------------------------------------ */
    /* Presets, random and import                                          */
    /* ------------------------------------------------------------------ */
    "Signal hypergraph": "Siêu đồ thị tín hiệu",
    "A mixed-size netlist. Alternating cells start mixed together; FM pulls the clusters apart.":
      "Một netlist có kích thước hỗn hợp. Các cell được xếp xen kẽ lúc đầu; FM kéo các cụm tách ra.",
    "A 12-cell, 15-net hypergraph with three loosely coupled clusters and two bridge nets.":
      "Siêu đồ thị 12 cell, 15 net với ba cụm liên kết lỏng và hai net cầu.",
    "Two clusters": "Hai cụm",
    "Two four-cell rings joined by bridges. A compact tutorial for watching gains and rollback.":
      "Hai vòng bốn cell nối bằng các cầu. Ví dụ gọn để theo dõi gain và hoàn tác.",
    "Two tightly connected rings linked by three bridge nets. Alternating blocks cut every ring.":
      "Hai vòng liên kết chặt, nối bằng ba net cầu. Cách chia xen kẽ cắt mọi vòng.",
    "4 × 3 grid": "Lưới 4 × 3",
    "A planar mesh. The alternating start slices the grid; FM finds a clean spatial split.":
      "Một lưới phẳng. Cách chia xen kẽ cắt lưới; FM tìm được phân vùng không gian gọn.",
    "A planar 4 by 3 mesh with 17 two-terminal nets and an alternating initial cut.":
      "Lưới phẳng 4 × 3 với 17 net hai đầu và phân vùng đầu xen kẽ.",
    "Critical-net example": "Ví dụ net then chốt",
    "N2 is uncut-critical, N3 is cut-critical, and the 2/2 cut net N1 is noncritical.":
      "N2 là net then chốt chưa cắt, N3 là net then chốt đang cắt, còn net N1 cắt 2/2 không then chốt.",
    "The reference netlist: N1 cuts 2/2 and is noncritical; N2 is internal (3/0); N3 is cut 1/2. Moving a cell can change the cut status of N2 and N3.":
      "Netlist tham chiếu: N1 cắt 2/2 và không then chốt; N2 nội bộ (3/0); N3 cắt 1/2. Di chuyển một cell có thể làm thay đổi trạng thái cắt của N2 và N3.",
    "BT1 · Merged-net circuit": "BT1 · Mạch gộp net",
    "Bài tập 1: circuit (a) merged into nets n1–n6, starting as A = {a,c,e,g} and B = {b,d,f,h}.":
      "Bài tập 1: mạch (a) được gộp thành các net n1–n6, bắt đầu với A = {a,c,e,g} và B = {b,d,f,h}.",
    "BT1 graph": "Đồ thị BT1",
    "The circuit (a) netlist merged into six nets: n1 = {a,c,e}, n2 = {b,c,d}, n3 = {c,e,f}, n4 = {d,f}, n5 = {e,g}, and n6 = {f,g,h}. Initial partition A = {a,c,e,g}, B = {b,d,f,h}.":
      "Netlist của mạch (a) được gộp thành sáu net: n1 = {a,c,e}, n2 = {b,c,d}, n3 = {c,e,f}, n4 = {d,f}, n5 = {e,g}, n6 = {f,g,h}. Phân vùng ban đầu A = {a,c,e,g}, B = {b,d,f,h}.",
    "BT2 · Two-way partition graph": "BT2 · Đồ thị phân vùng hai chiều",
    "Bài tập 2: a 6-node graph with 8 unit-weight edges starting as A = {a,b,c} and B = {d,e,f}.":
      "Bài tập 2: đồ thị 6 nút với 8 cạnh trọng số 1, bắt đầu với A = {a,b,c} và B = {d,e,f}.",
    "Two-way partition graph": "Đồ thị phân vùng hai chiều",
    "An undirected graph with 6 nodes and 8 unit-weight edges, divided into partitions A = {a,b,c} and B = {d,e,f} by a vertical dashed line.":
      "Đồ thị vô hướng 6 nút, 8 cạnh trọng số 1, được chia thành hai phân vùng A = {a,b,c} và B = {d,e,f} bằng đường đứt nét dọc.",
    "BT4 · Reference hypergraph": "BT4 · Siêu đồ thị tham chiếu",
    "Bài tập 4: the 9-node reference hypergraph with N1, N2, and N3 on a 6/3 start.":
      "Bài tập 4: siêu đồ thị tham chiếu 9 nút với N1, N2 và N3 trên phân vùng đầu 6/3.",
    "Reference hypergraph": "Siêu đồ thị tham chiếu",
    "A hypergraph with 9 nodes and 3 nets, divided into two partitions by a vertical dashed line. N1 connects nodes a, b, c, and d; N2 connects nodes e, f, and g; N3 connects nodes h, d, and i.":
      "Siêu đồ thị 9 nút và 3 net, chia thành hai phân vùng bằng đường đứt nét dọc. N1 nối các nút a, b, c, d; N2 nối e, f, g; N3 nối h, d, i.",
    "KL Example 2.1": "Ví dụ KL 2.1",
    "The slide's a–h graph. First pass: c ↔ e (+3), d ↔ f (+5), best prefix G₂ = 8.":
      "Đồ thị a–h trong slide. Lượt đầu: c ↔ e (+3), d ↔ f (+5), chuỗi hoán đổi tốt nhất G₂ = 8.",
    "Initial cut 9. KL's first pass chooses c ↔ e (+3), d ↔ f (+5), then explores a ↔ g (−6) and b ↔ h (−2); the best prefix keeps the first two swaps and reaches cut 1.":
      "Kích thước cắt đầu 9. Lượt đầu của KL chọn c ↔ e (+3), d ↔ f (+5), rồi thử a ↔ g (−6) và b ↔ h (−2); chuỗi hoán đổi tốt nhất giữ hai hoán đổi đầu và đạt cắt 1.",
    "Random netlist": "Netlist ngẫu nhiên",
    "Custom graph": "Đồ thị tùy chỉnh",
    "Random netlist #{seed}": "Netlist ngẫu nhiên #{seed}",
    "{cells} cells, {edges} two-terminal nets and {hyper} hypernets. Generated from seed {seed}.":
      "{cells} cell, {edges} net hai đầu và {hyper} siêu net. Sinh từ hạt giống {seed}.",
    "Untitled hypergraph": "Siêu đồ thị chưa đặt tên",
    "Hypergraph": "Siêu đồ thị",
    "Imported hypergraph": "Siêu đồ thị đã nhập",
    "Imported hypergraph with {cells} cells and {nets} nets.":
      "Siêu đồ thị đã nhập với {cells} cell và {nets} net.",

    /* ------------------------------------------------------------------ */
    /* Toasts and editor                                                   */
    /* ------------------------------------------------------------------ */
    "Undid graph edit": "Đã hoàn tác chỉnh sửa đồ thị",
    "Generated random netlist #{seed}": "Đã tạo netlist ngẫu nhiên #{seed}",
    "Balanced start re-split": "Đã chia lại phân vùng đầu cân bằng",
    "JSON error: {message}": "Lỗi JSON: {message}",
    "The graph needs a non-empty nodes array.":
      "Đồ thị cần mảng nodes không rỗng.",
    "The graph needs a nets or edges array.":
      "Đồ thị cần mảng nets hoặc edges.",
    "Add at least one net with two or more valid cell IDs.":
      "Hãy thêm ít nhất một net với hai ID cell hợp lệ trở lên.",
    "Could not load this graph.": "Không thể tải đồ thị này.",
    "Loaded {cells} cells · {nets} nets": "Đã tải {cells} cell · {nets} net",
    "Copied graph JSON": "Đã sao chép JSON của đồ thị",
    "Clipboard access was blocked": "Quyền truy cập clipboard bị chặn",
    "Drag cells · double-click a name to rename · drag across the cut to change start block":
      "Kéo cell · nhấp đúp tên để đổi tên · kéo qua đường cắt để đổi khối bắt đầu",
    "Click empty canvas to drop a new cell · press V to select":
      "Nhấp vào vùng trống để thêm cell · nhấn V để chọn",
    "Click cells in order · Enter creates the net and keeps Connect active · Esc to finish":
      "Nhấp các cell theo thứ tự · Enter tạo net và giữ chế độ Nối net · Esc để kết thúc",
    "Select tool · drag cells to move them":
      "Công cụ Chọn · kéo cell để di chuyển",
    "Add tool · click the board to place a cell":
      "Công cụ Thêm · nhấp lên bảng để đặt cell",
    "Connect tool · click two or more cells":
      "Công cụ Nối net · nhấp từ hai cell trở lên",
    "Connection cancelled": "Đã hủy nối net",
    "Pick at least two cells to create a net":
      "Chọn ít nhất hai cell để tạo net",
    "Those cells are already connected by {net}":
      "Các cell này đã được nối bởi {net}",
    "Created net {net} · {cells} cells · still connecting":
      "Đã tạo net {net} · {cells} cell · vẫn đang nối",
    "Graph editor on · changes restart the {algorithm} run":
      "Đã mở trình sửa đồ thị · thay đổi sẽ khởi động lại lượt chạy {algorithm}",
    "Add at least two cells before finishing":
      "Thêm ít nhất hai cell trước khi kết thúc",
    "Editor closed · {algorithm} run reset":
      "Đã đóng trình sửa · lượt chạy {algorithm} được đặt lại",
    "Added cell {label} in Block {block}":
      "Đã thêm cell {label} vào Khối {block}",
    "A cell name cannot be empty": "Tên cell không được để trống",
    "Renamed cell to {label}": "Đã đổi tên cell thành {label}",
    "A net name cannot be empty": "Tên net không được để trống",
    "Renamed net to {label}": "Đã đổi tên net thành {label}",
    "Each block needs at least one cell":
      "Mỗi khối cần ít nhất một cell",
    "Start block changed to {block}": "Đã đổi khối bắt đầu thành {block}",
    "Deleted cell": "Đã xóa cell",
    "Deleted cell · removed {n} collapsed net":
      "Đã xóa cell · gỡ {n} net bị thu gọn",
    "Deleted cell · removed {n} collapsed nets":
      "Đã xóa cell · gỡ {n} net bị thu gọn",
    "Deleted net {net}": "Đã xóa net {net}",
    "Canvas cleared · click to add cells · Undo to restore":
      "Đã xóa bảng · nhấp để thêm cell · Hoàn tác để khôi phục",
    "Rename cell {label}": "Đổi tên cell {label}",
    "Cell {label} now starts in Block {block}":
      "Cell {label} giờ bắt đầu ở Khối {block}",
    "Cell {label} · drag to move · double-click to rename":
      "Cell {label} · kéo để di chuyển · nhấp đúp để đổi tên",
    "Cell {label}, starts in {block}. Drag to move, double-click to rename.":
      "Cell {label}, bắt đầu ở {block}. Kéo để di chuyển, nhấp đúp để đổi tên.",
    "Cell {label}, {block}, {score} {gain}, {locked}. Select to inspect.":
      "Cell {label}, {block}, {score} {gain}, {locked}. Chọn để xem chi tiết.",
    "Cell {label} · {block} · {score} {gain}{locked}":
      "Cell {label} · {block} · {score} {gain}{locked}",
    " · {locked}": " · {locked}",
    "Finish editing before switching algorithms":
      "Kết thúc chỉnh sửa trước khi chuyển thuật toán",
    "KL mode · swap one cell from each block":
      "Chế độ KL · hoán đổi một cell từ mỗi khối",
    "FM mode · move one cell at a time":
      "Chế độ FM · di chuyển từng cell một",
    "Replaying from the initial partition":
      "Đang phát lại từ phân vùng ban đầu",
    "Finish editing to run the solver":
      "Kết thúc chỉnh sửa để chạy thuật toán",
    "Pause (Space)": "Tạm dừng (Space)",
    "Replay run (Space)": "Phát lại lượt chạy (Space)",
    "Play (Space)": "Phát (Space)",
    "KL swaps keep the starting block sizes; block counts do not change.":
      "KL giữ nguyên kích thước khối ban đầu khi hoán đổi; số cell mỗi khối không đổi.",
    "Add at least two cells before finishing the graph.":
      "Thêm ít nhất hai cell trước khi hoàn tất đồ thị.",
    "Add one more cell before finishing the graph.":
      "Thêm một cell nữa trước khi hoàn tất đồ thị.",
    "Strict {max}/{count} split. Single-cell moves are blocked.":
      "Chia nghiêm ngặt {max}/{count}. Các lần di chuyển một cell bị chặn.",
    "Blocks stay between {min} and {max} of {count} cells.":
      "Các khối giữ trong khoảng {min} đến {max} trên {count} cell.",
    "0 cells": "0 cell",
    "+{n} cell": "+{n} cell",
    "+{n} cells": "+{n} cell",

    /* ------------------------------------------------------------------ */
    /* Next-step guidance                                                  */
    /* ------------------------------------------------------------------ */
    "Click empty canvas to add a cell. Use the inspector to rename or change its starting block.":
      "Nhấp vào vùng trống để thêm cell. Dùng phần chi tiết để đổi tên hoặc đổi khối bắt đầu.",
    "Click two or more cells, then <strong>Create net</strong>. Press Esc to cancel.":
      "Nhấp từ hai cell trở lên, sau đó <strong>Tạo net</strong>. Nhấn Esc để hủy.",
    "Drag cells to move them. Double-click a name to rename. Click a net line to inspect or delete it.":
      "Kéo cell để di chuyển. Nhấp đúp tên để đổi tên. Nhấp đường net để xem hoặc xóa.",
    "Press <strong>Step</strong> to compute <code>D(v)</code> and the pair queue for pass 1.":
      "Nhấn <strong>Bước</strong> để tính <code>D(v)</code> và hàng đợi cặp cho lượt 1.",
    "Press <strong>Step</strong> to compute gains for pass 1.":
      "Nhấn <strong>Bước</strong> để tính gain cho lượt 1.",
    "Every cell is fixed or one block has no free cell. Next step closes the pass and restores its best prefix.":
      "Mọi cell đã cố định hoặc một khối không còn cell tự do. Bước tiếp theo sẽ đóng lượt và khôi phục chuỗi tốt nhất.",
    "All eligible cells are locked. Next step closes the pass and restores its best prefix.":
      "Mọi cell hợp lệ đã cố định. Bước tiếp theo sẽ đóng lượt và khôi phục chuỗi tốt nhất.",
    "{cells} free cells scored. Next swap: {pair} · {a} ↔ {b}.":
      "Đã tính điểm {cells} cell tự do. Hoán đổi tiếp theo: {pair} · {a} ↔ {b}.",
    "Next swap: {pair} · cut {cut}.":
      "Hoán đổi tiếp theo: {pair} · cắt {cut}.",
    "{cells} gains computed. Next: <strong>{label}</strong> ({gain}) {from} → {to}.":
      "Đã tính gain cho {cells} cell. Cell cơ sở tiếp theo: <strong>{label}</strong> ({gain}) {from} → {to}.",
    "Next pick: <strong>{label}</strong> ({gain}) {from} → {to} · cut {cut}.":
      "Cell cơ sở tiếp theo: <strong>{label}</strong> ({gain}) {from} → {to} · cắt {cut}.",
    "Pass {pass} kept <strong>cut {cut}</strong> ({improvement} fewer). Next Step starts pass {next}.":
      "Lượt {pass} giữ <strong>cắt {cut}</strong> ({improvement} giảm). Bước tiếp theo bắt đầu lượt {next}.",
    "No improving pass remains. Final cut <strong>{cut}</strong>, {improvement} fewer than the start.":
      "Không còn lượt nào cải thiện. Kích thước cắt cuối <strong>{cut}</strong>, giảm {improvement} so với đầu.",

    /* ------------------------------------------------------------------ */
    /* Inspector                                                           */
    /* ------------------------------------------------------------------ */
    "No incident nets": "Không có net liên quan",
    "No incident nets — use Connect": "Không có net liên quan — dùng Nối net",
    "Cell {label}": "Cell {label}",
    "Block {block}": "Khối {block}",
    "Fixed for this pass": "Đã cố định trong lượt này",
    "Free to swap": "Tự do hoán đổi",
    "Locked for this pass": "Đã cố định trong lượt này",
    "Unlocked": "Tự do",
    "{n} incident cut net": "{n} net liên quan bị cắt",
    "{n} incident cut nets": "{n} net liên quan bị cắt",
    "Gain": "Gain",
    "Block": "Khối",
    "Incident nets ({n})": "Net liên quan ({n})",
    "Pin distribution A {a} / B {b}": "Phân bố pin A {a} / B {b}",
    "{n} critical here": "{n} then chốt tại đây",
    "Incident nets whose cut status changes if this cell moves. FS nets close; TE nets open.":
      "Các net liên quan có trạng thái cắt thay đổi nếu cell này di chuyển. Net FS đóng lại; net TE mở ra.",
    "cut-critical": "then chốt đang cắt",
    "uncut-critical": "then chốt chưa cắt",
    "cut, not critical": "bị cắt, không then chốt",
    "Lone cell: {list}. Moving it closes the net and contributes +1 to FS.":
      "Cell đơn độc: {list}. Di chuyển nó sẽ đóng net và đóng góp +1 vào FS.",
    "Lone cells: {list}. Moving either one closes the net and contributes +1 to FS.":
      "Các cell đơn độc: {list}. Di chuyển một trong hai sẽ đóng net và đóng góp +1 vào FS.",
    "All {cells} cells are in {block}. Moving any one to {destination} cuts the net and contributes −1 to its gain (TE).":
      "Cả {cells} cell đều ở {block}. Di chuyển bất kỳ cell nào sang {destination} sẽ cắt net và đóng góp −1 vào gain (TE).",
    "A {a} / B {b}. Moving one cell keeps this net cut, so it is neither cut-critical nor uncut-critical.":
      "A {a} / B {b}. Di chuyển một cell vẫn giữ net bị cắt, nên net không phải then chốt đang cắt hay chưa cắt.",
    "not critical": "không then chốt",
    "Select {label}": "Chọn {label}",
    "Select {label} — lone cell from Block {block}; moving it closes the net":
      "Chọn {label} — cell đơn độc ở Khối {block}; di chuyển nó sẽ đóng net",
    "Select {label} — moving it would cut this uncut-critical net":
      "Chọn {label} — di chuyển nó sẽ cắt net then chốt chưa cắt này",
    "net selected": "đã chọn net",
    "Net name": "Tên net",
    "{cells} cells · A {a} / B {b} · {state}":
      "{cells} cell · A {a} / B {b} · {state}",
    "Delete net": "Xóa net",
    "Connected cells": "Các cell được nối",
    "Tip:": "Mẹo:",
    "drag a net line? Select cells and use <strong>Connect</strong> to create a new hyperedge. Delete and rebuild to change membership.":
      "muốn kéo đường net? Chọn các cell và dùng <strong>Nối net</strong> để tạo siêu cạnh mới. Xóa rồi tạo lại để đổi thành viên.",
    "editing": "đang chỉnh sửa",
    "Cell name": "Tên cell",
    "{n} incident net · drag on board to move":
      "{n} net liên quan · kéo trên bảng để di chuyển",
    "{n} incident nets · drag on board to move":
      "{n} net liên quan · kéo trên bảng để di chuyển",
    "Starting block": "Khối bắt đầu",
    "Connect…": "Nối net…",
    "Double-click the cell on the board to rename it. Drag across the cut line to change its starting block.":
      "Nhấp đúp cell trên bảng để đổi tên. Kéo qua đường cắt để đổi khối bắt đầu.",
    "direct edit": "chỉnh sửa trực tiếp",
    "empty canvas": "bảng trống",
    "Click anywhere on the board to add your first cell. The add-cell tool is already active, or press <kbd>N</kbd>.":
      "Nhấp vào bất kỳ đâu trên bảng để thêm cell đầu tiên. Công cụ thêm cell đã được bật, hoặc nhấn <kbd>N</kbd>.",
    "Drag a cell to move it. Double-click to rename. Select a cell or net for detailed editing.":
      "Kéo cell để di chuyển. Nhấp đúp để đổi tên. Chọn cell hoặc net để chỉnh sửa chi tiết.",

    /* ------------------------------------------------------------------ */
    /* Log, queues and method                                              */
    /* ------------------------------------------------------------------ */
    "Graph editor is open": "Trình sửa đồ thị đang mở",
    "Add, rename, move, connect, or delete cells on the board. Finish editing to run {algorithm} on the revised graph.":
      "Thêm, đổi tên, di chuyển, nối hoặc xóa cell trên bảng. Kết thúc chỉnh sửa để chạy {algorithm} trên đồ thị mới.",
    "No swaps yet": "Chưa có hoán đổi",
    "No moves yet": "Chưa có di chuyển",
    "Press <kbd>S</kbd> or <kbd>Step</kbd> to open pass 1.":
      "Nhấn <kbd>S</kbd> hoặc <kbd>Bước</kbd> để mở lượt 1.",
    "Pass {pass} begins": "Bắt đầu lượt {pass}",
    "cut {cut}": "cắt {cut}",
    "Rolled back at pass end": "Đã hoàn tác cuối lượt",
    "Kept in best prefix": "Được giữ trong chuỗi tốt nhất",
    "BEST": "TỐT NHẤT",
    "Pass {pass}: cut {startCut} → {bestCut}":
      "Lượt {pass}: cắt {startCut} → {bestCut}",
    "Kept {accepted} of {attempted} {unit}; rolled back {rolledBack}.":
      "Giữ {accepted} trong {attempted} {unit}; hoàn tác {rolledBack}.",
    "No improvement; kept the pass-start partition.":
      "Không cải thiện; giữ phân vùng đầu lượt.",
    "Finish editing the graph to compute swap candidates.":
      "Kết thúc chỉnh sửa đồ thị để tính các cặp hoán đổi.",
    "Start a pass to compute D(v) and the free pair queue.":
      "Bắt đầu một lượt để tính D(v) và hàng đợi cặp tự do.",
    "Pass closed. D(v) is recomputed when the next pass starts.":
      "Lượt đã đóng. D(v) sẽ được tính lại khi bắt đầu lượt tiếp theo.",
    "Run complete. Reset to inspect the first pass again.":
      "Đã chạy xong. Đặt lại để xem lại lượt đầu.",
    "No active pair queue": "Chưa có hàng đợi cặp",
    "No legal swaps": "Không có cặp hoán đổi hợp lệ",
    "Every cell is fixed or one block has no free cell. Close the pass to keep its best prefix.":
      "Mọi cell đã cố định hoặc một khối không còn cell tự do. Đóng lượt để giữ chuỗi tốt nhất.",
    "Best free swaps": "Các cặp hoán đổi tự do tốt nhất",
    "{a}/{b} · fixed": "{a}/{b} · cố định",
    "Highest pair gain wins; ties go alphabetically. Both cells lock. Cut effect assumes only this swap; on a hypergraph it is the exact net-cut change.":
      "Cặp có gain cao nhất thắng; đồng hạng xét theo bảng chữ cái. Cả hai cell bị cố định. Hiệu ứng lên cắt chỉ xét lần hoán đổi này; trên siêu đồ thị đây là thay đổi kích thước cắt chính xác.",
    "Finish editing the graph to compute gains.":
      "Kết thúc chỉnh sửa đồ thị để tính gain.",
    "Start a pass to fill the gain buckets.":
      "Bắt đầu một lượt để làm đầy các nhóm gain.",
    "Pass closed. Gains are recomputed when the next pass starts.":
      "Lượt đã đóng. Gain sẽ được tính lại khi bắt đầu lượt tiếp theo.",
    "No active gain queue": "Chưa có hàng đợi gain",
    "No eligible moves": "Không có lần di chuyển hợp lệ",
    "Every cell is locked or would violate the block bounds. Close the pass to keep its best prefix.":
      "Mọi cell đã cố định hoặc sẽ vi phạm giới hạn khối. Đóng lượt để giữ chuỗi tốt nhất.",
    "Eligible moves": "Các lần di chuyển hợp lệ",
    "{a}/{b} · cap {max}": "{a}/{b} · trần {max}",
    "Highest gain wins. Ties go to the destination with the smaller block. Cut effect assumes only this move.":
      "Gain cao nhất thắng. Đồng hạng ưu tiên khối đích nhỏ hơn. Hiệu ứng lên cắt chỉ xét lần di chuyển này.",
    "dest {n}": "đích {n}",

    /* ------------------------------------------------------------------ */
    /* Method tab                                                          */
    /* ------------------------------------------------------------------ */
    "D(v) and pair gain": "D(v) và gain của cặp",
    "D(v) = E<sub>other</sub>(v) − E<sub>same</sub>(v)":
      "D(v) = E<sub>khác</sub>(v) − E<sub>cùng</sub>(v)",
    "D(v) is the change from moving one free cell alone; on this board it equals FS − TE. The pair gain is exact for the unit-cost net cut. For two-terminal nets it reduces to the slide's graph formula, where c(a,b) is the shared edge count.":
      "D(v) là thay đổi khi di chuyển riêng một cell tự do; trên bảng này D(v) bằng FS − TE. Gain của cặp là chính xác cho kích thước cắt với trọng số đơn vị. Với net hai đầu, nó trùng công thức đồ thị trong slide, trong đó c(a,b) là số cạnh dùng chung.",
    "The KL pass": "Một lượt KL",
    "Score every free cell and every legal A↔B pair.":
      "Tính điểm cho mọi cell tự do và mọi cặp A↔B hợp lệ.",
    "Swap the highest-gain pair and lock both cells.":
      "Hoán đổi cặp có gain cao nhất và cố định cả hai cell.",
    "Recompute the scores; keep exploring even through negative gains.":
      "Tính lại điểm; tiếp tục khám phá kể cả khi gain âm.",
    "Remember the prefix with the lowest cut.":
      "Ghi nhớ chuỗi di chuyển/hoán đổi có kích thước cắt nhỏ nhất.",
    "Roll back to that prefix and unlock all cells; stop if the cut did not improve.":
      "Hoàn tác về chuỗi đó và bỏ cố định mọi cell; dừng nếu kích thước cắt không giảm.",
    "Balance": "Cân bằng",
    "KL swaps preserve the starting split: {a} cells in A and {b} in B. Slack is an FM-only control.":
      "Hoán đổi KL giữ nguyên cách chia ban đầu: {a} cell ở A và {b} ở B. Độ dư chỉ dùng cho FM.",
    "Gain of a cell": "Gain của một cell",
    "FS counts cut-critical nets where v is the lone cell on its block; moving closes them. TE counts uncut-critical internal nets on v's block; moving opens them. A 2/2 cut net is noncritical. Move gain is the exact cut reduction.":
      "FS đếm các net then chốt đang cắt mà v là cell đơn độc trên khối của nó; di chuyển sẽ đóng các net đó. TE đếm các net then chốt chưa cắt nằm nội bộ trên khối của v; di chuyển sẽ mở chúng. Net bị cắt 2/2 không then chốt. Gain của lần di chuyển là mức giảm kích thước cắt chính xác.",
    "The pass": "Một lượt",
    "Compute gains, then take the highest-gain eligible cell.":
      "Tính gain, sau đó chọn cell cơ sở hợp lệ có gain cao nhất.",
    "Move it and lock it for this pass.":
      "Di chuyển cell và cố định nó cho lượt này.",
    "Update only the gains of cells sharing a net with it.":
      "Chỉ cập nhật gain của các cell dùng chung net với nó.",
    "Record the prefix with the lowest cut.":
      "Ghi lại chuỗi di chuyển có kích thước cắt nhỏ nhất.",
    "Roll back to that prefix; stop if the cut did not improve.":
      "Hoàn tác về chuỗi đó; dừng nếu kích thước cắt không giảm.",
    "This run allows {min}–{max} cells per block (slack +{slack}). Moves that would leave the range are not eligible.":
      "Lượt chạy này cho phép {min}–{max} cell mỗi khối (độ dư +{slack}). Các lần di chuyển làm vượt khoảng này không hợp lệ.",
    "<code>Step</code> advances one swap or opens a pass. <code>Run pass</code> finishes the current pass. <code>Play</code> runs to convergence.":
      "<code>Bước</code> tiến một lần hoán đổi hoặc mở một lượt. <code>Chạy hết lượt</code> hoàn tất lượt hiện tại. <code>Phát</code> chạy đến khi hội tụ.",
    "<code>Step</code> advances one move or opens a pass. <code>Run pass</code> finishes the current pass. <code>Play</code> runs to convergence.":
      "<code>Bước</code> tiến một lần di chuyển hoặc mở một lượt. <code>Chạy hết lượt</code> hoàn tất lượt hiện tại. <code>Phát</code> chạy đến khi hội tụ.",

    /* ------------------------------------------------------------------ */
    /* Help dialog                                                         */
    /* ------------------------------------------------------------------ */
    "The method": "Phương pháp",
    "Close help": "Đóng trợ giúp",
    "FM and KL partitioning": "Phân vùng FM và KL",
    "Both heuristics split a netlist into two blocks while cutting as few nets as possible. FM moves one cell at a time; KL swaps one cell from each block.":
      "Cả hai thuật toán heuristic đều chia một netlist thành hai khối sao cho cắt ít net nhất. FM di chuyển từng cell; KL hoán đổi một cell từ mỗi khối.",
    "1 · Start balanced": "1 · Khởi đầu cân bằng",
    "Cells begin in two blocks. FM permits each block to grow to <code>ceil(n/2) + slack</code> cells, so a single-cell move can temporarily trade balance for a better cut. KL swaps preserve the starting block sizes.":
      "Các cell bắt đầu trong hai khối. FM cho phép mỗi khối tăng đến <code>ceil(n/2) + slack</code> cell, nên một lần di chuyển cell có thể tạm đánh đổi cân bằng để có kích thước cắt tốt hơn. Hoán đổi KL giữ nguyên kích thước khối ban đầu.",
    "2 · Critical nets": "2 · Net then chốt",
    "A net is <strong>critical</strong> when moving one of its cells can change whether the net is cut: <code>A=0</code>, <code>A=1</code>, <code>B=0</code>, or <code>B=1</code>. <em>Cut-critical</em> nets are cut with one cell on a side; moving that lone cell uncuts it (FS). <em>Uncut-critical</em> nets are internal; moving a cell cuts them (TE). A <code>2/2</code> cut net is not critical.":
      "Một net là <strong>then chốt</strong> khi di chuyển một trong các cell của nó có thể làm thay đổi trạng thái cắt: <code>A=0</code>, <code>A=1</code>, <code>B=0</code> hoặc <code>B=1</code>. <strong>Phân bố pin</strong> của net là cặp <code>(A(net), B(net))</code> — số pin nằm ở mỗi khối. Net <em>then chốt đang cắt</em> bị cắt với một cell ở một phía; di chuyển cell đơn độc đó sẽ làm net không còn bị cắt (FS). Net <em>then chốt chưa cắt</em> nằm nội bộ; di chuyển một cell sẽ làm net bị cắt (TE). Net bị cắt <code>2/2</code> không phải net then chốt.",
    "3 · FM: move the best cell": "3 · FM: chọn cell cơ sở",
    "For cell <em>v</em>, <code>gain(v) = FS(v) − TE(v)</code>. Choose the highest-gain eligible cell, move it across, and <strong>lock it for the rest of the pass</strong>. Locking lets FM climb out of local minima without immediately undoing a move.":
      "Với cell <em>v</em>, <code>gain(v) = FS(v) − TE(v)</code>. Chọn <strong>cell cơ sở</strong> — cell tự do có gain lớn nhất mà việc di chuyển vẫn thỏa tiêu chí cân bằng — rồi di chuyển sang khối kia và <strong>cố định nó cho đến hết lượt</strong>. Việc cố định cho phép FM vượt qua cực tiểu cục bộ mà không hoàn tác ngay.",
    "4 · KL: swap the best pair": "4 · KL: hoán đổi cặp tốt nhất",
    "For a free cell <em>v</em>, <code>D(v) = E<sub>other</sub>(v) − E<sub>same</sub>(v)</code>. Pick a free pair with the largest <code>g(a,b) = D(a) + D(b) − 2c(a,b)</code>, swap both cells, and <strong>lock both</strong>. On this hypergraph board, the pair gain is the exact net-cut change; for two-terminal nets it equals the slide formula.":
      "Với cell tự do <em>v</em>, <code>D(v) = E<sub>khác</sub>(v) − E<sub>cùng</sub>(v)</code>. Chọn cặp tự do có <code>g(a,b) = D(a) + D(b) − 2c(a,b)</code> lớn nhất, hoán đổi cả hai cell và <strong>cố định cả hai</strong>. Trên bảng siêu đồ thị này, gain của cặp là thay đổi kích thước cắt chính xác; với net hai đầu, nó trùng công thức trong slide.",
    "5 · Update and keep the best prefix": "5 · Cập nhật và giữ chuỗi tốt nhất",
    "Only cells incident to a changed net need updated scores. Record the prefix with the lowest cut. At pass end, roll back later moves/swaps, unlock every cell, and start another pass only if the cut improved. Stop when a pass has no improvement.":
      "Chỉ các cell liên quan đến net vừa thay đổi mới cần cập nhật điểm. Ghi lại chuỗi di chuyển/hoán đổi có kích thước cắt nhỏ nhất. Cuối lượt, hoàn tác các di chuyển/hoán đổi sau chuỗi đó, bỏ cố định mọi cell và chỉ bắt đầu lượt mới nếu kích thước cắt đã giảm. Dừng khi một lượt không cải thiện.",
    "6 · Read the board": "6 · Đọc bảng",
    "Coral lines cross the cut; muted lines stay inside a block. <strong>Every net name is visible.</strong> Amber names are critical (cut-critical or uncut-critical); steel-blue names are noncritical. Select a cell for its incident-net A/B counts and the exact reason; in the editor, click a net line to inspect it directly. The pulsing cell(s) show the next FM move or KL pair. Green and red badges show gain or <code>D(v)</code>.":
      "Đường màu đỏ san hô cắt qua đường phân vùng; đường mờ nằm trong một khối. <strong>Mọi tên net đều hiển thị.</strong> Tên màu hổ phách là net then chốt (đang cắt hoặc chưa cắt); tên xanh thép là net không then chốt. Chọn một cell để xem phân bố pin A/B của các net liên quan và lý do chính xác; trong trình sửa, nhấp vào đường net để xem trực tiếp. Cell nhấp nháy cho biết lần di chuyển FM hoặc cặp KL tiếp theo. Huy hiệu xanh/đỏ hiển thị gain hoặc <code>D(v)</code>.",
    "7 · Switch algorithms": "7 · Chuyển thuật toán",
    "Use the <strong>KL</strong> / <strong>FM</strong> switch in Run control. FM is the move-based hypergraph solver; KL is the pair-swap graph algorithm applied to the same nets. The cut readout is the same unit-cost net cut for both, and the graph, editor, balance strip, and critical-net inspector are shared.":
      "Dùng nút chuyển <strong>KL</strong> / <strong>FM</strong> trong Điều khiển. FM là thuật toán di chuyển cell trên siêu đồ thị; KL là thuật toán hoán đổi cặp trên đồ thị, áp dụng cho cùng các net. Kích thước cắt đọc được là cùng một đại lượng trọng số đơn vị cho cả hai; đồ thị, trình sửa, dải cân bằng và phần xem net then chốt dùng chung.",
    "8 · Edit the graph": "8 · Sửa đồ thị",
    "<strong>Edit graph</strong> turns the board into an editor. Drag cells to arrange or move them across the cut, double-click to rename, click <em>Add cell</em> then the board to create one, and use <em>Connect</em> to build nets. Pick two or more cells, then press <kbd>Enter</kbd> or click <em>Create net</em>. Connect stays active so you can build the next net; press <kbd>Esc</kbd> when finished. Select a net line to inspect or delete it. <em>Clear</em> wipes the board for a fresh start; <em>Undo</em> restores it.":
      "<strong>Sửa đồ thị</strong> chuyển bảng thành trình sửa. Kéo cell để sắp xếp hoặc chuyển qua đường cắt, nhấp đúp để đổi tên, chọn <em>Thêm cell</em> rồi nhấp lên bảng để tạo cell, và dùng <em>Nối net</em> để tạo net. Chọn từ hai cell trở lên, sau đó nhấn <kbd>Enter</kbd> hoặc chọn <em>Tạo net</em>. Chế độ Nối net vẫn hoạt động để tạo net tiếp theo; nhấn <kbd>Esc</kbd> khi xong. Chọn một đường net để xem hoặc xóa. <em>Xóa hết</em> làm trống bảng; <em>Hoàn tác</em> khôi phục.",
    "Step = one FM move / KL swap (or one pass boundary). Run pass = finish this pass. Play = run to convergence.":
      "Bước = một lần di chuyển FM / hoán đổi KL (hoặc một ranh giới lượt). Chạy hết lượt = hoàn tất lượt hiện tại. Phát = chạy đến khi hội tụ.",
    "Got it": "Đã hiểu",

    /* ------------------------------------------------------------------ */
    /* Data dialog                                                         */
    /* ------------------------------------------------------------------ */
    "Graph input": "Dữ liệu đồ thị",
    "Close graph data": "Đóng dữ liệu đồ thị",
    "Hypergraph JSON": "JSON siêu đồ thị",
    "JSON is optional — use <strong>Edit graph</strong> for direct editing. You can still paste a graph here. Cells need unique IDs; each net is a list of two or more cell IDs. You can also supply <code>edges</code> as two-item arrays or <code>{ source, target }</code> objects; edge weights must be 1. An <code>initialPartition</code> is optional.":
      "JSON là tùy chọn — dùng <strong>Sửa đồ thị</strong> để chỉnh trực tiếp. Bạn vẫn có thể dán đồ thị ở đây. Cell cần ID duy nhất; mỗi net là danh sách từ hai ID cell trở lên. Bạn cũng có thể cung cấp <code>edges</code> dưới dạng mảng hai phần tử hoặc đối tượng <code>{ source, target }</code>; trọng số cạnh phải bằng 1. <code>initialPartition</code> là tùy chọn.",
    "Two blocks are formed automatically. Larger graphs are supported, but the board is tuned for up to about 18 cells.":
      "Hai khối được tạo tự động. Đồ thị lớn hơn vẫn được hỗ trợ, nhưng bảng được tối ưu cho khoảng 18 cell trở xuống.",
    "Copy current": "Sao chép hiện tại",
    "Apply graph": "Áp dụng đồ thị",

    /* Additional labels and screen-reader copy. */
    "Add a cell (N)": "Thêm cell (N)",
    "Connect cells into a net (C)": "Nối các cell thành net (C)",
    "Delete selected cell or net": "Xóa cell hoặc net đang chọn",
    "Select and move cells (V)": "Chọn và di chuyển cell (V)",
    "Remove every cell and net, then start fresh":
      "Xóa mọi cell và net, sau đó bắt đầu lại",
    "Undo graph edit (⌘Z)": "Hoàn tác chỉnh sửa đồ thị (⌘Z)",
    "Solver controls": "Điều khiển thuật toán",
    "Solver metrics": "Chỉ số thuật toán",
    "Internal net; no single-cell move changes its cut status.":
      "Net nội bộ; không có lần di chuyển một cell nào làm thay đổi trạng thái cắt.",
    "cut-critical in both blocks": "then chốt đang cắt ở cả hai khối",
    "cut-critical in Block {block}": "then chốt đang cắt ở Khối {block}",
    "uncut-critical in Block {block}": "then chốt chưa cắt ở Khối {block}",
    "{cells} in Block {block}": "{cells} ở Khối {block}",
    "Graph editor with {cells} cells and {nets} nets. Drag cells, add or connect cells, or rename a cell.":
      "Trình sửa đồ thị với {cells} cell và {nets} net. Kéo cell, thêm hoặc nối cell, hoặc đổi tên cell.",
    "Partition with {a} cells in block A and {b} in block B. {cut} nets cross the cut. {critical} nets are critical: {cutCritical} cut-critical and {uncutCritical} uncut-critical. Critical net names are amber; other net names are steel blue.":
      "Phân vùng với {a} cell ở khối A và {b} ở khối B. {cut} net cắt qua đường phân vùng. {critical} net then chốt: {cutCritical} đang cắt và {uncutCritical} chưa cắt. Tên net then chốt màu hổ phách; tên net khác màu xanh thép."
  };

  let language = DEFAULT_LANGUAGE;

  function isLanguage(value) {
    return value === "vi" || value === "en";
  }

  function readLanguage() {
    if (typeof window !== "undefined" && window.location) {
      try {
        const requested = new URLSearchParams(window.location.search).get("lang");
        if (isLanguage(requested)) return requested;
      } catch (error) {
        // Ignore malformed locations; use the stored/default choice.
      }
    }
    try {
      if (typeof window !== "undefined" && typeof localStorage !== "undefined") {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (isLanguage(stored)) return stored;
      }
    } catch (error) {
      // file:// origins and privacy modes can deny storage.
    }
    return DEFAULT_LANGUAGE;
  }

  language = readLanguage();

  function t(key, variables) {
    const source = String(key ?? "");
    const template = language === "vi" ? VI[source] ?? source : source;
    if (!variables) return template;
    return template.replace(/\{(\w+)\}/g, (match, name) =>
      Object.prototype.hasOwnProperty.call(variables, name)
        ? String(variables[name])
        : match,
    );
  }

  function setLanguage(next) {
    if (!isLanguage(next)) return language;
    language = next;
    try {
      if (typeof window !== "undefined" && typeof localStorage !== "undefined") {
        localStorage.setItem(STORAGE_KEY, language);
      }
    } catch (error) {
      // Persisting is best-effort.
    }
    if (typeof document !== "undefined") applyTranslations();
    return language;
  }

  function getLanguage() {
    return language;
  }

  function applyTranslations(root) {
    if (typeof document === "undefined") return;
    const scope = root || document;
    scope.querySelectorAll("[data-i18n]").forEach((element) => {
      element.textContent = t(element.dataset.i18n);
    });
    scope.querySelectorAll("[data-i18n-html]").forEach((element) => {
      element.innerHTML = t(element.dataset.i18nHtml);
    });
    scope.querySelectorAll("[data-i18n-title]").forEach((element) => {
      element.title = t(element.dataset.i18nTitle);
    });
    scope.querySelectorAll("[data-i18n-aria-label]").forEach((element) => {
      element.setAttribute("aria-label", t(element.dataset.i18nAriaLabel));
    });
    if (document.documentElement) document.documentElement.lang = language;
    document.title = t("Partition Lab · FM + KL");
  }

  return {
    DEFAULT_LANGUAGE,
    STORAGE_KEY,
    VI,
    t,
    setLanguage,
    getLanguage,
    applyTranslations,
  };
});
