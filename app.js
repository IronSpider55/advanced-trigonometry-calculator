
"use strict";

/* ==========================================================
   ADVANCED TRIGONOMETRY CALCULATOR
   Complete browser-based starter implementation.
   No external libraries required.
   ========================================================== */

const $ = (id) => document.getElementById(id);
const EPS = 1e-9;
const DEG = Math.PI / 180;

function fmt(n) {
  if (!Number.isFinite(n)) return String(n);
  if (Math.abs(n) < EPS) return "0";
  return Number(n.toPrecision(12)).toString();
}

function close(a, b, tol = EPS) {
  return Math.abs(a - b) <= tol;
}

/* ==========================================================
   SAFE NUMERIC EXPRESSION PARSER
   Examples: sin(30)^2, 2*sin(30), (1-cos(60))/2
   Trigonometric inputs use degrees in the calculator.
   ========================================================== */

function tokenize(source) {
  const tokens = [];
  const s = source.replace(/\s+/g, "");
  let i = 0;

  while (i < s.length) {
    const rest = s.slice(i);
    let m = rest.match(/^(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?/i);

    if (m) {
      tokens.push({ type: "number", value: Number(m[0]) });
      i += m[0].length;
      continue;
    }

    m = rest.match(/^[a-zA-Z]+/);

    if (m) {
      tokens.push({ type: "name", value: m[0].toLowerCase() });
      i += m[0].length;
      continue;
    }

    if ("+-*/^%()".includes(s[i])) {
      tokens.push({ type: s[i], value: s[i] });
      i++;
      continue;
    }

    throw new Error("Unsupported character: " + s[i]);
  }

  return tokens;
}

function evaluateExpression(source, angleMode = "degrees") {
  const tokens = tokenize(source);
  let pos = 0;

  if (!tokens.length) throw new Error("Enter an expression.");

  const trig = new Set(["sin", "cos", "tan", "sec", "csc", "cot"]);

  function peek() {
    return tokens[pos];
  }

  function take(type) {
    if (!peek() || peek().type !== type) {
      throw new Error("Expected " + type + ".");
    }
    return tokens[pos++];
  }

  function primary() {
    const t = peek();

    if (!t) throw new Error("Unexpected end of expression.");

    if (t.type === "+") {
      pos++;
      return primary();
    }

    if (t.type === "-") {
      pos++;
      return -primary();
    }

    if (t.type === "number") {
      pos++;
      return t.value;
    }

    if (t.type === "(") {
      pos++;
      const value = expression();
      take(")");
      return value;
    }

    if (t.type === "name") {
      pos++;
      const name = t.value;

      if (name === "pi") return Math.PI;
      if (name === "e") return Math.E;

      if (!peek() || peek().type !== "(") {
        throw new Error("Unknown name: " + name);
      }

      pos++;
      const arg = expression();
      take(")");

      let x = arg;

      if (angleMode === "degrees" && trig.has(name)) {
        x *= DEG;
      }

      let result;

      switch (name) {
        case "sin": result = Math.sin(x); break;
        case "cos": result = Math.cos(x); break;

        case "tan":
          if (Math.abs(Math.cos(x)) < EPS) {
            throw new Error("tan is undefined at this angle.");
          }
          result = Math.tan(x);
          break;

        case "sec":
          if (Math.abs(Math.cos(x)) < EPS) {
            throw new Error("sec is undefined at this angle.");
          }
          result = 1 / Math.cos(x);
          break;

        case "csc":
          if (Math.abs(Math.sin(x)) < EPS) {
            throw new Error("csc is undefined at this angle.");
          }
          result = 1 / Math.sin(x);
          break;

        case "cot":
          if (Math.abs(Math.sin(x)) < EPS) {
            throw new Error("cot is undefined at this angle.");
          }
          result = Math.cos(x) / Math.sin(x);
          break;

        case "asin":
          if (arg < -1 || arg > 1) {
            throw new Error("asin requires a value between -1 and 1.");
          }
          result = Math.asin(arg);
          break;

        case "acos":
          if (arg < -1 || arg > 1) {
            throw new Error("acos requires a value between -1 and 1.");
          }
          result = Math.acos(arg);
          break;

        case "atan": result = Math.atan(arg); break;

        case "sqrt":
          if (arg < 0) throw new Error("sqrt requires a non-negative value.");
          result = Math.sqrt(arg);
          break;

        case "abs": result = Math.abs(arg); break;

        case "ln":
          if (arg <= 0) throw new Error("ln requires a positive value.");
          result = Math.log(arg);
          break;

        case "log":
          if (arg <= 0) throw new Error("log requires a positive value.");
          result = Math.log10(arg);
          break;

        case "exp": result = Math.exp(arg); break;

        default:
          throw new Error("Unsupported function: " + name);
      }

      return result;
    }

    throw new Error("Unexpected token: " + t.value);
  }

  function power() {
    let value = primary();

    if (peek() && peek().type === "^") {
      pos++;
      value = Math.pow(value, unary());
    }

    return value;
  }

  function unary() {
    return power();
  }

  function term() {
    let value = unary();

    while (peek()) {
      const op = peek().type;

      if (op === "*") {
        pos++;
        value *= unary();
      } else if (op === "/") {
        pos++;
        const divisor = unary();

        if (Math.abs(divisor) < Number.EPSILON) {
          throw new Error("Division by zero.");
        }

        value /= divisor;
      } else if (op === "%") {
        pos++;
        const divisor = unary();

        if (divisor === 0) throw new Error("Division by zero.");
        value %= divisor;
      } else {
        break;
      }
    }

    return value;
  }

  function expression() {
    let value = term();

    while (peek() && ["+", "-"].includes(peek().type)) {
      const op = tokens[pos++].type;
      const right = term();
      value = op === "+" ? value + right : value - right;
    }

    return value;
  }

  const answer = expression();

  if (pos !== tokens.length) {
    throw new Error("Unexpected token: " + tokens[pos].value);
  }

  if (!Number.isFinite(answer)) {
    throw new Error("The result is not a finite real number.");
  }

  return answer;
}

/* ==========================================================
   NAVIGATION
   ========================================================== */

document.querySelectorAll(".tab").forEach((button) => {
  button.addEventListener("click", () => {
    const target = button.dataset.tab;

    document.querySelectorAll(".tab").forEach((tab) => {
      tab.classList.toggle("active", tab === button);
    });

    document.querySelectorAll(".tab-content").forEach((section) => {
      const active = section.id === target;
      section.hidden = !active;
      section.classList.toggle("active", active);
    });
  });
});

/* ==========================================================
   NUMERIC CALCULATOR
   ========================================================== */

$("calculateBtn").addEventListener("click", () => {
  try {
    const result = evaluateExpression($("calcInput").value, "degrees");
    $("calcOutput").textContent = "Result: " + fmt(result);
  } catch (error) {
    $("calcOutput").textContent = "Error: " + error.message;
  }
});

$("clearCalcBtn").addEventListener("click", () => {
  $("calcInput").value = "";
  $("calcOutput").textContent = "Enter an expression to calculate.";
});

$("calcInput").addEventListener("keydown", (event) => {
  if (event.key === "Enter") $("calculateBtn").click();
});

document.querySelectorAll("[data-expression]").forEach((button) => {
  button.addEventListener("click", () => {
    $("lhsInput").value = button.dataset.expression;
    $("rhsInput").value = "";
    document.querySelector('[data-tab="prover"]').click();
  });
});

/* ==========================================================
   FORMULA LIBRARY
   ========================================================== */

const FORMULAS = [
  ["Reciprocal", "Sine and cosecant",
    "csc(x) = 1/sin(x)", "sin(x) != 0"],
  ["Reciprocal", "Cosine and secant",
    "sec(x) = 1/cos(x)", "cos(x) != 0"],
  ["Quotient", "Tangent quotient",
    "tan(x) = sin(x)/cos(x)", "cos(x) != 0"],
  ["Quotient", "Cotangent quotient",
    "cot(x) = cos(x)/sin(x)", "sin(x) != 0"],
  ["Pythagorean", "Fundamental identity",
    "sin(x)^2 + cos(x)^2 = 1", "All real x"],
  ["Pythagorean", "Tangent identity",
    "1 + tan(x)^2 = sec(x)^2", "cos(x) != 0"],
  ["Pythagorean", "Cotangent identity",
    "1 + cot(x)^2 = csc(x)^2", "sin(x) != 0"],
  ["Even/odd", "Odd sine",
    "sin(-x) = -sin(x)", "All real x"],
  ["Even/odd", "Even cosine",
    "cos(-x) = cos(x)", "All real x"],
  ["Cofunction", "Complementary angles",
    "sin(pi/2 - x) = cos(x)", "Angles in radians"],
  ["Addition", "Sine addition",
    "sin(x+y) = sin(x)cos(y) + cos(x)sin(y)", "All real x,y"],
  ["Addition", "Cosine addition",
    "cos(x+y) = cos(x)cos(y) - sin(x)sin(y)", "All real x,y"],
  ["Double angle", "Sine double angle",
    "sin(2x) = 2sin(x)cos(x)", "All real x"],
  ["Double angle", "Cosine double angle",
    "cos(2x) = 1 - 2sin(x)^2", "All real x"],
  ["Double angle", "Alternate cosine double angle",
    "cos(2x) = 2cos(x)^2 - 1", "All real x"],
  ["Half angle", "Half-angle sine",
    "sin(x/2)^2 = (1-cos(x))/2", "All real x"],
  ["Half angle", "Half-angle cosine",
    "cos(x/2)^2 = (1+cos(x))/2", "All real x"],
  ["Triple angle", "Triple-angle sine",
    "sin(3x) = 3sin(x) - 4sin(x)^3", "All real x"],
  ["Triple angle", "Triple-angle cosine",
    "cos(3x) = 4cos(x)^3 - 3cos(x)", "All real x"],
  ["Product-sum", "Sine times cosine",
    "sin(x)cos(y) = [sin(x+y)+sin(x-y)]/2", "All real x,y"],
  ["Sum-product", "Sine sum",
    "sin(x)+sin(y) = 2sin((x+y)/2)cos((x-y)/2)", "All real x,y"]
];

let selectedFormula = null;

function renderFormulas() {
  const category = $("formulaCategory").value;
  const list = $("formulaList");
  list.replaceChildren();
  selectedFormula = null;
  $("formulaDetails").textContent = "Select a formula to see its details.";

  FORMULAS.filter((f) => category === "All" || f[0] === category)
    .forEach((formula) => {
      const button = document.createElement("button");
      button.textContent = formula[0] + ": " + formula[1];

      button.addEventListener("click", () => {
        selectedFormula = formula;

        list.querySelectorAll("button").forEach((b) => {
          b.classList.toggle("selected", b === button);
        });

        $("formulaDetails").textContent =
          formula[1] + "\n\nIdentity: " + formula[2] +
          "\nCondition: " + formula[3];
      });

      list.appendChild(button);
    });
}

$("formulaCategory").addEventListener("change", renderFormulas);

$("formulaToCalcBtn").addEventListener("click", () => {
  if (!selectedFormula) {
    $("formulaDetails").textContent = "Select a formula first.";
    return;
  }

  $("lhsInput").value = selectedFormula[2].split(" = ")[0];
  $("rhsInput").value = selectedFormula[2].split(" = ")[1] || "";
  document.querySelector('[data-tab="prover"]').click();
});

renderFormulas();

/* ==========================================================
   PROOF LIBRARY
   These are worked derivations of selected identities.
   ========================================================== */

const PROOF_EXAMPLES = {
  pythagorean: {
    identity: "sin²(x) + cos²(x) = 1",
    steps: [
      "1. Start with the unit-circle identity.",
      "   For a point on the unit circle, coordinates are (cos(x), sin(x)).",
      "2. The unit-circle equation is X² + Y² = 1.",
      "3. Substitute X = cos(x) and Y = sin(x).",
      "   cos²(x) + sin²(x) = 1.",
      "4. Reorder the terms.",
      "   sin²(x) + cos²(x) = 1.",
      "Hence Proved."
    ]
  },

  "double-sine": {
    identity: "sin(2x) = 2sin(x)cos(x)",
    steps: [
      "1. Use the sine addition identity:",
      "   sin(A + B) = sin(A)cos(B) + cos(A)sin(B).",
      "2. Set A = x and B = x.",
      "   sin(x + x) = sin(x)cos(x) + cos(x)sin(x).",
      "3. Combine the two equal terms.",
      "   sin(2x) = 2sin(x)cos(x).",
      "Hence Proved."
    ]
  },

  "double-cosine": {
    identity: "cos(2x) = 1 - 2sin²(x)",
    steps: [
      "1. Use the cosine addition identity:",
      "   cos(A + B) = cos(A)cos(B) - sin(A)sin(B).",
      "2. Set A = B = x.",
      "   cos(2x) = cos²(x) - sin²(x).",
      "3. Use cos²(x) = 1 - sin²(x).",
      "4. Substitute and simplify.",
      "   cos(2x) = 1 - sin²(x) - sin²(x).",
      "   cos(2x) = 1 - 2sin²(x).",
      "Hence Proved."
    ]
  },

  "triple-sine": {
    identity: "sin(3x) = 3sin(x) - 4sin³(x)",
    steps: [
      "1. Write 3x as 2x + x.",
      "2. Apply the sine addition identity.",
      "   sin(3x) = sin(2x)cos(x) + cos(2x)sin(x).",
      "3. Substitute sin(2x) = 2sin(x)cos(x).",
      "   and cos(2x) = cos²(x) - sin²(x).",
      "4. Expand and combine terms.",
      "   sin(3x) = 3sin(x)cos²(x) - sin³(x).",
      "5. Use cos²(x) = 1 - sin²(x).",
      "   sin(3x) = 3sin(x) - 4sin³(x).",
      "Hence Proved."
    ]
  },

  "addition-sine": {
    identity: "sin(x+y) = sin(x)cos(y) + cos(x)sin(y)",
    steps: [
      "1. Consider a rotation by angle y on the unit circle.",
      "2. The sine addition rule follows from the rotated coordinates.",
      "3. The vertical coordinate after rotation is",
      "   sin(x)cos(y) + cos(x)sin(y).",
      "4. The same coordinate is sin(x+y).",
      "Therefore, sin(x+y) = sin(x)cos(y) + cos(x)sin(y).",
      "Hence Proved."
    ]
  },

  "quotient-tangent": {
    identity: "tan(x) = sin(x)/cos(x)",
    steps: [
      "1. In a right triangle, tan(x) = opposite/adjacent.",
      "2. Divide numerator and denominator by the hypotenuse.",
      "3. tan(x) = (opposite/hypotenuse)/(adjacent/hypotenuse).",
      "4. Use sin(x) = opposite/hypotenuse.",
      "   and cos(x) = adjacent/hypotenuse.",
      "5. Therefore tan(x) = sin(x)/cos(x), where cos(x) != 0.",
      "Hence Proved."
    ]
  }
};

$("runProofExampleBtn").addEventListener("click", () => {
  const key = $("proofExample").value;
  const proof = PROOF_EXAMPLES[key];

  if (!proof) {
    $("proofLibraryOutput").textContent = "Proof not available.";
    return;
  }

  $("proofLibraryOutput").textContent =
    "IDENTITY: " + proof.identity + "\n\n" + proof.steps.join("\n");
});

/* ==========================================================
   IDENTITY CHECKER
   Recognizes selected identities only.
   Unsupported identities are NOT declared false or proved.
   ========================================================== */

function normalizeIdentitySide(s) {
  return s.toLowerCase().replace(/\s+/g, "").replace(/π/g, "pi");
}

const KNOWN_IDENTITIES = [
  ["sin(2*x)", "2*sin(x)*cos(x)"],
  ["cos(2*x)", "cos(x)^2-sin(x)^2"],
  ["cos(2*x)", "1-2*sin(x)^2"],
  ["cos(2*x)", "2*cos(x)^2-1"],
  ["sin(3*x)", "3*sin(x)-4*sin(x)^3"],
  ["cos(3*x)", "4*cos(x)^3-3*cos(x)"],
  ["sin(-x)", "-sin(x)"],
  ["cos(-x)", "cos(x)"],
  ["tan(x)", "sin(x)/cos(x)"],
  ["cot(x)", "cos(x)/sin(x)"],
  ["sin(x)^2+cos(x)^2", "1"],
  ["1+tan(x)^2", "sec(x)^2"],
  ["1+cot(x)^2", "csc(x)^2"],
  ["sin(pi/2-x)", "cos(x)"],
  ["sin(x/2)^2", "(1-cos(x))/2"],
  ["cos(x/2)^2", "(1+cos(x))/2"]
];

function matchKnownIdentity(lhs, rhs) {
  const a = normalizeIdentitySide(lhs);
  const b = normalizeIdentitySide(rhs);

  return KNOWN_IDENTITIES.some(([left, right]) => {
    const l = normalizeIdentitySide(left);
    const r = normalizeIdentitySide(right);
    return (a === l && b === r) || (a === r && b === l);
  });
}

$("proveBtn").addEventListener("click", () => {
  const lhs = $("lhsInput").value.trim();
  const rhs = $("rhsInput").value.trim();

  if (!lhs || !rhs) {
    $("identityOutput").textContent =
      "Enter both the left-hand side and the right-hand side.";
    return;
  }

  if (matchKnownIdentity(lhs, rhs)) {
    $("identityOutput").textContent =
      "IDENTITY RECOGNIZED\n\n" +
      "This matches a supported standard identity.\n" +
      "See the Proof Library for a worked derivation where available.\n\n" +
      "Note: matching a known formula is not a general symbolic proof.";
    return;
  }

  $("identityOutput").textContent =
    "NOT PROVED AUTOMATICALLY\n\n" +
    "This starter engine does not recognize this exact identity.\n" +
    "That does not mean the identity is false.\n" +
    "No general symbolic proof has been completed.";
});

$("loadExampleBtn").addEventListener("click", () => {
  $("lhsInput").value = "sin(2*x)";
  $("rhsInput").value = "2*sin(x)*cos(x)";
  $("identityOutput").textContent = "Example loaded. Click Test Identity.";
});

/* ==========================================================
   EQUATION SOLVER
   Solves sin(x)=k, cos(x)=k and tan(x)=k on a finite interval.
   ========================================================== */

function solveEquation(fn, k, start, end, mode) {
  if (![k, start, end].every(Number.isFinite)) {
    throw new Error("Enter valid numeric values.");
  }

  if (end <= start) {
    throw new Error("Interval end must be greater than interval start.");
  }

  if (end - start > 1000000) {
    throw new Error("Please use a smaller interval.");
  }

  if (fn !== "tan" && (k < -1 || k > 1)) {
    return [];
  }

  const toRad = (v) => mode === "degrees" ? v * DEG : v;
  const fromRad = (v) => mode === "degrees" ? v / DEG : v;

  const low = toRad(start);
  const high = toRad(end);
  const solutions = [];

  function addPeriodic(base, period) {
    const first = Math.ceil((low - base - EPS) / period);
    const last = Math.floor((high - base + EPS) / period);

    for (let n = first; n <= last; n++) {
      const x = base + n * period;
      if (x >= low - EPS && x <= high + EPS) {
        solutions.push(fromRad(x));
      }
    }
  }

  if (fn === "sin") {
    const a = Math.asin(k);
    addPeriodic(a, 2 * Math.PI);
    addPeriodic(Math.PI - a, 2 * Math.PI);
  } else if (fn === "cos") {
    const a = Math.acos(k);
    addPeriodic(a, 2 * Math.PI);
    addPeriodic(-a, 2 * Math.PI);
  } else {
    const a = Math.atan(k);
    addPeriodic(a, Math.PI);
  }

  solutions.sort((a, b) => a - b);

  const unique = [];
  for (const x of solutions) {
    if (!unique.some((v) => close(v, x, 1e-7))) unique.push(x);
  }

  return unique;
}

$("solveEquationBtn").addEventListener("click", () => {
  try {
    const fn = $("eqFunction").value;
    const k = Number($("eqValue").value);
    const start = Number($("eqStart").value);
    const end = Number($("eqEnd").value);
    const mode = $("eqAngleMode").value;

    const solutions = solveEquation(fn, k, start, end, mode);

    if (!solutions.length) {
      $("equationOutput").textContent =
        "No solutions found in the selected interval.";
      return;
    }

    $("equationOutput").textContent =
      fn + "(x) = " + fmt(k) + "\n\nSolutions (" + mode + "):\n" +
      solutions.map((x) => "x = " + fmt(x)).join("\n");
  } catch (error) {
    $("equationOutput").textContent = "Error: " + error.message;
  }
});

/* ==========================================================
   CONNECTION STATUS
   ========================================================== */

function updateConnectionStatus() {
  const status = $("connectionStatus");
  if (!status) return;

  status.textContent = navigator.onLine ? "Online" : "Offline mode";
}

window.addEventListener("online", updateConnectionStatus);
window.addEventListener("offline", updateConnectionStatus);
updateConnectionStatus();

/* ==========================================================
   PWA INSTALL BUTTON
   Manifest and service worker will be added in later steps.
   ========================================================== */

let installPrompt = null;
const installButton = $("installButton");

window.addEventListener("beforeinstallprompt", (event) => {
  event.preventDefault();
  installPrompt = event;
  installButton.hidden = false;
});

if (installButton) {
  installButton.addEventListener("click", async () => {
    if (!installPrompt) {
      alert("If installation is supported, use your browser menu to install this app.");
      return;
    }

    installPrompt.prompt();
    await installPrompt.userChoice;
    installPrompt = null;
    installButton.hidden = true;
  });
}

if ("serviceWorker" in navigator && location.protocol !== "file:") {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js").catch((error) => {
      console.warn("Offline worker is not ready yet:", error.message);
    });
  });
}
