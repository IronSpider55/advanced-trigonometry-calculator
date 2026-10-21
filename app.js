
"use strict";

/* =========================================================
   ADVANCED TRIGONOMETRY CALCULATOR
   Browser-based starter engine
   No external libraries required
   ========================================================= */

const $ = (id) => document.getElementById(id);

const DEG = Math.PI / 180;
const EPS = 1e-9;

function formatNumber(value) {
  if (!Number.isFinite(value)) return String(value);
  if (Math.abs(value) < EPS) return "0";
  return Number(value.toPrecision(12)).toString();
}

function near(a, b, tolerance = EPS) {
  return Math.abs(a - b) <= tolerance;
}

function factorial(n) {
  if (!Number.isInteger(n) || n < 0 || n > 170) {
    throw new Error("Factorial requires an integer from 0 to 170.");
  }
  let result = 1;
  for (let i = 2; i <= n; i++) result *= i;
  return result;
}

/* =========================================================
   NUMERIC EXPRESSION PARSER
   Supports arithmetic, parentheses and trig functions.
   No eval() or Function() is used.
   ========================================================= */

function tokenize(source) {
  const text = source.replace(/\s+/g, "");
  const tokens = [];
  let i = 0;

  while (i < text.length) {
    const rest = text.slice(i);
    const number = rest.match(/^(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?/i);
    const identifier = rest.match(/^[a-zA-Z]+/);
    const ch = text[i];

    if (number) {
      tokens.push({ type: "number", value: Number(number[0]) });
      i += number[0].length;
    } else if (identifier) {
      tokens.push({ type: "name", value: identifier[0].toLowerCase() });
      i += identifier[0].length;
    } else if ("+-*/^%()".includes(ch)) {
      tokens.push({ type: ch, value: ch });
      i++;
    } else {
      throw new Error("Unsupported character: " + ch);
    }
  }

  return tokens;
}

const FUNCTIONS = {
  sin: (x) => Math.sin(x),
  cos: (x) => Math.cos(x),
  tan: (x) => {
    if (Math.abs(Math.cos(x)) < EPS) {
      throw new Error("tan is undefined at this angle.");
    }
    return Math.tan(x);
  },
  asin: (x) => {
    if (x < -1 || x > 1) throw new Error("asin requires a value from -1 to 1.");
    return Math.asin(x);
  },
  acos: (x) => {
    if (x < -1 || x > 1) throw new Error("acos requires a value from -1 to 1.");
    return Math.acos(x);
  },
  atan: (x) => Math.atan(x),
  sqrt: (x) => {
    if (x < 0) throw new Error("sqrt requires a non-negative value.");
    return Math.sqrt(x);
  },
  abs: (x) => Math.abs(x),
  ln: (x) => {
    if (x <= 0) throw new Error("ln requires a positive value.");
    return Math.log(x);
  },
  log: (x) => {
    if (x <= 0) throw new Error("log requires a positive value.");
    return Math.log10(x);
  },
  exp: (x) => Math.exp(x),
  sec: (x) => {
    const c = Math.cos(x);
    if (Math.abs(c) < EPS) throw new Error("sec is undefined at this angle.");
    return 1 / c;
  },
  csc: (x) => {
    const s = Math.sin(x);
    if (Math.abs(s) < EPS) throw new Error("csc is undefined at this angle.");
    return 1 / s;
  },
  cot: (x) => {
    const s = Math.sin(x);
    if (Math.abs(s) < EPS) throw new Error("cot is undefined at this angle.");
    return Math.cos(x) / s;
  }
};

function evaluateExpression(source, angleMode = "degrees") {
  const tokens = tokenize(source);
  let position = 0;

  function peek() {
    return tokens[position];
  }

  function take(type) {
    const token = peek();
    if (!token || token.type !== type) {
      throw new Error("Expected " + type + ".");
    }
    position++;
    return token;
  }

  function startsPrimary(token) {
    return token && (
      token.type === "number" ||
      token.type === "name" ||
      token.type === "("
    );
  }

  function primary() {
    const token = peek();
    if (!token) throw new Error("Unexpected end of expression.");

    if (token.type === "+") {
      position++;
      return primary();
    }

    if (token.type === "-") {
      position++;
      return -primary();
    }

    if (token.type === "number") {
      position++;
      return token.value;
    }

    if (token.type === "(") {
      position++;
      const result = expression();
      take(")");
      return result;
    }

    if (token.type === "name") {
      position++;
      const name = token.value;

      if (name === "pi") return Math.PI;
      if (name === "e") return Math.E;

      if (peek() && peek().type === "(") {
        if (!Object.prototype.hasOwnProperty.call(FUNCTIONS, name)) {
          throw new Error("Unknown function: " + name);
        }

        position++;
        const argument = expression();
        take(")");

        let x = argument;
        if (angleMode === "degrees" &&
            ["sin", "cos", "tan", "sec", "csc", "cot"].includes(name)) {
          x *= DEG;
        }

        return FUNCTIONS[name](x);
      }

      throw new Error("Unknown name: " + name);
    }

    throw new Error("Unexpected token: " + token.value);
  }

  function power() {
    let value = primary();
    if (peek() && peek().type === "^") {
      position++;
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
      const token = peek();

      if (token.type === "*") {
        position++;
        value *= unary();
      } else if (token.type === "/") {
        position++;
        const divisor = unary();
        if (Math.abs(divisor) < Number.EPSILON) {
          throw new Error("Division by zero.");
        }
        value /= divisor;
      } else if (token.type === "%") {
        position++;
        value %= unary();
      } else if (startsPrimary(token)) {
        // Supports implicit multiplication: 2sin(30) is not supported,
        // but 2*(sin(30)) is always accepted.
        throw new Error("Please write multiplication explicitly using *.");
      } else {
        break;
      }
    }

    return value;
  }

  function expression() {
    let value = term();

    while (peek() && (peek().type === "+" || peek().type === "-")) {
      const op = peek().type;
      position++;
      const right = term();
      value = op === "+" ? value + right : value - right;
    }

    return value;
  }

  if (tokens.length === 0) throw new Error("Enter an expression.");

  const result = expression();

  if (position !== tokens.length) {
    throw new Error("Unexpected token: " + tokens[position].value);
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

    document.querySelectorAll(".tab").forEach((tab) => {
      tab.classList.toggle("active", tab === button);
    });

    document.querySelectorAll(".tab-content").forEach((section) => {
      const active = section.id === target;
      section.classList.toggle("active", active);
      section.hidden = !active;
    });
  });
});

/* =========================================================
   CALCULATOR
   ========================================================= */

$("calculateBtn").addEventListener("click", () => {
  try {
    const answer = evaluateExpression($("calcInput").value, "degrees");
    $("calcOutput").textContent = "Result: " + formatNumber(answer);
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
    $("calcInput").value = button.dataset.expression;
    document.querySelector('[data-tab="calculator"]').click();
  });
});

/* =========================================================
   FORMULA LIBRARY
   ========================================================= */

const FORMULAS = [
  {
    category: "Reciprocal",
    name: "Sine and cosecant",
    lhs: "csc(x)",
    rhs: "1/sin(x)",
    text: "csc(x) = 1/sin(x), where sin(x) ≠ 0."
  },
  {
    category: "Reciprocal",
    name: "Cosine and secant",
    lhs: "sec(x)",
    rhs: "1/cos(x)",
    text: "sec(x) = 1/cos(x), where cos(x) ≠ 0."
  },
  {
    category: "Reciprocal",
    name: "Tangent and cotangent",
    lhs: "cot(x)",
    rhs: "1/tan(x)",
    text: "cot(x) = cos(x)/sin(x), where sin(x) ≠ 0."
  },
  {
    category: "Quotient",
    name: "Tangent quotient",
    lhs: "tan(x)",
    rhs: "sin(x)/cos(x)",
    text: "tan(x) = sin(x)/cos(x), where cos(x) ≠ 0."
  },
  {
    category: "Quotient",
    name: "Cotangent quotient",
    lhs: "cot(x)",
    rhs: "cos(x)/sin(x)",
    text: "cot(x) = cos(x)/sin(x), where sin(x) ≠ 0."
  },
  {
    category: "Pythagorean",
    name: "Fundamental identity",
    lhs: "sin(x)^2 + cos(x)^2",
    rhs: "1",
    text: "sin²(x) + cos²(x) = 1."
  },
  {
    category: "Pythagorean",
    name: "Tangent identity",
    lhs: "1 + tan(x)^2",
    rhs: "sec(x)^2",
    text: "1 + tan²(x) = sec²(x), where cos(x) ≠ 0."
  },
  {
    category: "Pythagorean",
    name: "Cotangent identity",
    lhs: "1 + cot(x)^2",
    rhs: "csc(x)^2",
    text: "1 + cot²(x) = csc²(x), where sin(x) ≠ 0."
  },
  {
    category: "Even/odd",
    name: "Odd sine",
    lhs: "sin(-x)",
    rhs: "-sin(x)",
    text: "sin(-x) = -sin(x)."
  },
  {
    category: "Even/odd",
    name: "Even cosine",
    lhs: "cos(-x)",
    rhs: "cos(x)",
    text: "cos(-x) = cos(x)."
  },
  {
    category: "Cofunction",
    name: "Complementary sine and cosine",
    lhs: "sin(pi/2-x)",
    rhs: "cos(x)",
    text: "sin(π/2 − x) = cos(x), with angles in radians."
  },
  {
    category: "Addition",
    name: "Sine addition",
    lhs: "sin(x+y)",
    rhs: "sin(x)*cos(y)+cos(x)*sin(y)",
    text: "sin(x + y) = sin(x)cos(y) + cos(x)sin(y)."
  },
  {
    category: "Addition",
    name: "Cosine addition",
    lhs: "cos(x+y)",
    rhs: "cos(x)*cos(y)-sin(x)*sin(y)",
    text: "cos(x + y) = cos(x)cos(y) − sin(x)sin(y)."
  },
  {
    category: "Double angle",
    name: "Sine double angle",
    lhs: "sin(2*x)",
    rhs: "2*sin(x)*cos(x)",
    text: "sin(2x) = 2sin(x)cos(x)."
  },
  {
    category: "Double angle",
    name: "Cosine double angle",
    lhs: "cos(2*x)",
    rhs: "1-2*sin(x)^2",
    text: "cos(2x) = 1 − 2sin²(x)."
  },
  {
    category: "Double angle",
    name: "Cosine double angle alternate",
    lhs: "cos(2*x)",
    rhs: "2*cos(x)^2-1",
    text: "cos(2x) = 2cos²(x) − 1."
  },
  {
    category: "Half angle",
    name: "Half-angle sine",
    lhs: "sin(x/2)^2",
    rhs: "(1-cos(x))/2",
    text: "sin²(x/2) = (1 − cos(x))/2."
  },
  {
    category: "Half angle",
    name: "Half-angle cosine",
    lhs: "cos(x/2)^2",
    rhs: "(1+cos(x))/2",
    text: "cos²(x/2) = (1 + cos(x))/2."
  },
  {
    category: "Triple angle",
    name: "Triple-angle sine",
    lhs: "sin(3*x)",
    rhs: "3*sin(x)-4*sin(x)^3",
    text: "sin(3x) = 3sin(x) − 4sin³(x)."
  },
  {
    category: "Triple angle",
    name: "Triple-angle cosine",
    lhs: "cos(3*x)",
    rhs: "4*cos(x)^3-3*cos(x)",
    text: "cos(3x) = 4cos³(x) − 3cos(x)."
  },
  {
    category: "Product-sum",
    name: "Sine times cosine",
    lhs: "sin(x)*cos(y)",
    rhs: "(sin(x+y)+sin(x-y))/2",
    text: "sin(x)cos(y) = [sin(x+y) + sin(x−y)]/2."
  },
  {
    category: "Sum-product",
    name: "Sine sum",
    lhs: "sin(x)+sin(y)",
    rhs: "2*sin((x+y)/2)*cos((x-y)/2)",
    text: "sin(x) + sin(y) = 2sin((x+y)/2)cos((x−y)/2)."
  }
];

let selectedFormula = null;

function renderFormulas() {
  const category = $("formulaCategory").value;
  const list = $("formulaList");
  list.replaceChildren();

  FORMULAS.filter((formula) =>
    category === "All" || formula.category === category
  ).forEach((formula) => {
    const button = document.createElement("button");
    button.textContent = formula.category + ": " + formula.name;

    button.addEventListener("click", () => {
      selectedFormula = formula;

      list.querySelectorAll("button").forEach((item) => {
        item.classList.toggle("selected", item === button);
      });

      $("formulaDetails").textContent =
        formula.text + "\n\nLeft side: " + formula.lhs +
        "\nRight side: " + formula.rhs;
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

  $("calcInput").value = selectedFormula.lhs;
  document.querySelector('[data-tab="calculator"]').click();
});

renderFormulas();

/* =========================================================
   BASIC PROOF TEMPLATES
   This is a starter proof engine, not a universal theorem prover.
   ========================================================= */

const PROOFS = {
  py thagorean: null
};
