
"use strict";

/* =========================================================
   ADVANCED TRIGONOMETRY CALCULATOR
   Offline-friendly starter implementation
   No external libraries and no eval()
   ========================================================= */

const $ = (id) => document.getElementById(id);
const EPS = 1e-9;
const DEG = Math.PI / 180;

function fmt(n) {
  if (!Number.isFinite(n)) return String(n);
  if (Math.abs(n) < EPS) return "0";
  return Number(n.toPrecision(12)).toString();
}

function close(a, b, eps = EPS) {
  return Math.abs(a - b) <= eps;
}

function out(id, message) {
  $(id).textContent = message;
}

function rad(angle, mode) {
  return mode === "degrees" ? angle * DEG : angle;
}

/* =========================================================
   SAFE NUMERIC EXPRESSION PARSER
   Examples: sin(30), 2*sin(45), (1-cos(60))/2
   Trigonometric functions accept degrees in calculator mode.
   ========================================================= */

const FN = {
  sin: Math.sin,
  cos: Math.cos,
  tan: Math.tan,
  asin: Math.asin,
  acos: Math.acos,
  atan: Math.atan,
  sqrt: Math.sqrt,
  abs: Math.abs,
  ln: Math.log,
  log: Math.log10,
  exp: Math.exp
};

function tokenize(source) {
  const tokens = [];
  const s = source.replace(/\s+/g, "");
  let i = 0;

  while (i < s.length) {
    const rest = s.slice(i);
    const num = rest.match(/^(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?/i);
    const name = rest.match(/^[a-zA-Z]+/);
    const ch = s[i];

    if (num) {
      tokens.push({ type: "num", value: Number(num[0]) });
      i += num[0].length;
    } else if (name) {
      tokens.push({ type: "name", value: name[0].toLowerCase() });
      i += name[0].length;
    } else if ("+-*/^%()".includes(ch)) {
      tokens.push({ type: ch, value: ch });
      i++;
    } else {
      throw new Error("Unsupported character: " + ch);
    }
  }

  return tokens;
}

function evaluateExpression(source, mode = "degrees") {
  const tokens = tokenize(source);
  let p = 0;

  function peek() {
    return tokens[p];
  }

  function expect(type) {
    if (!peek() || peek().type !== type) {
      throw new Error("Expected '" + type + "'.");
    }
    return tokens[p++];
  }

  function primary() {
    const t = peek();
    if (!t) throw new Error("Expression ended unexpectedly.");

    if (t.type === "+") {
      p++;
      return primary();
    }

    if (t.type === "-") {
      p++;
      return -primary();
    }

    if (t.type === "num") {
      p++;
      return t.value;
    }

    if (t.type === "(") {
      p++;
      const v = expression();
      expect(")");
      return v;
    }

    if (t.type === "name") {
      p++;
      const name = t.value;

      if (name === "pi") return Math.PI;
      if (name === "e") return Math.E;

      if (peek() && peek().type === "(") {
        if (!Object.prototype.hasOwnProperty.call(FN, name)) {
          throw new Error("Unknown function: " + name);
        }

        p++;
        const arg = expression();
        expect(")");

        let x = arg;
        if (["sin", "cos", "tan"].includes(name) &&
            mode === "degrees") {
          x = rad(x, mode);
        }

        if (["asin", "acos", "atan"].includes(name)) {
          const answer = FN[name](x);
          return mode === "degrees" ? answer / DEG : answer;
        }

        if (name === "sqrt" && x < 0) {
          throw new Error("Square root requires a non-negative value.");
        }

        if ((name === "ln" || name === "log") && x <= 0) {
          throw new Error("Logarithm requires a positive value.");
        }

        return FN[name](x);
      }

      throw new Error("Unknown name: " + name);
    }

    throw new Error("Unexpected token: " + t.value);
  }

  function power() {
    const base = primary();
    if (peek() && peek().type === "^") {
      p++;
      return Math.pow(base, unary());
    }
    return base;
  }

  function unary() {
    return power();
  }

  function term() {
    let v = unary();

    while (peek()) {
      if (peek().type === "*") {
        p++;
        v *= unary();
      } else if (peek().type === "/") {
        p++;
        const d = unary();
        if (Math.abs(d) < Number.EPSILON) {
          throw new Error("Division by zero.");
        }
        v /= d;
      } else if (peek().type === "%") {
        p++;
        v %= unary();
      } else {
        break;
      }
    }
    return v;
  }

  function expression() {
    let v = term();

    while (peek() && ["+", "-"].includes(peek().type)) {
      const op = tokens[p++].type;
      const r = term();
      v = op === "+" ? v + r : v - r;
    }
    return v;
  }

  if (!tokens.length) throw new Error("Enter an expression.");

  const result = expression();

  if (p !== tokens.length) {
    throw new Error("Unexpected token: " + tokens[p].value);
  }

  if (!Number.isFinite(result)) {
    throw new Error("The result is not a finite real number.");
  }

  return result;
}

/* =========================================================
   TABS
   ========================================================= */

document.querySelectorAll(".tab").forEach((button) => {
  button.addEventListener("click", () => {
    const target = button.dataset.tab;

    document.querySelectorAll(".tab").forEach((b) => {
      b.classList.toggle("active", b === button);
    });

    document.querySelectorAll(".tab-content").forEach((section) => {
      const active = section.id === target;
      section.hidden = !active;
      section.classList.toggle("active", active);
    });
  });
});

/* =========================================================
   CALCULATOR
   ========================================================= */

$("calculateBtn").addEventListener("click", () => {
  try {
    const result = evaluateExpression($("calcInput").value, "degrees");
    out("calcOutput", "RESULT\n" + fmt(result));
  } catch (e) {
    out("calcOutput", "ERROR\n" + e.message);
  }
});

$("clearCalcBtn").addEventListener("click", () => {
  $("calcInput").value = "";
  out("calcOutput", "Enter an expression to calculate.");
});

$("calcInput").addEventListener("keydown", (e) => {
  if (e.key === "Enter") $("calculateBtn").click();
});

document.querySelectorAll("[data-expression]").forEach((button) => {
  button.addEventListener("click", () => {
    $("calcInput").value = button.dataset.expression;
    document.querySelector('[data-tab="calculator"]').click();
  });
});

/* =========================================================
   FORMULA LIBRARY
   ========================================================= */

const FORMULAS = [
  ["Reciprocal", "Cosecant", "csc(x) = 1/sin(x)", "sin(x) != 0"],
  ["Reciprocal", "Secant", "sec(x) = 1/cos(x)", "cos(x) != 0"],
  ["Quotient", "Tangent", "tan(x) = sin(x)/cos(x)", "cos(x) != 0"],
  ["Quotient", "Cotangent", "cot(x) = cos(x)/sin(x)", "sin(x) != 0"],
  ["Pythagorean", "Fundamental", "sin(x)^2 + cos(x)^2 = 1", "All real x"],
  ["Pythagorean", "Tangent identity", "1 + tan(x)^2 = sec(x)^2", "cos(x) != 0"],
  ["Pythagorean", "Cotangent identity", "1 + cot(x)^2 = csc(x)^2", "sin(x) != 0"],
  ["Even/odd", "Odd sine", "sin(-x) = -sin(x)", "All real x"],
  ["Even/odd", "Even cosine", "cos(-x) = cos(x)", "All real x"],
  ["Cofunction", "Complementary angles", "sin(pi/2-x) = cos(x)", "Radians"],
  ["Addition", "Sine addition", "sin(x+y) = sin(x)cos(y)+cos(x)sin(y)", "All real x,y"],
  ["Addition", "Cosine addition", "cos(x+y) = cos(x)cos(y)-sin(x)sin(y)", "All real x,y"],
  ["Double angle", "Sine double angle", "sin(2*x) = 2*sin(x)*cos(x)", "All real x"],
  ["Double angle", "Cosine double angle", "cos(2*x) = 1-2*sin(x)^2", "All real x"],
  ["Double angle", "Cosine alternate", "cos(2*x) = 2*cos(x)^2-1", "All real x"],
  ["Half angle", "Sine half angle", "sin(x/2)^2 = (1-cos(x))/2", "All real x"],
  ["Half angle", "Cosine half angle", "cos(x/2)^2 = (1+cos(x))/2", "All real x"],
  ["Triple angle", "Triple sine", "sin(3*x) = 3*sin(x)-4*sin(x)^3", "All real x"],
  ["Triple angle", "Triple cosine", "cos(3*x) = 4*cos(x)^3-3*cos(x)", "All real x"],
  ["Product-sum", "Sine times cosine", "sin(x)*cos(y) = (sin(x+y)+sin(x-y))/2", "All real x,y"],
  ["Sum-product", "Sine sum", "sin(x)+sin(y) = 2*sin((x+y)/2)*cos((x-y)/2)", "All real x,y"]
];

let selectedFormula = null;

function renderFormulas() {
  const category = $("formulaCategory").value;
  const list = $("formulaList");
  list.replaceChildren();
  selectedFormula = null;
  out("formulaDetails", "Select a formula to see its details.");

  FORMULAS.forEach((f) => {
    if (category !== "All" && f[0] !== category) return;

    const b = document.createElement("button");
    b.textContent = f[0] + ": " + f[1];

    b.addEventListener("click", () => {
      selectedFormula = f;
      list.querySelectorAll("button").forEach((x) => {
        x.classList.toggle("selected", x === b);
      });
      out("formulaDetails",
        f[1] + "\n\nIdentity: " + f[2] +
        "\nDomain note: " + f[3]);
    });

    list.appendChild(b);
  });
}

$("formulaCategory").addEventListener("change", renderFormulas);

$("formulaToCalcBtn").addEventListener("click", () => {
  if (!selectedFormula) {
    out("formulaDetails", "Select a formula first.");
    return;
  }
  $("calcInput").value = selectedFormula[2].split("=")[0].trim();
  document.querySelector('[data-tab="calculator"]').click();
});

renderFormulas();

/* =========================================================
   IDENTITY PROOF LIBRARY
   Proof steps are supplied explicitly for known identities.
   ========================================================= */

const PROOF_LIBRARY = {
  pythagorean: {
    lhs: "sin(x)^2 + cos(x)^2",
    rhs: "1",
    title: "Pythagorean identity",
    steps: [
      "Start with the unit-circle identity: x² + y² = 1.",
      "On the unit circle, x = cos(x) and y = sin(x).",
      "Substitute these values: cos²(x) + sin²(x) = 1.",
      "Reorder the terms: sin²(x) + cos²(x) = 1.",
      "Hence proved."
    ]
  },
  "double-sine": {
    lhs: "sin(2*x)",
    rhs: "2*sin(x)*cos(x)",
    title: "Sine double-angle identity",
    steps: [
      "Use the sine addition formula: sin(A+B) = sin(A)cos(B) + cos(A)sin(B).",
      "Put A = x and B = x.",
      "sin(2x) = sin(x)cos(x) + cos(x)sin(x).",
      "Combine the equal terms: sin(2x) = 2sin(x)cos(x).",
      "Hence proved."
    ]
  },
  "double-cosine": {
    lhs: "cos(2*x)",
    rhs: "1-2*sin(x)^2",
    title: "Cosine double-angle identity",
    steps: [
      "Use cos(A+B) = cos(A)cos(B) − sin(A)sin(B).",
      "Put A = x and B = x.",
      "cos(2x) = cos²(x) − sin²(x).",
      "From sin²(x) + cos²(x) = 1, cos²(x) = 1 − sin²(x).",
      "Substitute: cos(2x) = 1 − sin²(x) − sin²(x).",
      "Therefore cos(2x) = 1 − 2sin²(x).",
      "Hence proved."
    ]
  },
  "triple-sine": {
    lhs: "sin(3*x)",
    rhs: "3*sin(x)-4*sin(x)^3",
    title: "Triple-angle sine identity",
    steps: [
      "Write sin(3x) = sin(2x+x).",
      "Use the addition formula: sin(2x+x) = sin(2x)cos(x) + cos(2x)sin(x).",
      "Substitute sin(2x) = 2sin(x)cos(x) and cos(2x) = 1 − 2sin²(x).",
      "sin(3x) = 2sin(x)cos²(x) + sin(x) − 2sin³(x).",
      "Use cos²(x) = 1 − sin²(x).",
      "Expand and collect terms to obtain 3sin(x) − 4sin³(x).",
      "Hence proved."
    ]
  },
  "addition-sine": {
    lhs: "sin(x+y)",
    rhs: "sin(x)*cos(y)+cos(x)*sin(y)",
    title: "Sine addition identity",
    steps: [
      "This is the sine addition formula.",
      "It follows from the rotation matrix or unit-circle angle-addition construction.",
      "sin(x+y) = sin(x)cos(y) + cos(x)sin(y).",
      "Hence proved."
    ]
  },
  "quotient-tangent": {
    lhs: "tan(x)",
    rhs: "sin(x)/cos(x)",
    title: "Tangent quotient identity",
    steps: [
      "By definition, tan(x) = sin(x)/cos(x).",
      "The quotient is defined only when cos(x) ≠ 0.",
      "Therefore tan(x) = sin(x)/cos(x), for cos(x) ≠ 0.",
      "Hence proved."
    ]
  }
};


function normalise(s) {
  return s.toLowerCase()
    .replace(/\s+/g, "")
    .replace(/[−–]/g, "-")
    .replace(/π/g, "pi")
    .replace(/²/g, "^2")
    .replace(/³/g, "^3")
    // Treat (sin(x))^2 as equivalent to sin(x)^2.
    .replace(/\((sin|cos|tan)\(([^()]*)\)\)\^(\d+)/g, "$1($2)^$3");
}

function loadProof(proof) {
  return proof.title + "\n\n" +
    proof.steps.map((s, i) => (i + 1) + ". " + s).join("\n");
}

$("runProofExampleBtn").addEventListener("click", () => {
  const proof = PROOF_LIBRARY[$("proofExample").value];
  if (!proof) {
    out("proofLibraryOutput", "No proof template is available.");
    return;
  }
  out("proofLibraryOutput", loadProof(proof));
});

/* =========================================================
   LIMITED SYMBOLIC IDENTITY CHECKER
   It only confirms identities matching known exact rules.
   It never uses numerical samples as a proof.
   ========================================================= */

function checkIdentity(lhs, rhs) {
  const a = normalise(lhs);
  const b = normalise(rhs);

  for (const proof of Object.values(PROOF_LIBRARY)) {
    const pL = normalise(proof.lhs);
    const pR = normalise(proof.rhs);

    if ((a === pL && b === pR) || (a === pR && b === pL)) {
      return {
        verified: true,
        message: loadProof(proof)
      };
    }
  }

  // A few additional exact pattern rules.
  const extra = [
    ["sin(-x)", "-sin(x)"],
    ["cos(-x)", "cos(x)"],
    ["tan(x)", "sin(x)/cos(x)"],
    ["sin(2*x)", "2*sin(x)*cos(x)"],
    ["cos(2*x)", "cos(x)^2-sin(x)^2"],
    ["cos(2*x)", "2*cos(x)^2-1"],
    ["1+tan(x)^2", "sec(x)^2"],
    ["1+cot(x)^2", "csc(x)^2"]
  ];

  for (const [l, r] of extra) {
    if ((a === normalise(l) && b === normalise(r)) ||
        (a === normalise(r) && b === normalise(l))) {
      return {
        verified: true,
        message:
          "Exact known identity pattern matched:\n" +
          l + " = " + r + "\n\n" +
          "Domain restrictions must be respected. " +
          "This rule match is not a general symbolic algebra proof."
      };
    }
  }

  return {
    verified: false,
    message:
      "NOT PROVED AUTOMATICALLY\n\n" +
      "No exact proof rule matched this identity.\n" +
      "This does not mean the identity is false.\n" +
      "The current browser engine is not a universal symbolic prover."
  };
}

$("proveBtn").addEventListener("click", () => {
  const lhs = $("lhsInput").value.trim();
  const rhs = $("rhsInput").value.trim();

  if (!lhs || !rhs) {
    out("identityOutput", "Enter both the left-hand and right-hand sides.");
    return;
  }

  const result = checkIdentity(lhs, rhs);
  out("identityOutput", result.message);
});

$("loadExampleBtn").addEventListener("click", () => {
  $("lhsInput").value = "sin(2*x)";
  $("rhsInput").value = "2*sin(x)*cos(x)";
  out("identityOutput", "Example loaded. Click Test Identity.");
});

/* =========================================================
   EQUATION SOLVER
   Solves sin(x)=k, cos(x)=k and tan(x)=k in an interval.
   ========================================================= */

function solveTrigEquation(fn, k, start, end, mode) {
  if (![k, start, end].every(Number.isFinite)) {
    throw new Error("Enter valid numerical values.");
  }
  if (end < start) {
    throw new Error("Interval end must be greater than start.");
  }
  if (end - start > 1000000) {
    throw new Error("The requested interval is too large.");
  }
  if (fn !== "tan" && (k < -1 || k > 1)) {
    return [];
  }

  const toUnit = mode === "degrees" ? 1 / DEG : 1;
  const period = fn === "tan" ? Math.PI : 2 * Math.PI;
  const bases = [];

  if (fn === "sin") {
    const a = Math.asin(k);
    bases.push(a, Math.PI - a);
  } else if (fn === "cos") {
    const a = Math.acos(k);
    bases.push(a, -a);
  } else {
    bases.push(Math.atan(k));
  }

  const lo = rad(start, mode);
  const hi = rad(end, mode);
  const answers = [];

  for (const base of bases) {
    const first = Math.ceil((lo - base) / period - EPS);
    const last = Math.floor((hi - base) / period + EPS);

    for (let n = first; n <= last; n++) {
      const x = base + n * period;
      const shown = x * toUnit;

      if (shown >= start - EPS && shown <= end + EPS &&
          !answers.some((v) => close(v, shown, 1e-7))) {
        answers.push(shown);
      }
    }
  }

  answers.sort((a, b) => a - b);
  return answers;
}

$("solveEquationBtn").addEventListener("click", () => {
  try {
    const fn = $("eqFunction").value;
    const k = Number($("eqValue").value);
    const start = Number($("eqStart").value);
    const end = Number($("eqEnd").value);
    const mode = $("eqAngleMode").value;

    const solutions = solveTrigEquation(fn, k, start, end, mode);

    if (!solutions.length) {
      out("equationOutput", "No solutions found in the selected interval.");
      return;
    }

    const unit = mode === "degrees" ? "°" : " radians";
    out("equationOutput",
      fn + "(x) = " + k + "\n\nSolutions:\n" +
      solutions.map((x) => fmt(x) + unit).join("\n"));
  } catch (e) {
    out("equationOutput", "ERROR\n" + e.message);
  }
});

/* =========================================================
   CONNECTION STATUS
   ========================================================= */

function updateConnectionStatus() {
  const el = $("connectionStatus");
  if (el) el.textContent = navigator.onLine ? "Online" : "Offline mode";
}

window.addEventListener("online", updateConnectionStatus);
window.addEventListener("offline", updateConnectionStatus);
updateConnectionStatus();

console.log("Advanced Trigonometry Calculator loaded.");

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("./sw.js")
      .then(() => {
        console.log("Offline support registered successfully.");
      })
      .catch((error) => {
        console.error("Service worker registration failed:", error);
      });
  });
}
