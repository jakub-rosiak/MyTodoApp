// Single-file Rust CLI Todo app (no external crates).
// Usage examples:
//  cargo run -- add "Buy milk"
//  cargo run -- list
//  cargo run -- done 1
//  cargo run -- rm 2
//  cargo run -- edit 3 "New text"
//  cargo run -- clear

use std::env;
use std::fs::{self, File};
use std::io::{self, BufRead, BufReader, Write};
use std::path::PathBuf;
use std::process;

#[derive(Debug, Clone)]
struct Todo {
    id: u64,
    done: bool,
    text: String,
}

impl Todo {
    fn serialize(&self) -> String {
        // format: id|0/1|escaped_text
        format!("{}|{}|{}", self.id, if self.done { "1" } else { "0" }, escape(&self.text))
    }

    fn deserialize(s: &str) -> Option<Todo> {
        let mut parts = s.splitn(3, '|');
        let id = parts.next()?.parse::<u64>().ok()?;
        let done = match parts.next()? {
            "1" => true,
            "0" => false,
            _ => return None,
        };
        let text = unescape(parts.next()?);
        Some(Todo { id, done, text })
    }
}

fn escape(s: &str) -> String {
    // escape backslash and newline and pipe
    let mut out = String::with_capacity(s.len());
    for c in s.chars() {
        match c {
            '\\' => out.push_str("\\\\"),
            '\n' => out.push_str("\\n"),
            '|' => out.push_str("\\p"),
            '\r' => out.push_str("\\r"),
            _ => out.push(c),
        }
    }
    out
}

fn unescape(s: &str) -> String {
    let mut out = String::with_capacity(s.len());
    let mut chars = s.chars();
    while let Some(c) = chars.next() {
        if c == '\\' {
            if let Some(n) = chars.next() {
                match n {
                    '\\' => out.push('\\'),
                    'n' => out.push('\n'),
                    'r' => out.push('\r'),
                    'p' => out.push('|'),
                    other => {
                        out.push('\\');
                        out.push(other);
                    }
                }
            } else {
                out.push('\\');
            }
        } else {
            out.push(c);
        }
    }
    out
}

fn data_file_path() -> PathBuf {
    // store in current dir as ".todos"
    let mut p = env::current_dir().unwrap_or_else(|_| PathBuf::from("."));
    p.push(".todos");
    p
}

fn load_todos() -> io::Result<Vec<Todo>> {
    let path = data_file_path();
    if !path.exists() {
        return Ok(Vec::new());
    }
    let f = File::open(&path)?;
    let reader = BufReader::new(f);
    let mut todos = Vec::new();
    for line in reader.lines() {
        let line = line?;
        if line.trim().is_empty() {
            continue;
        }
        if let Some(todo) = Todo::deserialize(&line) {
            todos.push(todo);
        } else {
            eprintln!("warning: couldn't parse line: {}", line);
        }
    }
    Ok(todos)
}

fn save_todos(todos: &[Todo]) -> io::Result<()> {
    let path = data_file_path();
    let mut tmp = path.clone();
    tmp.set_extension("tmp");
    let mut f = File::create(&tmp)?;
    for t in todos {
        writeln!(f, "{}", t.serialize())?;
    }
    fs::rename(tmp, path)?;
    Ok(())
}

fn next_id(todos: &[Todo]) -> u64 {
    todos.iter().map(|t| t.id).max().unwrap_or(0) + 1
}

fn cmd_add(args: &[String]) {
    if args.is_empty() {
        eprintln!("add requires a task text. Usage: add <task text>");
        process::exit(1);
    }
    let text = args.join(" ");
    let mut todos = load_todos().unwrap_or_else(|e| { eprintln!("error loading todos: {}", e); process::exit(1); });
    let id = next_id(&todos);
    let todo = Todo { id, done: false, text };
    todos.push(todo);
    if let Err(e) = save_todos(&todos) {
        eprintln!("error saving todos: {}", e);
        process::exit(1);
    }
    println!("Added task {}", id);
}

fn cmd_list(args: &[String]) {
    let show_all = args.iter().any(|a| a == "--all" || a == "-a");
    let todos = load_todos().unwrap_or_else(|e| { eprintln!("error loading todos: {}", e); process::exit(1); });
    if todos.is_empty() {
        println!("No tasks.");
        return;
    }
    println!("ID  Done  Task");
    println!("-------------------------------");
    for t in todos {
        if !show_all && t.done {
            continue;
        }
        println!("{: <3}  {: <4}  {}", t.id, if t.done { "yes" } else { "no" }, t.text);
    }
}

fn parse_id(s: &str) -> Option<u64> {
    s.parse::<u64>().ok()
}

fn cmd_done(args: &[String]) {
    if args.len() != 1 {
        eprintln!("done requires exactly one id. Usage: done <id>");
        process::exit(1);
    }
    let id = parse_id(&args[0]).unwrap_or_else(|| { eprintln!("invalid id: {}", args[0]); process::exit(1); });
    let mut todos = load_todos().unwrap_or_else(|e| { eprintln!("error loading todos: {}", e); process::exit(1); });
    let mut found = false;
    for t in &mut todos {
        if t.id == id {
            t.done = true;
            found = true;
            break;
        }
    }
    if !found {
        eprintln!("no task with id {}", id);
        process::exit(1);
    }
    save_todos(&todos).unwrap_or_else(|e| { eprintln!("error saving todos: {}", e); process::exit(1); });
    println!("Marked {} done", id);
}

fn cmd_rm(args: &[String]) {
    if args.len() != 1 {
        eprintln!("rm requires exactly one id. Usage: rm <id>");
        process::exit(1);
    }
    let id = parse_id(&args[0]).unwrap_or_else(|| { eprintln!("invalid id: {}", args[0]); process::exit(1); });
    let mut todos = load_todos().unwrap_or_else(|e| { eprintln!("error loading todos: {}", e); process::exit(1); });
    let orig_len = todos.len();
    todos.retain(|t| t.id != id);
    if todos.len() == orig_len {
        eprintln!("no task with id {}", id);
        process::exit(1);
    }
    save_todos(&todos).unwrap_or_else(|e| { eprintln!("error saving todos: {}", e); process::exit(1); });
    println!("Removed {}", id);
}

fn cmd_edit(args: &[String]) {
    if args.len() < 2 {
        eprintln!("edit requires id and new text. Usage: edit <id> <new text>");
        process::exit(1);
    }
    let id = parse_id(&args[0]).unwrap_or_else(|| { eprintln!("invalid id: {}", args[0]); process::exit(1); });
    let new_text = args[1..].join(" ");
    let mut todos = load_todos().unwrap_or_else(|e| { eprintln!("error loading todos: {}", e); process::exit(1); });
    let mut found = false;
    for t in &mut todos {
        if t.id == id {
            t.text = new_text.clone();
            found = true;
            break;
        }
    }
    if !found {
        eprintln!("no task with id {}", id);
        process::exit(1);
    }
    save_todos(&todos).unwrap_or_else(|e| { eprintln!("error saving todos: {}", e); process::exit(1); });
    println!("Edited {}", id);
}

fn cmd_clear(_args: &[String]) {
    println!("Are you sure you want to delete ALL tasks? Type 'yes' to confirm:");
    let mut input = String::new();
    io::stdin().read_line(&mut input).unwrap();
    if input.trim() == "yes" {
        let path = data_file_path();
        if path.exists() {
            if let Err(e) = fs::remove_file(path) {
                eprintln!("error removing file: {}", e);
                process::exit(1);
            }
        }
        println!("All tasks cleared.");
    } else {
        println!("Aborted.");
    }
}

fn print_help() {
    println!("Todo CLI (single-file Rust)");
    println!();
    println!("Usage:");
    println!("  add <task text>        - add a new task");
    println!("  list [--all|-a]        - list tasks (default: pending only)");
    println!("  done <id>              - mark task done");
    println!("  rm <id>                - remove task");
    println!("  edit <id> <new text>   - edit a task's text");
    println!("  clear                  - remove all tasks (confirmation required)");
    println!("  help                   - show this help");
    println!();
    println!("Data file: .todos in the current directory.");
}

fn main() {
    let mut args: Vec<String> = env::args().collect();
    let _exe = args.remove(0);
    if args.is_empty() {
        print_help();
        return;
    }
    let cmd = args.remove(0);
    match cmd.as_str() {
        "add" => cmd_add(&args),
        "list" => cmd_list(&args),
        "done" => cmd_done(&args),
        "rm" | "remove" => cmd_rm(&args),
        "edit" => cmd_edit(&args),
        "clear" => cmd_clear(&args),
        "help" | "--help" | "-h" => print_help(),
        other => {
            eprintln!("unknown command: {}", other);
            print_help();
            process::exit(1);
        }
    }
}
