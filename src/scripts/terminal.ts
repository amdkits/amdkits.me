import { Terminal } from "xterm";

const term = new Terminal({
  cols: 40,
  rows: 16,

  fontFamily: "FiraCode Nerd Font",
  fontSize: 15,

  cursorBlink: true,
  allowTransparency: true,

  theme: {
    background: "#00000000",
    foreground: "#c5c9c5",

    cursor: "#c4746e",

    black: "#181616",
    red: "#c4746e",
    green: "#87a987",
    yellow: "#e6c384",
    blue: "#7fb4ca",
    magenta: "#938aa9",
    cyan: "#7aa89f",
    white: "#c5c9c5",
  },
});

const element = document.getElementById("terminal");

if (!element) {
  throw new Error("Terminal element not found");
}

term.open(element);

term.writeln("");
term.writeln(" kits@amdkits");
term.writeln("");
term.write("$ ");

let command = "";

term.onData((e) => {
  // Enter
  if (e === "\r") {
    execute(command);

    command = "";

    term.write("\r\n$ ");

    return;
  }

  // Backspace
  if (e === "\u007f") {
    if (command.length > 0) {
      command = command.slice(0, -1);

      term.write("\b \b");
    }

    return;
  }

  command += e;

  term.write(e);
});

function execute(cmd: string) {
  switch (cmd.trim()) {
    case "help":
      term.writeln("");
      term.writeln("about");
      term.writeln("books");
      term.writeln("projects");
      term.writeln("clear");

      break;

    case "about":
      term.writeln("");
      term.writeln("Engineering Student");
      term.writeln("Arch Linux");
      term.writeln("Beej enjoyer");

      break;

    case "books":
      term.writeln("");
      term.writeln("Kafka on the Shore");
      term.writeln("War and Peace");

      break;

    case "projects":
      term.writeln("");
      term.writeln("amdkits.me");
      term.writeln("Chat Server");
      term.writeln("Tetris");

      break;

    case "clear":
      term.clear();

      break;

    default:
      term.writeln("");
      term.writeln(`Unknown command: ${cmd}`);
  }
}
